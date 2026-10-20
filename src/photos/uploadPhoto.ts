import type { MediaAsset } from "../../shared/media";
import { stillUrl } from "../media/urls";

type SignBody = {
  error?: string;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  publicId?: string;
};

type UploadBody = {
  public_id?: string;
  resource_type?: string;
  secure_url?: string;
  error?: { message?: string };
};

const reasons: Record<string, string> = {
  cloudinary_missing:
    "Cloudinary no está configurado. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.",
  catalog_failed: "La foto llegó a Cloudinary, pero no se pudo guardar en la biblioteca.",
  unauthorized: "La sesión expiró. Vuelve a entrar al admin.",
  upload_failed: "Cloudinary no confirmó la foto.",
};

function reason(code: string | undefined, fallback: string) {
  if (!code) return fallback;
  return reasons[code] || fallback;
}

/** Upload an image to Cloudinary and return a delivery URL. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Elige una imagen.");
  }

  const signRes = await fetch("/api/media/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType: "image" }),
  });
  const signed = (await signRes.json().catch(() => ({}))) as SignBody;
  if (!signRes.ok || !signed.cloudName || !signed.signature || !signed.publicId) {
    throw new Error(reason(signed.error, "No se pudo preparar la subida."));
  }

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signed.apiKey || "");
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("public_id", signed.publicId);
  const up = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const uploaded = (await up.json().catch(() => ({}))) as UploadBody;
  if (!up.ok || !uploaded.public_id) {
    throw new Error(uploaded.error?.message || "No se pudo subir la foto a Cloudinary.");
  }

  const saved = await fetch("/api/media/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicId: uploaded.public_id,
      resourceType: uploaded.resource_type || "image",
      filename: file.name,
    }),
  });
  const savedBody = (await saved.json().catch(() => ({}))) as {
    error?: string;
    asset?: MediaAsset;
  };
  if (saved.ok && savedBody.asset) {
    return stillUrl(savedBody.asset, 1400, undefined, "limit");
  }
  if (uploaded.secure_url) return uploaded.secure_url;
  throw new Error(reason(savedBody.error, "La foto se subió, pero no se pudo guardar."));
}
