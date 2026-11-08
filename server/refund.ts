import { refundCardnetPayment } from "./cardnet.js";
import { parseAmountUsd, parseReservationId } from "./paymentGuards.js";
import { refundPayPalCapture } from "./paypal.js";
import { databaseUrl } from "./rtdb.js";

export type RefundableReservation = {
  id?: string;
  status?: string;
  price?: number | null;
  paymentMethod?: string;
  paypalCaptureId?: string;
  paypalOrderId?: string;
  authorizationCode?: string;
  cardnetTxToken?: string;
  cardnetRetrievalReference?: string;
  cardnetAmountDop?: number | null;
  refundedAt?: string;
};

async function readReservation(
  reservationId: string,
): Promise<RefundableReservation | null> {
  const id = parseReservationId(reservationId);
  const base = databaseUrl();
  if (!id || !base) return null;
  const res = await fetch(`${base}/reservations/${encodeURIComponent(id)}.json`);
  if (!res.ok) return null;
  const data = (await res.json()) as RefundableReservation | null;
  if (!data) return null;
  return { ...data, id };
}

export async function processReservationRefund(input: {
  reservationId: string;
  clientIp?: string;
}): Promise<
  | {
      ok: true;
      reservationId: string;
      provider: "paypal" | "card";
      refundReference: string;
    }
  | { ok: false; status: number; error: string }
> {
  const reservationId = parseReservationId(input.reservationId);
  if (!reservationId) return { ok: false, status: 400, error: "reservation_id" };

  const reservation = await readReservation(reservationId);
  if (!reservation) {
    return { ok: false, status: 404, error: "reservation_not_found" };
  }
  if (reservation.refundedAt || reservation.status === "refunded") {
    return { ok: false, status: 409, error: "already_refunded" };
  }
  const status = reservation.status || "pending";
  if (!["paid", "confirmed", "completed"].includes(status)) {
    return { ok: false, status: 400, error: "not_refundable" };
  }

  const method =
    reservation.paymentMethod === "paypal" || reservation.paypalCaptureId
      ? "paypal"
      : reservation.paymentMethod === "card" ||
          reservation.cardnetTxToken ||
          reservation.authorizationCode
        ? "card"
        : "";

  if (method === "paypal") {
    const captureId = String(reservation.paypalCaptureId || "").trim();
    const amount = parseAmountUsd(reservation.price);
    if (!captureId) {
      return {
        ok: false,
        status: 400,
        error:
          "missing_paypal_capture. Este pago no tiene capture id de PayPal; no se puede reembolsar por API.",
      };
    }
    if (amount == null) return { ok: false, status: 400, error: "amount" };
    const result = await refundPayPalCapture({
      captureId,
      reservationId,
      amountUsd: amount,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      reservationId,
      provider: "paypal",
      refundReference: result.refundId,
    };
  }

  if (method === "card") {
    const txToken = String(reservation.cardnetTxToken || "").trim();
    const amountDop = Number(reservation.cardnetAmountDop);
    if (!txToken) {
      return {
        ok: false,
        status: 400,
        error:
          "missing_cardnet_token. Este pago no tiene TxToken de Cardnet; no se puede reembolsar por API.",
      };
    }
    if (!Number.isFinite(amountDop) || amountDop <= 0) {
      return { ok: false, status: 400, error: "amount" };
    }
    const result = await refundCardnetPayment({
      reservationId,
      amountDop,
      txToken,
      retrievalReference: reservation.cardnetRetrievalReference,
      clientIp: input.clientIp,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      reservationId,
      provider: "card",
      refundReference: result.refundReference,
    };
  }

  return {
    ok: false,
    status: 400,
    error:
      "unknown_payment_method. No hay datos de PayPal ni Cardnet para reembolsar.",
  };
}
