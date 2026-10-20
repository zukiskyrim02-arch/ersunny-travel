import type { MediaAsset, MediaResourceType } from "../shared/media.js";
import { isAssignableSlot } from "../shared/media.js";
import {
  assetIdFromPublicId,
  cloudinaryCreds,
  destroyCloudinary,
  fetchCloudinaryResource,
  isManagedPublicId,
  signUpload,
} from "./cloudinary.js";
import type { ApiResult } from "./authFlow.js";
import { readMediaCatalog, updateMediaCatalog } from "./mediaCatalog.js";

function emptyLibrary() {
  return {
    cloudinary: Boolean(cloudinaryCreds()),
    assets: {} as Record<string, MediaAsset>,
    assignments: {} as Record<string, string>,
    catalogError: null as string | null,
  };
}

async function readLibrary() {
  const base = emptyLibrary();
  if (!base.cloudinary) return base;
  try {
    const node = await readMediaCatalog();
    return {
      ...base,
      assets: node.assets ?? {},
      assignments: node.assignments ?? {},
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "catalog_unavailable";
    console.error("[media] read failed", message);
    return { ...base, catalogError: message.slice(0, 180) };
  }
}

export async function publicMedia(): Promise<ApiResult> {
  const library = await readLibrary();
  return {
    status: 200,
    body: {
      assets: library.assets,
      assignments: library.assignments,
    },
  };
}

export async function adminMediaList(): Promise<ApiResult> {
  const library = await readLibrary();
  return { status: 200, body: library };
}

export function signMediaUpload(body: Record<string, unknown>): ApiResult {
  const resourceType = body.resourceType === "video" ? "video" : "image";
  if (!cloudinaryCreds()) {
    return { status: 503, body: { error: "cloudinary_missing" } };
  }
  const signed = signUpload(resourceType);
  if (!signed) return { status: 503, body: { error: "cloudinary_missing" } };
  return { status: 200, body: signed };
}

export async function registerMedia(
  body: Record<string, unknown>,
): Promise<ApiResult> {
  if (!cloudinaryCreds()) {
    return { status: 503, body: { error: "cloudinary_missing" } };
  }
  const publicId = String(body.publicId || "");
  const resourceType: MediaResourceType =
    body.resourceType === "video" ? "video" : "image";
  if (!isManagedPublicId(publicId)) {
    return { status: 400, body: { error: "invalid_asset" } };
  }
  const creds = cloudinaryCreds();
  if (!creds) return { status: 503, body: { error: "cloudinary_missing" } };

  let remote;
  try {
    remote = await fetchCloudinaryResource(publicId, resourceType);
  } catch (err) {
    console.error(
      "[media] resource lookup failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 400, body: { error: "upload_failed" } };
  }
  if (remote.public_id !== publicId) {
    return { status: 400, body: { error: "upload_failed" } };
  }

  const filename =
    String(body.filename || "media")
      .replace(/[^\w.\- ()]+/g, "")
      .slice(0, 120) || "media";
  const asset: MediaAsset = {
    id: assetIdFromPublicId(publicId),
    publicId,
    resourceType: remote.resource_type === "video" ? "video" : resourceType,
    format: remote.format || "",
    bytes: Number(remote.bytes) || 0,
    width: Number(remote.width) || 0,
    height: Number(remote.height) || 0,
    filename,
    createdAt: Date.now(),
    cloudName: creds.cloudName,
  };
  try {
    await updateMediaCatalog((node) => {
      node.assets[asset.id] = asset;
    });
  } catch (err) {
    console.error(
      "[media] save failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 503, body: { error: "catalog_failed" } };
  }
  return { status: 200, body: { ok: true, asset } };
}

export async function assignMedia(
  body: Record<string, unknown>,
): Promise<ApiResult> {
  if (!cloudinaryCreds()) {
    return { status: 503, body: { error: "cloudinary_missing" } };
  }
  const slot = String(body.slot || "");
  if (!isAssignableSlot(slot)) {
    return { status: 400, body: { error: "invalid_slot" } };
  }
  const assetId = body.assetId ? String(body.assetId) : "";
  try {
    let missing = false;
    await updateMediaCatalog((node) => {
      if (!assetId) {
        delete node.assignments[slot];
        return;
      }
      if (!node.assets[assetId]) {
        missing = true;
        return;
      }
      node.assignments[slot] = assetId;
    });
    if (missing) return { status: 404, body: { error: "invalid_asset" } };
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error(
      "[media] assign failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 503, body: { error: "catalog_failed" } };
  }
}

export async function deleteMedia(
  body: Record<string, unknown>,
): Promise<ApiResult> {
  if (!cloudinaryCreds()) {
    return { status: 503, body: { error: "cloudinary_missing" } };
  }
  const id = String(body.id || "");
  if (!id) return { status: 400, body: { error: "invalid_asset" } };
  try {
    let asset: MediaAsset | undefined;
    await updateMediaCatalog((node) => {
      asset = node.assets[id];
      for (const [slot, assetId] of Object.entries(node.assignments)) {
        if (assetId === id && isAssignableSlot(slot)) delete node.assignments[slot];
      }
      delete node.assets[id];
    });
    if (asset && cloudinaryCreds()) {
      await destroyCloudinary(asset.publicId, asset.resourceType).catch(
        (err) => {
          console.error(
            "[media] cloudinary delete failed",
            err instanceof Error ? err.message : err,
          );
        },
      );
    }
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error(
      "[media] delete failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 503, body: { error: "catalog_failed" } };
  }
}
