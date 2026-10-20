import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";

type CloudinaryResource = {
  public_id?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  secure_url?: string;
};

type CloudinaryError = {
  message?: string;
  http_code?: number;
  error?: { message?: string; http_code?: number };
};

type CloudinaryV2 = {
  config: (opts: {
    cloud_name: string;
    api_key: string;
    api_secret: string;
    secure: boolean;
  }) => void;
  utils: {
    api_sign_request: (
      params: Record<string, string | number>,
      apiSecret: string,
    ) => string;
  };
  api: {
    resource: (
      publicId: string,
      options: { resource_type: string },
    ) => Promise<CloudinaryResource>;
  };
  uploader: {
    destroy: (
      publicId: string,
      options: { resource_type: string; invalidate: boolean },
    ) => Promise<{ result?: string }>;
    upload_stream: (
      options: {
        resource_type: "raw";
        public_id: string;
        overwrite: boolean;
        invalidate: boolean;
      },
      callback: (error?: CloudinaryError, result?: { secure_url?: string }) => void,
    ) => { end: (chunk: Buffer) => void };
  };
};

const require = createRequire(import.meta.url);
const cloudinary = require("cloudinary").v2 as CloudinaryV2;

export type CloudinaryCreds = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function cloudinaryCreds(): CloudinaryCreds | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function configured(): CloudinaryV2 {
  const creds = cloudinaryCreds();
  if (!creds) throw new Error("Cloudinary is not configured.");
  cloudinary.config({
    cloud_name: creds.cloudName,
    api_key: creds.apiKey,
    api_secret: creds.apiSecret,
    secure: true,
  });
  return cloudinary;
}

const PUBLIC_ID = /^ersunny\/m_\d+_[a-f0-9]{8}$/;

export function isManagedPublicId(publicId: string) {
  return PUBLIC_ID.test(publicId);
}

export function assetIdFromPublicId(publicId: string) {
  return publicId.replaceAll("/", "__");
}

export function signUpload(resourceType: "image" | "video") {
  const creds = cloudinaryCreds();
  if (!creds) return null;
  const cld = configured();
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `ersunny/m_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const params = { public_id: publicId, timestamp };
  const signature = cld.utils.api_sign_request(params, creds.apiSecret);
  return {
    cloudName: creds.cloudName,
    apiKey: creds.apiKey,
    timestamp,
    signature,
    publicId,
    resourceType,
  };
}

export async function fetchCloudinaryResource(
  publicId: string,
  resourceType: "image" | "video",
) {
  const cld = configured();
  return cld.api.resource(publicId, { resource_type: resourceType });
}

function isMissingResource(err: unknown) {
  const error = err as CloudinaryError;
  const code = error?.http_code || error?.error?.http_code;
  const message = `${error?.message || ""} ${error?.error?.message || ""}`.toLowerCase();
  return code === 404 || message.includes("not found");
}

export async function uploadRawJson(publicId: string, json: string) {
  const cld = configured();
  await new Promise<void>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        overwrite: true,
        invalidate: true,
      },
      (error) => (error ? reject(error) : resolve()),
    );
    stream.end(Buffer.from(json));
  });
}

export async function downloadRawJson(publicId: string): Promise<string | null> {
  const cld = configured();
  try {
    const resource = await cld.api.resource(publicId, { resource_type: "raw" });
    if (!resource.secure_url) return null;
    const res = await fetch(`${resource.secure_url}?t=${Date.now()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Catalog download failed (${res.status}).`);
    return await res.text();
  } catch (err) {
    if (isMissingResource(err)) return null;
    throw err;
  }
}

export async function destroyCloudinary(
  publicId: string,
  resourceType: "image" | "video",
) {
  const cld = configured();
  await cld.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}
