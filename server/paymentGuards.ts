/** Shared checks for card and PayPal charges. A return URL never counts as payment. */

export const MAX_CHARGE_USD = 10_000;
const WINDOW_MS = 15 * 60 * 1000;

const RESERVATION_ID = /^[A-Z0-9-]{4,20}$/;
const PAYPAL_ORDER_ID = /^[A-Z0-9]{10,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hits = new Map<string, { start: number; count: number }>();

export function paymentAllowsAnyOrigin(): false {
  return false;
}

/** Opening the success page, by itself, is not a payment. */
export function approvalFromBrowserReturn(): false {
  return false;
}

export function parseReservationId(value: unknown): string | null {
  const id = String(value || "").trim().toUpperCase();
  if (!RESERVATION_ID.test(id)) return null;
  return id;
}

export function parsePayPalOrderId(value: unknown): string | null {
  const id = String(value || "").trim();
  if (!PAYPAL_ORDER_ID.test(id)) return null;
  return id;
}

export function parseEmail(value: unknown): string | null {
  const email = String(value || "").trim().toLowerCase();
  if (!email) return null;
  if (email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

export function parseAmountUsd(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_CHARGE_USD) return null;
  return Math.round(amount * 100) / 100;
}

export function amountsMatch(expected: number, actual: number): boolean {
  const left = parseAmountUsd(expected);
  const right = parseAmountUsd(actual);
  if (left == null || right == null) return false;
  return Math.round(left * 100) === Math.round(right * 100);
}

export function canChargeStoredPrice(
  stored: number | null,
  requested: number,
): boolean {
  if (stored == null) return false;
  return amountsMatch(stored, requested);
}

export function shouldMarkReservationPaid(input: {
  providerApproved: boolean;
  orderMatches: boolean;
  amountMatches: boolean;
}): boolean {
  return input.providerApproved && input.orderMatches && input.amountMatches;
}

export function readJsonObject(
  raw: string,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  if (!raw) return { ok: true, value: {} };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

/** Reject a body that already claims to be an object but is not JSON-shaped. */
export function jsonObject(
  body: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  if (body == null || body === "") return { ok: true, value: {} };
  if (typeof body === "string") return readJsonObject(body);
  if (typeof body === "object" && !Array.isArray(body)) {
    return { ok: true, value: body as Record<string, unknown> };
  }
  return { ok: false };
}

export function validatePresentFields(
  body: Record<string, unknown>,
): string | null {
  if ("email" in body && body.email !== undefined && body.email !== "") {
    if (!parseEmail(body.email)) return "invalid_email";
  }
  if ("reservationId" in body && body.reservationId !== undefined && body.reservationId !== "") {
    if (!parseReservationId(body.reservationId)) return "reservation_id";
  }
  if ("amountUsd" in body && body.amountUsd !== undefined && body.amountUsd !== "") {
    if (parseAmountUsd(body.amountUsd) == null) return "amount";
  }
  if ("orderId" in body && body.orderId !== undefined && body.orderId !== "") {
    if (!parsePayPalOrderId(body.orderId)) return "order_id";
  }
  return null;
}

export function consumeIpLimit(
  ip: string,
  bucket: string,
  limit: number,
  now = Date.now(),
): boolean {
  const key = `${bucket}:${(ip || "unknown").slice(0, 80)}`;
  const current = hits.get(key);
  if (!current || now - current.start >= WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
