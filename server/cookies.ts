import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "ersunny_session";
export const OTP_COOKIE = "ersunny_otp";
export const RATE_COOKIE = "ersunny_rl";
export const CARDNET_COOKIE = "ersunny_cardnet";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET || "";
  return secret.length >= 16 ? secret : null;
}

function secureFlag() {
  return process.env.VERCEL ? "; Secure" : "";
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function seal(data: Record<string, unknown>, secret: string): string {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function openSeal<T extends { exp: number }>(
  token: string | null,
  secret: string,
): T | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as T;
    if (!json || typeof json.exp !== "number" || json.exp < Date.now()) {
      return null;
    }
    return json;
  } catch {
    return null;
  }
}

export function cookieHeader(name: string, value: string, maxAge: number) {
  return `${name}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secureFlag()}`;
}

export function clearCookie(name: string) {
  return cookieHeader(name, "", 0);
}

function ersunnyDomain(host: string | undefined) {
  const name = (host || "").split(":")[0].toLowerCase();
  if (name === "ersunnytravel.com" || name === "www.ersunnytravel.com") {
    return "; Domain=.ersunnytravel.com";
  }
  return "";
}

/** Survives the Cardnet redirect when the return URL drops the query token. */
export function cardnetStateCookie(state: string, host?: string) {
  return `${CARDNET_COOKIE}=${encodeURIComponent(state)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60}${ersunnyDomain(host)}${secureFlag()}`;
}

export function clearCardnetCookie(host?: string) {
  return `${CARDNET_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${ersunnyDomain(host)}${secureFlag()}`;
}

export function readCardnetState(header: string | undefined) {
  const raw = readCookie(header, CARDNET_COOKIE);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function sessionCookie(email: string, secret: string) {
  const exp = Date.now() + SESSION_SECONDS * 1000;
  return cookieHeader(
    SESSION_COOKIE,
    seal({ email, exp }, secret),
    SESSION_SECONDS,
  );
}

export function readSessionEmail(header: string | undefined): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = readCookie(header, SESSION_COOKIE);
  const data = openSeal<{ email?: string; exp: number }>(token, secret);
  if (!data || typeof data.email !== "string" || !data.email) return null;
  return data.email;
}
