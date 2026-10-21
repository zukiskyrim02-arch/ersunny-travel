import { verifyRecaptcha } from "./recaptcha.js";
import {
  cardnetAuthorizeUrl,
  cardnetOrderMatches,
  cardnetOutcome,
  cardnetReturnUrl,
  createCardnetSession,
  getCardnetConfig,
  isCardnetApproved,
  signCardnetState,
  verifyCardnetSession,
  verifyCardnetState,
} from "./cardnet.js";
import { cardnetStateCookie, clearCardnetCookie, readCardnetState } from "./cookies.js";
import {
  acceptedChargeUsd,
  canChargeStoredPrice,
  consumeIpLimit,
  parseAmountUsd,
  parseEmail,
  parseReservationId,
  shouldMarkReservationPaid,
  validatePresentFields,
} from "./paymentGuards.js";
import { mailFromBody, notifyCompanyOfPayment, sendDesignedBookingEmails, type BookingNotice } from "./companyMail.js";
import { capturePayPalOrder } from "./paypal.js";
import { readReservationPrice } from "./reservationPrice.js";

export type PaymentResponse = {
  status: number;
  json: Record<string, unknown>;
  cookies?: string[];
};

function limited(ip: string, bucket: string, limit: number): PaymentResponse | null {
  if (consumeIpLimit(ip, bucket, limit)) return null;
  return { status: 429, json: { error: "rate_limited" } };
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

export async function postCardnetSession(
  body: Record<string, unknown>,
  remoteIp: string,
): Promise<PaymentResponse> {
  const invalid = validatePresentFields(body);
  if (invalid) return { status: 400, json: { error: invalid } };

  if (body.intent === "booking-email") {
    const gate = limited(remoteIp, "booking-email", 12);
    if (gate) return gate;
    const notice = String(body.notice || "");
    const allowed: BookingNotice[] = ["request", "paid", "pickup", "confirmed"];
    if (!allowed.includes(notice as BookingNotice)) {
      return { status: 400, json: { error: "notice" } };
    }
    const reservation = mailFromBody(body);
    if (!parseReservationId(reservation.id || "")) {
      return { status: 400, json: { error: "reservation_id" } };
    }
    try {
      await sendDesignedBookingEmails({
        notice: notice as BookingNotice,
        reservation,
        confirmUrl: String(body.confirmUrl || ""),
      });
    } catch (err) {
      console.error(
        "[mail] booking notice failed",
        err instanceof Error ? err.message : err,
      );
      return { status: 502, json: { error: "send_failed" } };
    }
    return { status: 200, json: { ok: true } };
  }

  if (body.intent === "paypal") {
    const gate = limited(remoteIp, "paypal-open", 20);
    if (gate) return gate;
    if (!(await verifyRecaptcha(String(body.captchaToken || ""), remoteIp))) {
      return { status: 400, json: { error: "captcha" } };
    }
    return { status: 200, json: { ok: true } };
  }

  if (body.intent === "paypal-capture") {
    const gate = limited(remoteIp, "paypal-capture", 10);
    if (gate) return gate;
    const captured = await capturePayPalOrder({
      orderId: String(body.orderId || ""),
      reservationId: String(body.reservationId || ""),
    });
    if (!captured.ok) return { status: captured.status, json: { error: captured.error } };
    const paid = shouldMarkReservationPaid({
      providerApproved: true,
      orderMatches: true,
      amountMatches: true,
    });
    if (paid) {
      try {
        await notifyCompanyOfPayment(captured.reservationId);
      } catch (err) {
        console.error(
          "[mail] company notice failed",
          err instanceof Error ? err.message : err,
        );
      }
    }
    return {
      status: 200,
      json: {
        approved: paid,
        reservationId: captured.reservationId,
        amount: captured.amount,
      },
    };
  }

  const gate = limited(remoteIp, "cardnet-session", 10);
  if (gate) return gate;
  if (!(await verifyRecaptcha(String(body.captchaToken || ""), remoteIp))) {
    return { status: 400, json: { error: "captcha" } };
  }

  const reservationId = parseReservationId(body.reservationId);
  const amountUsd = parseAmountUsd(body.amountUsd);
  const origin = String(body.origin || "").replace(/\/$/, "");
  const email = body.email ? parseEmail(body.email) : "";
  if (body.email && !email) return { status: 400, json: { error: "invalid_email" } };
  if (!reservationId || amountUsd == null) {
    return { status: 400, json: { error: "reservationId and amountUsd required" } };
  }
  if (!origin) return { status: 400, json: { error: "origin required" } };

  const stored = await readReservationPrice(reservationId);
  const pesosPerDollar = Number(process.env.CARDNET_USD_DOP_RATE || "") || 61.45;
  const chargeUsd = acceptedChargeUsd(stored, amountUsd, pesosPerDollar);
  if (chargeUsd == null) {
    return {
      status: 400,
      json: {
        error: stored == null ? "reservation_price" : "amount",
        ...(stored != null ? { price: stored } : {}),
      },
    };
  }

  const config = getCardnetConfig();
  const returnUrl = cardnetReturnUrl(origin, reservationId, "return");
  const cancelUrl = cardnetReturnUrl(origin, reservationId, "cancel");
  const created = await createCardnetSession(config, {
    amountUsd: chargeUsd,
    reservationId,
    returnUrl,
    cancelUrl,
    pageLanguage: String(body.pageLanguage || ""),
    mobilePhone: String(body.mobilePhone || ""),
    email: email || "",
    clientIp: remoteIp,
    addressLine: String(body.addressLine || ""),
  });
  const state = await signCardnetState(config.stateSecret, {
    session: created.session,
    sk: created.sessionKey,
    reservationId,
    amount: chargeUsd,
  });
  return {
    status: 200,
    json: {
      session: created.session,
      authorizeUrl: cardnetAuthorizeUrl(config.env),
      returnUrl,
      cancelUrl,
      state,
      env: config.env,
    },
    cookies: [cardnetStateCookie(state, hostOf(origin))],
  };
}

export async function postCardnetVerify(
  body: Record<string, unknown>,
  remoteIp: string,
  cookieHeader: string | undefined,
  host: string | undefined,
): Promise<PaymentResponse> {
  const gate = limited(remoteIp, "cardnet-verify", 30);
  if (gate) return gate;

  const state = String(body.state || "").trim() || readCardnetState(cookieHeader);
  if (!state) {
    return {
      status: 400,
      json: { error: "state required" },
      cookies: [clearCardnetCookie(host)],
    };
  }

  const config = getCardnetConfig();
  const payload = await verifyCardnetState(config.stateSecret, state);
  const result = await verifyCardnetSession(config, payload.session, payload.sk);
  const outcome = cardnetOutcome(result);
  const stored = await readReservationPrice(payload.reservationId);
  const approved = shouldMarkReservationPaid({
    providerApproved: isCardnetApproved(result) && outcome.approved,
    orderMatches: cardnetOrderMatches(result, payload.reservationId),
    amountMatches: canChargeStoredPrice(stored, payload.amount),
  });
  if (approved) {
    try {
      await notifyCompanyOfPayment(payload.reservationId);
    } catch (err) {
      console.error(
        "[mail] company notice failed",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return {
    status: 200,
    json: {
      approved,
      authorizationCode: approved ? outcome.authorizationCode : "",
      responseCode: approved
        ? outcome.responseCode
        : outcome.responseCode && outcome.responseCode !== "00"
          ? outcome.responseCode
          : "order",
      reservationId: payload.reservationId,
      amount: payload.amount,
      session: payload.session,
    },
    cookies: [clearCardnetCookie(host)],
  };
}
