/**
 * Cardnet API Consulta Web + 3DS (server-only).
 * 1. POST /sessions and keep SESSION + session-key.
 * 2. Browser POST /authorize with only the SESSION value.
 * 3. GET /sessions/{SESSION}?sk={session-key} when the shopper comes back.
 */

export type CardnetEnv = "lab" | "production";

export type CardnetConfig = {
  env: CardnetEnv;
  acquiringInstitutionCode: string;
  merchantType: string;
  merchantNumber: string;
  merchantTerminal: string;
  merchantTerminalAmex: string;
  merchantName: string;
  currencyCode: string;
  /** Address / AVS string sent to Cardnet */
  avs: string;
  /** HMAC secret used to sign return-state tokens */
  stateSecret: string;
  /** Dominican pesos per 1 US dollar. Site prices stay in USD. */
  usdDopRate: number;
};

export function getCardnetConfig(): CardnetConfig {
  const env = (process.env.CARDNET_ENV || "lab").toLowerCase() === "production"
    ? "production"
    : "lab";
  const config: CardnetConfig = {
    env,
    acquiringInstitutionCode: process.env.CARDNET_ACQUIRING_INSTITUTION_CODE || "",
    merchantType: process.env.CARDNET_MERCHANT_TYPE || "",
    merchantNumber: process.env.CARDNET_MERCHANT_NUMBER || "",
    merchantTerminal: process.env.CARDNET_MERCHANT_TERMINAL || "",
    merchantTerminalAmex: process.env.CARDNET_MERCHANT_TERMINAL_AMEX || "",
    merchantName: process.env.CARDNET_MERCHANT_NAME || "",
    currencyCode: "214",
    avs:
      process.env.CARDNET_AVS ||
      "PUNTA CANA DOMINICAN REPUBLIC",
    stateSecret: process.env.CARDNET_STATE_SECRET || "",
    usdDopRate: Number(process.env.CARDNET_USD_DOP_RATE || "") || 61.45,
  };
  if (
    !config.merchantNumber ||
    !config.merchantTerminal ||
    !config.stateSecret
  ) {
    throw new Error("Cardnet is not configured.");
  }
  return config;
}

export function cardnetSessionsUrl(env: CardnetEnv) {
  return env === "production"
    ? "https://ecommerce.cardnet.com.do/sessions"
    : "https://labservicios.cardnet.com.do/sessions";
}

export function cardnetAuthorizeUrl(env: CardnetEnv) {
  return env === "production"
    ? "https://ecommerce.cardnet.com.do/authorize"
    : "https://labservicios.cardnet.com.do/authorize";
}

export function cardnetVerifyBaseUrl(env: CardnetEnv) {
  return env === "production"
    ? "https://ecommerce.cardnet.com.do/sessions"
    : "https://labservicios.cardnet.com.do/sessions";
}

/** Cardnet amount field is 12 digits in minor units (000000000100 = 1.00). */
export function toCardnetAmount(dop: number): string {
  return String(Math.round(dop * 100)).padStart(12, "0");
}

/** Site prices are USD. Cardnet charges DOP at CARDNET_USD_DOP_RATE. */
export function usdToDop(usd: number, pesosPerDollar: number): number {
  return Math.round(usd * pesosPerDollar * 100) / 100;
}

function merchantName40(name: string): string {
  const owner = (name || "ERSUNNY TRAVEL")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 22)
    .padEnd(22, " ");
  return `${owner}${"PUNTA CANA".padEnd(13, " ")}${"DN".padEnd(3, " ")}DO`;
}

function cardnetPageLanguage(language: string | undefined): "ESP" | "ING" {
  const value = (language || "").toUpperCase();
  if (value === "ES" || value === "ESP" || value === "SPA") return "ESP";
  return "ING";
}

function cardnetIp(ip: string | undefined): string {
  const first = (ip || "").split(",")[0].trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(first)) return first.slice(0, 15);
  return "127.0.0.1";
}

function cardnetPhone(phone: string | undefined): string {
  const digits = (phone || "").replace(/\D/g, "").slice(0, 15);
  return digits || "8090000000";
}

export function sanitizeOrderId(reservationId: string): string {
  const clean = reservationId.replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
  return clean || String(Date.now()).slice(-8);
}

export type CreateSessionInput = {
  amountUsd: number;
  reservationId: string;
  returnUrl: string;
  cancelUrl: string;
  pageLanguage?: string;
  mobilePhone?: string;
  email?: string;
  clientIp?: string;
  addressLine?: string;
};

export type CardnetSessionResult = {
  session: string;
  sessionKey: string;
  raw: Record<string, unknown>;
};

function pickSessionFields(raw: Record<string, unknown>): CardnetSessionResult {
  const session = String(
    raw.SESSION ?? raw.Session ?? raw.session ?? raw.sessionId ?? "",
  ).trim();
  const sessionKey = String(
    raw["session-key"] ??
      raw.sessionKey ??
      raw.SessionKey ??
      raw.sk ??
      raw.SK ??
      "",
  ).trim();
  if (!session) {
    throw new Error(
      `Cardnet session response missing SESSION: ${JSON.stringify(raw).slice(0, 400)}`,
    );
  }
  if (!sessionKey) {
    throw new Error(
      `Cardnet session response missing session-key: ${JSON.stringify(raw).slice(0, 400)}`,
    );
  }
  return { session, sessionKey, raw };
}

export async function createCardnetSession(
  config: CardnetConfig,
  input: CreateSessionInput,
): Promise<CardnetSessionResult> {
  if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) {
    throw new Error("Invalid amount for Cardnet session.");
  }

  const orderId = sanitizeOrderId(input.reservationId);
  const transactionId = `${Date.now()}`.slice(-6);
  const phone = cardnetPhone(input.mobilePhone);
  const email = (input.email || "contact@ersunnytravel.com").slice(0, 254);
  const line1 = (input.addressLine || "PUNTA CANA").slice(0, 50);
  const dop = usdToDop(input.amountUsd, config.usdDopRate);
  const body = {
    TransactionType: "200",
    CurrencyCode: "214",
    AcquiringInstitutionCode: config.acquiringInstitutionCode,
    MerchantType: config.merchantType,
    MerchantNumber: config.merchantNumber,
    MerchantTerminal: config.merchantTerminal,
    MerchantTerminal_amex: config.merchantTerminalAmex,
    ReturnUrl: input.returnUrl,
    CancelUrl: input.cancelUrl,
    PageLanguaje: cardnetPageLanguage(input.pageLanguage),
    OrdenId: orderId,
    TransactionId: transactionId,
    Tax: "000000000000",
    MerchantName: merchantName40(config.merchantName),
    AVS: config.avs,
    Amount: toCardnetAmount(dop),
    Ipclient: cardnetIp(input.clientIp),
    MobilePhone: phone,
    "3DS_email": email,
    "3DS_mobilePhone": phone,
    "3DS_workPhone": phone,
    "3DS_homePhone": phone,
    "3DS_billAddr_line1": line1,
    "3DS_billAddr_line2": " ",
    "3DS_billAddr_line3": " ",
    "3DS_billAddr_city": "PuntaCana",
    "3DS_billAddr_state": "DN",
    "3DS_billAddr_country": "DOP",
    "3DS_billAddr_postCode": "23000",
    "3DS_shipAddr_line1": line1,
    "3DS_shipAddr_line2": " ",
    "3DS_shipAddr_line3": " ",
    "3DS_shipAddr_city": "PuntaCana",
    "3DS_shipAddr_state": "DN",
    "3DS_shipAddr_country": "DOP",
    "3DS_shipAddr_postCode": "23000",
    "3DS_transType": "01",
  };

  const res = await fetch(cardnetSessionsUrl(config.env), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Cardnet session create failed (${res.status}): ${text.slice(0, 300)}`,
    );
  }

  if (!res.ok) {
    throw new Error(
      `Cardnet session create failed (${res.status}): ${text.slice(0, 300)}`,
    );
  }

  return pickSessionFields(raw);
}

export async function verifyCardnetSession(
  config: CardnetConfig,
  session: string,
  sessionKey: string,
): Promise<Record<string, unknown>> {
  const url = `${cardnetVerifyBaseUrl(config.env)}/${encodeURIComponent(session)}?sk=${encodeURIComponent(sessionKey)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Cardnet verify failed (${res.status}): ${text.slice(0, 300)}`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `Cardnet verify failed (${res.status}): ${text.slice(0, 300)}`,
    );
  }
  return raw;
}

/** The consulta GET returns ResponseCode "00" and AuthorizationCode when the charge is approved. */
export function cardnetOutcome(result: Record<string, unknown>) {
  const responseCode = String(
    result.ResponseCode ?? result.responseCode ?? "",
  ).trim();
  const authorizationCode = String(
    result.AuthorizationCode ?? result.authorizationCode ?? "",
  ).trim();
  return {
    approved: isCardnetApproved(result),
    responseCode,
    authorizationCode,
  };
}

function nestedRecord(result: Record<string, unknown>): Record<string, unknown> | null {
  const tx = result.Transaction;
  if (tx && typeof tx === "object" && !Array.isArray(tx)) {
    return tx as Record<string, unknown>;
  }
  return null;
}

/** Cardnet approves a sale only with response code 00. */
export function isCardnetApproved(result: Record<string, unknown>): boolean {
  const responseCode = String(
    result.ResponseCode ?? result.responseCode ?? "",
  ).trim();
  if (responseCode === "00") return true;
  const nested = nestedRecord(result);
  if (!responseCode && nested) {
    return String(nested.ResponseCode ?? nested.responseCode ?? "").trim() === "00";
  }
  return false;
}

/** The order id Cardnet echoes must be the reservation that was signed into the session. */
export function cardnetOrderMatches(
  result: Record<string, unknown>,
  reservationId: string,
): boolean {
  const nested = nestedRecord(result);
  const raw = String(
    result.OrdenID ??
      result.OrdenId ??
      result.ordenId ??
      nested?.OrdenID ??
      nested?.OrdenId ??
      nested?.ordenId ??
      "",
  );
  const got = sanitizeOrderId(raw);
  const expected = sanitizeOrderId(reservationId);
  return Boolean(got && expected && got === expected);
}

/* ── signed return state (no DB needed) ─────────────────────────── */

export type CardnetStatePayload = {
  session: string;
  sk: string;
  reservationId: string;
  amount: number;
  exp: number;
};

function b64url(data: string | Uint8Array): string {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return b64url(new Uint8Array(sig));
}

export async function signCardnetState(
  secret: string,
  payload: Omit<CardnetStatePayload, "exp"> & { exp?: number },
): Promise<string> {
  const full: CardnetStatePayload = {
    ...payload,
    exp: payload.exp ?? Date.now() + 60 * 60 * 1000,
  };
  const body = b64url(JSON.stringify(full));
  const sig = await hmacSign(secret, body);
  return `${body}.${sig}`;
}

export async function verifyCardnetState(
  secret: string,
  token: string,
): Promise<CardnetStatePayload> {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Invalid Cardnet state token.");
  const expected = await hmacSign(secret, body);
  if (expected !== sig) throw new Error("Cardnet state signature mismatch.");
  const payload = JSON.parse(fromB64url(body)) as CardnetStatePayload;
  if (!payload.session || !payload.sk || !payload.reservationId) {
    throw new Error("Cardnet state incomplete.");
  }
  if (payload.exp < Date.now()) throw new Error("Cardnet state expired.");
  return payload;
}

/** The bare domain redirects with 308 and keeps POST, which the payment page rejects. */
export function cardnetPublicOrigin(origin: string): string {
  const trimmed = origin.replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    if (url.hostname === "ersunnytravel.com") {
      url.protocol = "https:";
      url.hostname = "www.ersunnytravel.com";
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}

/** Cardnet returns the browser with POST. This API answers and then sends a normal visit. */
export function cardnetReturnUrl(
  origin: string,
  reservationId: string,
  flag: "return" | "cancel",
): string {
  const url = new URL("/api/cardnet/verify", cardnetPublicOrigin(origin));
  url.searchParams.set("id", reservationId);
  url.searchParams.set("cardnet", flag);
  return url.toString();
}

export function cardnetPaymentUrl(
  origin: string,
  reservationId: string,
  flag: "return" | "cancel",
): string {
  const url = new URL("/payment", cardnetPublicOrigin(origin));
  if (reservationId) url.searchParams.set("id", reservationId);
  url.searchParams.set("cardnet", flag);
  return url.toString();
}
