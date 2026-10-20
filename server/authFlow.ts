import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import {
  OTP_COOKIE,
  RATE_COOKIE,
  clearCookie,
  cookieHeader,
  openSeal,
  readCookie,
  seal,
  sessionCookie,
  sessionSecret,
} from "./cookies.js";
import { firebaseAdminReady, rtdbGet, rtdbRemove, rtdbSet } from "./rtdb.js";

export type ApiResult = {
  status: number;
  body: Record<string, unknown>;
  cookies?: string[];
};

type CodeRec = {
  id: string;
  hash: string;
  exp: number;
  attempts: number;
  used: boolean;
};

type RateMap = Record<string, { count: number; start: number }>;

const WINDOW_MS = 15 * 60 * 1000;
const CODE_MS = 10 * 60 * 1000;
const spentIds = new Set<string>();
const memoryRates = new Map<string, { count: number; start: number }>();

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function secrets() {
  return sessionSecret();
}

function allowlist() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(/[,;\s]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function authConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM &&
      secrets() &&
      allowlist().size > 0,
  );
}

function hashCode(email: string, code: string, secret: string) {
  return createHmac("sha256", secret).update(`otp:${email}:${code}`).digest("hex");
}

function sameHash(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function emailKey(email: string) {
  return sha256(email);
}

function normalizeEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

async function loadRateMap(cookieHeader: string | undefined, secret: string) {
  const fromCookie = openSeal<{ exp: number; hits?: RateMap }>(
    readCookie(cookieHeader, RATE_COOKIE),
    secret,
  );
  let hits: RateMap = fromCookie?.hits ? { ...fromCookie.hits } : {};
  if (firebaseAdminReady()) {
    try {
      const remote = await rtdbGet<RateMap>("authRate");
      if (remote) hits = { ...hits, ...remote };
    } catch (err) {
      console.error(
        "[auth] rate read failed",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return hits;
}

async function persistRate(hits: RateMap, secret: string): Promise<string> {
  const now = Date.now();
  const fresh: RateMap = {};
  for (const [key, value] of Object.entries(hits)) {
    if (now - value.start < WINDOW_MS) fresh[key] = value;
  }
  if (firebaseAdminReady()) {
    try {
      await rtdbSet("authRate", fresh);
    } catch (err) {
      console.error(
        "[auth] rate write failed",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return cookieHeader(
    RATE_COOKIE,
    seal({ exp: now + WINDOW_MS, hits: fresh }, secret),
    Math.ceil(WINDOW_MS / 1000),
  );
}

async function consumeLimits(
  checks: { key: string; limit: number }[],
  cookieHeader: string | undefined,
  secret: string,
): Promise<{ ok: boolean; cookie: string }> {
  const now = Date.now();
  const hits = await loadRateMap(cookieHeader, secret);
  for (const check of checks) {
    const mem = memoryRates.get(check.key);
    const hashed = sha256(check.key);
    const current = hits[hashed];
    const memCount =
      mem && now - mem.start < WINDOW_MS ? mem.count : 0;
    const storedCount =
      current && now - current.start < WINDOW_MS ? current.count : 0;
    if (Math.max(memCount, storedCount) >= check.limit) {
      return { ok: false, cookie: await persistRate(hits, secret) };
    }
  }
  for (const check of checks) {
    const hashed = sha256(check.key);
    const current = hits[hashed];
    const inWindow = Boolean(current && now - current.start < WINDOW_MS);
    const next = {
      count: (inWindow && current ? current.count : 0) + 1,
      start: inWindow && current ? current.start : now,
    };
    hits[hashed] = next;
    memoryRates.set(check.key, next);
  }
  return { ok: true, cookie: await persistRate(hits, secret) };
}

async function saveCode(email: string, rec: CodeRec) {
  if (firebaseAdminReady()) {
    await rtdbSet(`authCodes/${emailKey(email)}`, rec);
    return;
  }
}

async function readCode(
  email: string,
  cookieHeader: string | undefined,
  secret: string,
): Promise<CodeRec | null> {
  if (firebaseAdminReady()) {
    return rtdbGet<CodeRec>(`authCodes/${emailKey(email)}`);
  }
  const sealed = openSeal<CodeRec & { exp: number; email?: string }>(
    readCookie(cookieHeader, OTP_COOKIE),
    secret,
  );
  if (!sealed || sealed.email !== email) return null;
  return {
    id: sealed.id,
    hash: sealed.hash,
    exp: sealed.exp,
    attempts: sealed.attempts,
    used: sealed.used,
  };
}

function otpCookie(email: string, rec: CodeRec, secret: string) {
  const maxAge = Math.max(1, Math.ceil((rec.exp - Date.now()) / 1000));
  return cookieHeader(
    OTP_COOKIE,
    seal({ ...rec, email, exp: rec.exp }, secret),
    maxAge,
  );
}

async function sendEmail(email: string, code: string) {
  const from = process.env.RESEND_FROM || "";
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from,
    to: email,
    subject: "Ersunny Travel — código de acceso / access code",
    text: [
      `Tu código de acceso al panel es: ${code}`,
      "Caduca en 10 minutos y solo puede usarse una vez.",
      "",
      `Your admin access code is: ${code}`,
      "It expires in 10 minutes and can be used only once.",
      "",
      "Si no pediste este código, ignora este mensaje.",
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function requestAdminCode(
  body: Record<string, unknown>,
  cookieHeader: string | undefined,
  ip: string,
): Promise<ApiResult> {
  const email = normalizeEmail(body.email);
  if (!email) return { status: 400, body: { error: "invalid_email" } };
  const secret = secrets();
  if (!authConfigured() || !secret) {
    return { status: 503, body: { error: "not_configured" } };
  }

  const limited = await consumeLimits(
    [
      { key: `req:${email}`, limit: 5 },
      { key: `req-ip:${ip}`, limit: 20 },
    ],
    cookieHeader,
    secret,
  );
  const cookies = [limited.cookie];
  if (!limited.ok) {
    return { status: 429, body: { error: "rate_limited" }, cookies };
  }

  if (!allowlist().has(email)) {
    return { status: 200, body: { ok: true }, cookies };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const rec: CodeRec = {
    id: randomInt(0, 1_000_000_000).toString(36) + Date.now().toString(36),
    hash: hashCode(email, code, secret),
    exp: Date.now() + CODE_MS,
    attempts: 0,
    used: false,
  };

  try {
    await saveCode(email, rec);
  } catch (err) {
    console.error(
      "[auth] code store failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 503, body: { error: "store_failed" }, cookies };
  }

  try {
    await sendEmail(email, code);
  } catch (err) {
    console.error(
      "[auth] resend failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 502, body: { error: "send_failed" }, cookies };
  }

  if (!firebaseAdminReady()) {
    cookies.push(otpCookie(email, rec, secret));
  }
  return { status: 200, body: { ok: true }, cookies };
}

export async function verifyAdminCode(
  body: Record<string, unknown>,
  cookieHeader: string | undefined,
  ip: string,
): Promise<ApiResult> {
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").replace(/\D/g, "");
  const secret = secrets();
  if (!authConfigured() || !secret) {
    return { status: 503, body: { error: "not_configured" } };
  }
  if (!email || code.length !== 6) {
    return { status: 401, body: { error: "invalid_code" } };
  }

  const limited = await consumeLimits(
    [
      { key: `ver:${email}`, limit: 8 },
      { key: `ver-ip:${ip}`, limit: 30 },
    ],
    cookieHeader,
    secret,
  );
  const cookies = [limited.cookie];
  if (!limited.ok) {
    return { status: 429, body: { error: "rate_limited" }, cookies };
  }

  let rec: CodeRec | null;
  try {
    rec = await readCode(email, cookieHeader, secret);
  } catch (err) {
    console.error(
      "[auth] code read failed",
      err instanceof Error ? err.message : err,
    );
    return { status: 503, body: { error: "store_failed" }, cookies };
  }
  const invalid = { status: 401, body: { error: "invalid_code" }, cookies };
  if (!rec || rec.used || rec.exp < Date.now() || rec.attempts >= 5) {
    return invalid;
  }
  if (spentIds.has(rec.id)) return invalid;
  if (!sameHash(rec.hash, hashCode(email, code, secret))) {
    const next = { ...rec, attempts: rec.attempts + 1, used: rec.attempts + 1 >= 5 };
    try {
      if (firebaseAdminReady()) await rtdbSet(`authCodes/${emailKey(email)}`, next);
    } catch (err) {
      console.error(
        "[auth] attempt write failed",
        err instanceof Error ? err.message : err,
      );
    }
    if (!firebaseAdminReady()) cookies.push(otpCookie(email, next, secret));
    return { ...invalid, cookies };
  }

  spentIds.add(rec.id);
  try {
    if (firebaseAdminReady()) await rtdbRemove(`authCodes/${emailKey(email)}`);
  } catch (err) {
    console.error(
      "[auth] code delete failed",
      err instanceof Error ? err.message : err,
    );
  }
  cookies.push(sessionCookie(email, secret));
  cookies.push(clearCookie(OTP_COOKIE));
  return { status: 200, body: { ok: true, email }, cookies };
}
