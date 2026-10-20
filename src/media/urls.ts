import type { MediaAsset, MediaFit } from "../../shared/media";

/** Delivery URLs. Format and quality stay in their own path segments. */
export function stillUrl(
  asset: MediaAsset,
  width: number,
  height: number | undefined,
  fit: MediaFit,
) {
  const cloud = encodeURIComponent(asset.cloudName);
  const id = asset.publicId;
  const w = Math.max(1, Math.round(width));
  if (asset.resourceType === "video") {
    const crop =
      fit === "fill" && height
        ? `so_0,c_fill,g_auto,w_${w},h_${Math.round(height)}`
        : `so_0,c_limit,w_${w}`;
    return `https://res.cloudinary.com/${cloud}/video/upload/${crop}/f_jpg/q_auto/${id}.jpg`;
  }
  const crop =
    fit === "fill" && height
      ? `c_fill,g_auto,w_${w},h_${Math.round(height)}`
      : `c_limit,w_${w}`;
  return `https://res.cloudinary.com/${cloud}/image/upload/${crop}/f_auto/q_auto/${id}`;
}

export function videoUrl(asset: MediaAsset, width: number) {
  if (asset.resourceType !== "video") return null;
  const cloud = encodeURIComponent(asset.cloudName);
  const w = Math.max(1, Math.round(width));
  return `https://res.cloudinary.com/${cloud}/video/upload/c_limit,w_${w}/vc_auto/f_auto:video/q_auto/${asset.publicId}`;
}

export function thumbUrl(asset: MediaAsset) {
  return stillUrl(asset, 480, 300, "fill");
}
