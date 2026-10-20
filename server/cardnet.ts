/**
 * Cardnet API Consulta Web + 3DS (server-only).
 * 1. POST /sessions and keep SESSION + session-key.
 * 2. Browser POST /authorize with that SESSION and the same ReturnUrl.
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
};

export function getCardnetConfig(): CardnetConfig {
  const env = (process.env.CARDNET_ENV || "lab").toLowerCase() === "production"
    ? "production"
    : "lab";
  return {
    env,
    acquiringInstitutionCode:
      process.env.CARDNET_ACQUIRING_INSTITUTION_CODE || "349",
    merchantType: process.env.CARDNET_MERCHANT_TYPE || "7997",
    merchantNumber: process.env.CARDNET_MERCHANT_NUMBER || "349000000",
    merchantTerminal: process.env.CARDNET_MERCHANT_TERMINAL || "58585858",
    merchantTerminalAmex:
      process.env.CARDNET_MERCHANT_TERMINAL_AMEX || "00000001",
    merchantName:
      process.env.CARDNET_MERCHANT_NAME || "ERSUNNY TRAVEL",
    // 840 = USD, 214 = DOP (Postman sample used 214)
    currencyCode: process.env.CARDNET_CURRENCY_CODE || "840",
    avs:
      process.env.CARDNET_AVS ||
      "PUNTA CANA DOMINICAN REPUBLIC",
    stateSecret:
      process.env.CARDNET_STATE_SECRET ||
      process.env.CARDNET_MERCHANT_NUMBER ||
      "ersunny-cardnet-dev-secret",
  };
}

export function cardnetSessionsUrl(env: CardnetEnv) {
  return env === "production"
    ? "https://servicios.cardnet.com.do/sessions"
    : "https://labservicios.cardnet.com.do/sessions";
}

export function cardnetAuthorizeUrl(env: CardnetEnv) {
  return env === "production"
    ? "https://servicios.cardnet.com.do/authorize"
    : "https://labservicios.cardnet.com.do/authorize";
}

export function cardnetVerifyBaseUrl(env: CardnetEnv) {
  return env === "production"
    ? "https://servicios.cardnet.com.do/sessions"
    : "https://labservicios.cardnet.com.do/sessions";
}

/** Cardnet amount: minor units as string (6500 = 65.00). */
export function toCardnetAmount(usd: number): string {
  return Math.round(usd * 100).toString();
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
  pageLanguage?: "SPA" | "ENG";
  mobilePhone?: string;
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
  const transactionId = `${Date.now()}`.slice(-10);
  const body = {
    TransactionType: "200",
    CurrencyCode: config.currencyCode,
    AcquiringInstitutionCode: config.acquiringInstitutionCode,
    MerchantType: config.merchantType,
    MerchantNumber: config.merchantNumber,
    MerchantTerminal: config.merchantTerminal,
    MerchantTerminal_amex: config.merchantTerminalAmex,
    ReturnUrl: input.returnUrl,
    CancelUrl: input.cancelUrl,
    PageLanguaje: input.pageLanguage || "ENG",
    OrdenId: orderId,
    TransactionId: transactionId,
    Tax: "0",
    MerchantName: config.merchantName,
    AVS: config.avs,
    Amount: toCardnetAmount(input.amountUsd),
    MobilePhone: (input.mobilePhone || "").replace(/\D/g, "") || "18090000000",
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

/** Treat common approval codes as paid. */
export function isCardnetApproved(result: Record<string, unknown>): boolean {
  const responseCode = String(
    result.ResponseCode ??
      result.responseCode ??
      result.Response ??
      result.CreditCardTxType_ResponseCode ??
      "",
  ).trim();
  const approved = String(
    result.Approved ?? result.approved ?? result.Status ?? result.status ?? "",
  )
    .trim()
    .toLowerCase();

  if (["00", "000", "0"].includes(responseCode)) return true;
  if (["approved", "aprobada", "aprobado", "ok", "success"].includes(approved)) {
    return true;
  }
  // Some payloads nest under Transaction
  const tx = result.Transaction as Record<string, unknown> | undefined;
  if (tx) return isCardnetApproved(tx);
  return false;
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
