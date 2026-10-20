import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onValue, ref } from "firebase/database";
import { logoSrc } from "../assets";
import { getDb } from "../firebase";
import {
  excursionSlotId,
  slotDef,
  type MediaAsset,
  type MediaFit,
} from "../../shared/media";
import { stillUrl, videoUrl } from "./urls";

type Library = {
  assets: Record<string, MediaAsset>;
  assignments: Record<string, string>;
};

type MediaContextValue = {
  image: (
    slot: string,
    fallback: string,
    width?: number,
    fit?: MediaFit,
  ) => string;
  video: (slot: string, width?: number) => string | null;
  has: (slot: string) => boolean;
  absolute: (slot: string, width?: number) => string | undefined;
  excursionImage: (id: string, fallback: string, width?: number) => string;
};

const EMPTY: Library = { assets: {}, assignments: {} };

const MediaContext = createContext<MediaContextValue | null>(null);

function isAsset(value: unknown): value is MediaAsset {
  if (!value || typeof value !== "object") return false;
  const asset = value as MediaAsset;
  return (
    typeof asset.publicId === "string" &&
    typeof asset.cloudName === "string" &&
    (asset.resourceType === "image" || asset.resourceType === "video")
  );
}

function normalize(value: unknown): Library | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as {
    assets?: Record<string, unknown>;
    assignments?: Record<string, unknown>;
  };
  if (!raw.assets && !raw.assignments) return null;
  const assets: Record<string, MediaAsset> = {};
  for (const [id, asset] of Object.entries(raw.assets ?? {})) {
    if (isAsset(asset)) assets[id] = { ...asset, id: asset.id || id };
  }
  const assignments: Record<string, string> = {};
  for (const [slot, assetId] of Object.entries(raw.assignments ?? {})) {
    if (typeof assetId === "string" && assetId) assignments[slot] = assetId;
  }
  return { assets, assignments };
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [lib, setLib] = useState<Library>(EMPTY);

  useEffect(() => {
    let remote = false;
    let cancelled = false;

    function apply(value: unknown, fromFirebase: boolean) {
      const next = normalize(value);
      if (!next) return;
      if (fromFirebase) remote = true;
      if (!fromFirebase && remote) return;
      setLib(next);
    }

    const database = getDb();
    const stop = database
      ? onValue(
          ref(database, "media"),
          (snap) => apply(snap.exists() ? snap.val() : null, true),
          () => {
            /* Rules may not be published yet; /api/media/public still fills in. */
          },
        )
      : () => undefined;

    async function pull() {
      try {
        const res = await fetch("/api/media/public", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        apply(await res.json(), false);
      } catch {
        /* The page keeps the built-in images. */
      }
    }

    void pull();
    const timer = window.setInterval(() => void pull(), 15000);
    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      void pull();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      stop();
    };
  }, []);

  const api = useMemo<MediaContextValue>(() => {
    function assetFor(slot: string) {
      const id = lib.assignments[slot];
      if (!id) return null;
      return lib.assets[id] ?? null;
    }

    return {
      has(slot) {
        return Boolean(assetFor(slot));
      },
      image(slot, fallback, width, fit) {
        const asset = assetFor(slot);
        if (!asset) return fallback;
        const def = slotDef(slot);
        return stillUrl(
          asset,
          width ?? def.width,
          def.height,
          fit ?? def.fit,
        );
      },
      video(slot, width) {
        const def = slotDef(slot);
        if (def.kind !== "video") return null;
        const asset = assetFor(slot);
        if (!asset) return null;
        return videoUrl(asset, width ?? def.width);
      },
      absolute(slot, width) {
        const asset = assetFor(slot);
        if (!asset) return undefined;
        const def = slotDef(slot);
        return stillUrl(asset, width ?? def.width, def.height, def.fit);
      },
      excursionImage(id, fallback, width) {
        const asset = assetFor(excursionSlotId(id));
        if (!asset) return fallback;
        return stillUrl(asset, width ?? 1200, undefined, "limit");
      },
    };
  }, [lib]);

  return <MediaContext.Provider value={api}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (ctx) return ctx;
  return {
    image: (_slot: string, fallback: string) => fallback,
    video: () => null,
    has: () => false,
    absolute: () => undefined,
    excursionImage: (_id: string, fallback: string) => fallback,
  } satisfies MediaContextValue;
}

export function useLogoSrc() {
  const media = useMedia();
  return media.image("logo", logoSrc(), 480);
}
