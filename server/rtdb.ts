import { createSign } from "node:crypto";

/**
 * Server-only Realtime Database access.
 * A Firebase service-account access token bypasses security rules, so client
 * writes stay locked in database.rules.json.
 */

type ServiceAccount = {
  email: string;
  privateKey: string;
};

let cachedToken: { value: string; exp: number } | null = null;
let pendingToken: Promise<string> | null = null;

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) return null;
    return { email: parsed.client_email, privateKey: parsed.private_key };
  } catch {
    return null;
  }
}

export function databaseUrl() {
  return (
    process.env.FIREBASE_DATABASE_URL ||
    process.env.VITE_FIREBASE_DATABASE_URL ||
    ""
  ).replace(/\/$/, "");
}

export function firebaseAdminReady() {
  return Boolean(serviceAccount());
}

function b64url(data: string | Buffer) {
  return Buffer.from(data).toString("base64url");
}

async function mintAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: account.email,
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/firebase.database",
      ].join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const jwt = `${unsigned}.${signer.sign(account.privateKey).toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `Google auth failed (${res.status})`,
    );
  }
  const ttl = Math.max(60, (data.expires_in || 3600) - 120);
  cachedToken = { value: data.access_token, exp: Date.now() + ttl * 1000 };
  return data.access_token;
}

async function accessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const account = serviceAccount();
  if (!account) throw new Error("Firebase service account is not configured.");
  if (!pendingToken) {
    pendingToken = mintAccessToken(account).finally(() => {
      pendingToken = null;
    });
  }
  return pendingToken;
}

function nodeUrl(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const encoded = clean
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${databaseUrl()}/${encoded}.json`;
}

async function request(path: string, method: string, body?: unknown) {
  const token = await accessToken();
  const res = await fetch(nodeUrl(path), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text.slice(0, 240) || `Realtime Database ${res.status}`);
  }
  if (!text || text === "null") return null;
  return JSON.parse(text) as unknown;
}

export async function rtdbGet<T>(path: string): Promise<T | null> {
  return (await request(path, "GET")) as T | null;
}

export async function rtdbSet(path: string, value: unknown) {
  await request(path, "PUT", value);
}

export async function rtdbRemove(path: string) {
  await request(path, "DELETE");
}
