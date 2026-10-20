import type { MediaAsset } from "../shared/media.js";
import { downloadRawJson, uploadRawJson } from "./cloudinary.js";

const CATALOG_ID = "ersunny/catalog";

export type MediaNode = {
  assets?: Record<string, MediaAsset>;
  assignments?: Record<string, string>;
};

type Catalog = {
  assets: Record<string, MediaAsset>;
  assignments: Record<string, string>;
};

let chain: Promise<void> = Promise.resolve();

export async function readMediaCatalog(): Promise<MediaNode> {
  const text = await downloadRawJson(CATALOG_ID);
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as MediaNode;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export async function updateMediaCatalog(mutate: (node: Catalog) => void) {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = chain;
  chain = gate;
  await previous;
  try {
    const current = await readMediaCatalog();
    const node: Catalog = {
      assets: { ...(current.assets ?? {}) },
      assignments: { ...(current.assignments ?? {}) },
    };
    mutate(node);
    await uploadRawJson(CATALOG_ID, JSON.stringify(node));
  } finally {
    release();
  }
}
