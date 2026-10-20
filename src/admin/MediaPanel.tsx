import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MEDIA_SLOTS, excursionSlotId, type MediaAsset } from "../../shared/media";
import { useI18n } from "../i18n/I18nProvider";
import { getConfig, saveConfig } from "../store/config";
import { useAppConfig } from "../store/hooks";
import { adminCopy, adminError } from "./copy";
import { stillUrl, thumbUrl } from "../media/urls";

type LibraryResponse = {
  cloudinary: boolean;
  catalogError?: string | null;
  assets?: Record<string, MediaAsset>;
  assignments?: Record<string, string>;
  error?: string;
};

const MAX_BYTES = 80 * 1024 * 1024;

export function MediaPanel() {
  const { locale } = useI18n();
  const copy = adminCopy(locale);
  const { excursions } = useAppConfig();
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");
  const [when, setWhen] = useState<"all" | "week" | "month">("all");
  const [sort, setSort] = useState<"name" | "new">("name");
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/media", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as LibraryResponse;
    if (res.status === 401) {
      setError(copy.sessionExpired);
      return;
    }
    if (!res.ok) {
      setError(adminError(copy, body.error || "generic"));
      return;
    }
    setData(body);
  }, [copy]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/media", { credentials: "include" });
        const body = (await res.json().catch(() => ({}))) as LibraryResponse;
        if (cancelled) return;
        if (res.status === 401) {
          setError(copy.sessionExpired);
          return;
        }
        if (!res.ok) {
          setError(adminError(copy, body.error || "generic"));
          return;
        }
        setData(body);
      } catch {
        if (!cancelled) setError(copy.errors.generic);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy]);

  const assets = useMemo(
    () =>
      Object.values(data?.assets ?? {}).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      ),
    [data],
  );
  const assignments = data?.assignments ?? {};
  const ready = Boolean(data?.cloudinary && !data.catalogError);
  const es = locale === "es";

  const shown = useMemo(() => {
    const now = Date.now();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const q = query.trim().toLowerCase();
    const list = assets.filter((asset) => {
      if (q && !`${asset.filename} ${asset.publicId}`.toLowerCase().includes(q)) {
        return false;
      }
      if (when === "week" && now - (asset.createdAt || 0) > 7 * 24 * 60 * 60 * 1000) {
        return false;
      }
      if (when === "month" && (asset.createdAt || 0) < monthStart.getTime()) {
        return false;
      }
      const usedIn = Object.entries(assignments)
        .filter(([, id]) => id === asset.id)
        .map(([slot]) => slot);
      if (slotFilter === "none") return usedIn.length === 0;
      if (slotFilter !== "all") return usedIn.includes(slotFilter);
      return true;
    });
    list.sort((a, b) =>
      sort === "name"
        ? a.filename.localeCompare(b.filename, es ? "es" : "en")
        : (b.createdAt || 0) - (a.createdAt || 0),
    );
    return list;
  }, [assets, assignments, query, slotFilter, when, sort, es]);

  const slots = useMemo(() => {
    const fixed = MEDIA_SLOTS.map((slot) => ({
      id: slot.id,
      label: copy.slots[slot.id]?.label ?? slot.id,
      hint: copy.slots[slot.id]?.hint ?? "",
      kind: slot.kind,
    }));
    const tours = excursions.map((item) => ({
      id: excursionSlotId(item.id),
      label: item.title || item.id,
      hint: locale === "es" ? "Portada de la excursión" : "Excursion cover",
      kind: "image" as const,
    }));
    return [...fixed, ...tours];
  }, [copy.slots, excursions, locale]);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(copy.tooBig);
      return;
    }
    setError("");
    setBusy("upload");
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    try {
      const signRes = await fetch("/api/media/sign", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType }),
      });
      const signed = (await signRes.json().catch(() => ({}))) as {
        error?: string;
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        signature?: string;
        publicId?: string;
      };
      if (!signRes.ok || !signed.cloudName || !signed.signature || !signed.publicId) {
        setError(adminError(copy, signed.error || "generic"));
        return;
      }
      const form = new FormData();
      form.set("file", file);
      form.set("api_key", signed.apiKey || "");
      form.set("timestamp", String(signed.timestamp));
      form.set("signature", signed.signature);
      form.set("public_id", signed.publicId);
      const up = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`,
        { method: "POST", body: form },
      );
      const uploaded = (await up.json().catch(() => ({}))) as {
        public_id?: string;
        resource_type?: string;
        error?: { message?: string };
      };
      if (!up.ok || !uploaded.public_id) {
        setError(uploaded.error?.message || copy.errors.upload_failed);
        return;
      }
      const saved = await fetch("/api/media/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: uploaded.public_id,
          resourceType: uploaded.resource_type || resourceType,
          filename: file.name,
        }),
      });
      const savedBody = (await saved.json().catch(() => ({}))) as { error?: string };
      if (!saved.ok) {
        setError(adminError(copy, savedBody.error || "upload_failed"));
        return;
      }
      await load();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy("");
    }
  }

  async function assign(slot: string, assetId: string) {
    setError("");
    setBusy(slot);
    try {
      const res = await fetch("/api/media/assign", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, assetId: assetId || null }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(adminError(copy, body.error || "generic"));
        return;
      }
      if (slot.startsWith("excursion:")) {
        const excursionId = slot.slice("excursion:".length);
        const asset = assetId ? data?.assets?.[assetId] : undefined;
        if (asset) {
          const config = getConfig();
          const image = stillUrl(asset, 1400, undefined, "limit");
          saveConfig({
            ...config,
            excursions: config.excursions.map((item) =>
              item.id === excursionId ? { ...item, image } : item,
            ),
          });
        }
      }
      await load();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy("");
    }
  }

  async function remove(id: string) {
    const asset = data?.assets?.[id];
    const name = asset?.filename || id;
    if (!window.confirm(`${copy.delete} ${name}?`)) return;
    setError("");
    setBusy(id);
    try {
      const res = await fetch("/api/media/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(adminError(copy, body.error || "generic"));
        return;
      }
      await load();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>{es ? "Galería" : "Gallery"}</h1>
          <p>
            {es
              ? "Fotos y videos del sitio. Elige una imagen para asignarla a un apartado."
              : "Site photos and videos. Open one to place it in a section."}
          </p>
        </div>
      </header>

      {data && !data.cloudinary && (
        <p className="admin-banner">{copy.cloudinaryMissing}</p>
      )}
      {data?.catalogError && (
        <p className="admin-banner">{copy.errors.catalog_failed}</p>
      )}
      {!data && !error && <p className="admin-note">{copy.loading}</p>}
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-gallery__bar">
        <select
          value={when}
          onChange={(event) => setWhen(event.target.value as typeof when)}
          aria-label={es ? "Fecha" : "Date"}
        >
          <option value="all">{es ? "Todas las fechas" : "All dates"}</option>
          <option value="week">{es ? "Últimos 7 días" : "Last 7 days"}</option>
          <option value="month">{es ? "Este mes" : "This month"}</option>
        </select>
        <select
          value={slotFilter}
          onChange={(event) => setSlotFilter(event.target.value)}
          aria-label={es ? "Apartado" : "Section"}
        >
          <option value="all">{es ? "Todos los apartados" : "All sections"}</option>
          <option value="none">{es ? "Sin asignar" : "Unassigned"}</option>
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
        <label className="admin-gallery__search">
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={es ? "Buscar foto o video…" : "Search photo or video…"}
          />
        </label>
        <label className="admin-gallery__sort">
          <span>{es ? "Orden" : "Sort by"}</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
          >
            <option value="name">{es ? "Nombre" : "Name"}</option>
            <option value="new">{es ? "Recientes" : "Newest"}</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!ready || busy === "upload"}
          onClick={() => fileRef.current?.click()}
        >
          {busy === "upload" ? copy.uploading : es ? "+ Agregar imagen" : "+ Add image"}
        </button>
        <input
          ref={fileRef}
          className="admin-gallery__file"
          type="file"
          accept="image/*,video/*"
          disabled={!ready || busy === "upload"}
          onChange={(ev) => {
            void upload(ev.target.files?.[0]);
            ev.target.value = "";
          }}
        />
      </div>

      {data && shown.length === 0 ? (
        <p className="admin-note">
          {assets.length === 0 ? copy.emptyLibrary : es ? "Nada coincide con ese filtro." : "Nothing matches that filter."}
        </p>
      ) : (
        <div className="admin-gallery">
          {shown.map((asset) => {
            const used = slots.filter((slot) => assignments[slot.id] === asset.id);
            const open = openId === asset.id;
            return (
              <article
                key={asset.id}
                className={`admin-gallery__card${open ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="admin-gallery__shot"
                  onClick={() => setOpenId(open ? null : asset.id)}
                >
                  <img src={thumbUrl(asset)} alt="" />
                  {asset.resourceType === "video" && (
                    <span className="admin-gallery__badge">Video</span>
                  )}
                </button>
                <div className="admin-gallery__meta">
                  <strong title={prettyName(asset.filename)}>
                    {prettyName(asset.filename)}
                  </strong>
                  <small>
                    {used.length
                      ? used.map((slot) => slot.label).join(" · ")
                      : es
                        ? "Sin asignar"
                        : "Unassigned"}
                  </small>
                </div>
                {open && (
                  <div className="admin-gallery__edit">
                    <label>
                      {es ? "Usar en" : "Use in"}
                      <select
                        defaultValue=""
                        disabled={!ready || Boolean(busy)}
                        onChange={(event) => {
                          const slot = event.target.value;
                          event.target.value = "";
                          if (slot) void assign(slot, asset.id);
                        }}
                      >
                        <option value="">{es ? "Elegir apartado…" : "Choose section…"}</option>
                        {slots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {used.length > 0 && (
                      <div className="admin-gallery__used">
                        {used.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={busy === slot.id}
                            onClick={() => void assign(slot.id, "")}
                          >
                            {slot.label} ×
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className="admin-danger"
                      disabled={busy === asset.id}
                      onClick={() => void remove(asset.id)}
                    >
                      {busy === asset.id ? copy.deleting : copy.delete}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function prettyName(filename: string) {
  const base = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim();
  if (!base) return filename;
  if (/^[a-f0-9]{24,}$/i.test(base.replace(/\s+/g, ""))) return "Foto";
  return base;
}
