import { amountsMatch, parseAmountUsd, parsePayPalOrderId, parseReservationId } from "./paymentGuards.js";
import { readReservationPrice } from "./reservationPrice.js";

type PayPalAmount = { currency_code?: string; value?: string };
type PayPalUnit = {
  custom_id?: string;
  reference_id?: string;
  amount?: PayPalAmount;
  payments?: { captures?: { status?: string; amount?: PayPalAmount }[] };
};
type PayPalOrder = {
  status?: string;
  purchase_units?: PayPalUnit[];
};

export type PayPalCaptureResult =
  | { ok: true; reservationId: string; amount: number }
  | { ok: false; status: number; error: string };

function paypalClientId() {
  return process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || "";
}

function paypalApi(): string {
  return "https://api-m.paypal.com";
}

async function paypalAccessToken(): Promise<string> {
  const id = paypalClientId();
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  if (!id || !secret) {
    throw new Error("PayPal is not configured.");
  }
  const res = await fetch(`${paypalApi()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!res.ok || !data.access_token) {
    throw new Error("PayPal did not confirm this payment.");
  }
  return data.access_token;
}

async function paypalFetch(path: string, token: string, method: "GET" | "POST") {
  const res = await fetch(`${paypalApi()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json().catch(() => ({}))) as PayPalOrder;
  return { ok: res.ok, data };
}

function unitMatches(
  unit: PayPalUnit | undefined,
  reservationId: string,
  price: number,
): boolean {
  if (!unit) return false;
  const custom = String(unit.custom_id || "").trim().toUpperCase();
  if (custom !== reservationId) return false;
  if (unit.amount?.currency_code !== "USD") return false;
  const value = parseAmountUsd(unit.amount.value);
  if (value == null || !amountsMatch(price, value)) return false;
  return true;
}

function capturedAmountMatches(unit: PayPalUnit, price: number): boolean {
  const capture = unit.payments?.captures?.find((item) => item.status === "COMPLETED");
  if (!capture) return false;
  if (capture.amount?.currency_code !== "USD") return false;
  const value = parseAmountUsd(capture.amount.value);
  return value != null && amountsMatch(price, value);
}

/** Capture a browser-created order only after PayPal and the stored price agree. */
export async function capturePayPalOrder(input: {
  orderId: string;
  reservationId: string;
}): Promise<PayPalCaptureResult> {
  const orderId = parsePayPalOrderId(input.orderId);
  const reservationId = parseReservationId(input.reservationId);
  if (!orderId) return { ok: false, status: 400, error: "order_id" };
  if (!reservationId) return { ok: false, status: 400, error: "reservation_id" };

  const price = await readReservationPrice(reservationId);
  if (price == null) return { ok: false, status: 400, error: "reservation_price" };

  let token: string;
  try {
    token = await paypalAccessToken();
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal did not confirm this payment.";
    const status = message === "PayPal is not configured." ? 503 : 502;
    return { ok: false, status, error: message };
  }

  const loaded = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, token, "GET");
  const unit = loaded.data.purchase_units?.[0];
  if (!loaded.ok || !unitMatches(unit, reservationId, price)) {
    return { ok: false, status: 402, error: "PayPal did not confirm this payment." };
  }

  if (loaded.data.status === "COMPLETED") {
    if (!unit || !capturedAmountMatches(unit, price)) {
      return { ok: false, status: 402, error: "PayPal did not confirm this payment." };
    }
    return { ok: true, reservationId, amount: price };
  }

  const captured = await paypalFetch(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    token,
    "POST",
  );
  const capturedUnit = captured.data.purchase_units?.[0];
  if (
    !captured.ok ||
    captured.data.status !== "COMPLETED" ||
    !unitMatches(capturedUnit, reservationId, price) ||
    !capturedUnit ||
    !capturedAmountMatches(capturedUnit, price)
  ) {
    return { ok: false, status: 402, error: "PayPal did not confirm this payment." };
  }
  return { ok: true, reservationId, amount: price };
}
