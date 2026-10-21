import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { buildPayPalTicket, loadPayPalSdk, PAYPAL_CLIENT_ID } from "./payments/paypal";
import {
  updateReservation,
  type Reservation,
} from "./reservations";
import { sendPaidBookingEmails } from "./notifyBooking";

function paypalNotice(
  code: string | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (code === "rate_limited") return t("pay.rateLimited");
  if (code === "amount" || code === "reservation_price") return t("pay.amountMismatch");
  if (code === "PayPal is not configured.") return t("pay.paypalMissing");
  return t("pay.paypalUnconfirmed");
}

type PayPalHostedButtonProps = {
  reservation: Reservation;
  amount?: number | null;
  className?: string;
  hideTicket?: boolean;
  captchaToken?: string;
  onCaptchaUsed?: () => void;
  /** Show the captcha for this button instead of opening PayPal immediately. */
  onChoose?: () => void;
  /** Captcha already passed; open the PayPal button. */
  unlocked?: boolean;
  onPaid?: (reservation: Reservation) => void;
};

export function PayPalHostedButton({
  reservation,
  amount,
  className,
  hideTicket = false,
  captchaToken = "",
  onCaptchaUsed,
  onChoose,
  unlocked = false,
  onPaid,
}: PayPalHostedButtonProps) {
  const { t } = useI18n();
  const reactId = useId().replace(/:/g, "");
  const containerId = `paypal-buttons-${reactId}`;
  const buttonsRef = useRef<{ close?: () => void } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paidOk, setPaidOk] = useState(false);
  const [open, setOpen] = useState(unlocked);
  const [checkingCaptcha, setCheckingCaptcha] = useState(false);

  const ticket = buildPayPalTicket(reservation);
  const price =
    amount != null && amount > 0
      ? amount
      : reservation.price != null && reservation.price > 0
        ? reservation.price
        : null;

  useEffect(() => {
    if (unlocked) setOpen(true);
  }, [unlocked]);

  useEffect(() => {
    if (!open || price == null) return undefined;
    let cancelled = false;

    async function mount(attempt = 0) {
      if (price == null) {
        setLoading(false);
        return;
      }

      setError("");
      setLoading(true);
      setPaidOk(false);

      try {
        const paypal = await loadPayPalSdk();
        if (cancelled) return;

        const el = document.getElementById(containerId);
        if (!el) return;
        el.replaceChildren();

        const buttons = paypal.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 48,
            tagline: false,
          },
          createOrder: (_data, actions) => {
            const value = price.toFixed(2);
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  reference_id: reservation.id,
                  description: ticket.name,
                  custom_id: reservation.id,
                  amount: {
                    currency_code: "USD",
                    value,
                    breakdown: {
                      item_total: {
                        currency_code: "USD",
                        value,
                      },
                    },
                  },
                  items: [
                    {
                      name: ticket.name,
                      description: ticket.description,
                      sku: reservation.id,
                      unit_amount: {
                        currency_code: "USD",
                        value,
                      },
                      quantity: "1",
                      category: "DIGITAL_GOODS",
                    },
                  ],
                },
              ],
            });
          },
          onApprove: async (data) => {
            const res = await fetch("/api/cardnet/session", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                intent: "paypal-capture",
                orderId: data.orderID,
                reservationId: reservation.id,
              }),
            });
            const body = (await res.json().catch(() => ({}))) as {
              approved?: boolean;
              error?: string;
            };
            if (!res.ok || !body.approved) {
              if (!cancelled) setError(paypalNotice(body.error, t));
              return;
            }
            const updated =
              updateReservation(reservation.id, { status: "paid" }) ?? {
                ...reservation,
                status: "paid" as const,
              };
            try {
              await sendPaidBookingEmails(updated);
            } catch {
              /* email is best-effort */
            }
            if (!cancelled) {
              setPaidOk(true);
              onPaid?.(updated);
            }
          },
          onError: (err) => {
            const message = err instanceof Error ? err.message : String(err || "");
            if (/allowpaymentrequest|allowTransparency/i.test(message)) return;
            if (!cancelled) setError(t("pay.azulError"));
          },
        });

        buttonsRef.current = buttons;
        await buttons.render(`#${containerId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (/allowpaymentrequest|allowTransparency/i.test(message)) return;
        if (!cancelled && /zoid/i.test(message) && attempt < 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 40));
          if (!cancelled) await mount(attempt + 1);
          return;
        }
        if (!cancelled) setError(t("pay.azulError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void mount();
    return () => {
      cancelled = true;
      const pending = buttonsRef.current;
      buttonsRef.current = null;
      window.setTimeout(() => {
        if (buttonsRef.current) return;
        pending?.close?.();
      }, 0);
    };
  }, [
    open,
    containerId,
    onPaid,
    price,
    reservation.id,
    reservation.name,
    reservation.kind,
    reservation.origin,
    reservation.destination,
    reservation.date,
    reservation.returnDate,
    reservation.wantReturn,
    reservation.passengers,
    reservation.vehicle,
    reservation.hotelPickup,
    t,
    ticket.description,
    ticket.name,
  ]);

  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className={className ?? "paypal-hosted"}>
        <p className="paypal-hosted__status">{t("pay.paypalMissing")}</p>
      </div>
    );
  }

  if (price == null) {
    return (
      <div className={className ?? "paypal-hosted"}>
        <p className="paypal-hosted__status">{t("pay.pricePending")}</p>
      </div>
    );
  }

  return (
    <div className={className ?? "paypal-hosted"}>
      {!hideTicket && (
      <article className="paypal-ticket" aria-label={t("pay.ticketLabel")}>
        <p className="paypal-ticket__eyebrow">{t("pay.ticketEyebrow")}</p>
        <h3 className="paypal-ticket__id">{reservation.id}</h3>
        <p className="paypal-ticket__service">{ticket.service}</p>
        <dl className="paypal-ticket__meta">
          <div>
            <dt>{t("pay.route")}</dt>
            <dd>
              {reservation.kind === "excursion"
                ? reservation.hotelPickup || reservation.origin
                : `${reservation.origin} → ${reservation.destination}`}
            </dd>
          </div>
          <div>
            <dt>{t("pay.date")}</dt>
            <dd>
              {reservation.wantReturn && reservation.returnDate
                ? `${reservation.date} → ${reservation.returnDate}`
                : reservation.date}
            </dd>
          </div>
          <div>
            <dt>{t("pay.passengers")}</dt>
            <dd>{reservation.passengers}</dd>
          </div>
          <div>
            <dt>{t("pay.amount")}</dt>
            <dd>US${price}</dd>
          </div>
        </dl>
      </article>
      )}

      {paidOk ? (
        <p className="paypal-hosted__success" role="status">
          {t("pay.paypalPaid", { id: reservation.id })}
        </p>
      ) : !open ? (
        <>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="btn-blue cardnet-pay__btn"
          disabled={checkingCaptcha || (!onChoose && !captchaToken)}
          onClick={() => {
            if (onChoose) {
              setError("");
              onChoose();
              return;
            }
            const token = captchaToken;
            if (!token) {
              setError(t("pay.captchaError"));
              return;
            }
            setError("");
            setCheckingCaptcha(true);
            onCaptchaUsed?.();
            void fetch("/api/cardnet/session", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ intent: "paypal", captchaToken: token }),
            })
              .then(async (res) => {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                if (!res.ok || body.error === "captcha") {
                  setError(
                    body.error === "rate_limited"
                      ? t("pay.rateLimited")
                      : t("pay.captchaError"),
                  );
                  return;
                }
                setOpen(true);
              })
              .catch(() => setError(t("pay.captchaError")))
              .finally(() => setCheckingCaptcha(false));
          }}
        >
          {checkingCaptcha ? t("pay.connecting") : t("pay.payAmount", { price })}
        </button>
        </>
      ) : (
        <>
          {loading && !error ? (
            <p className="paypal-hosted__status">{t("pay.connecting")}</p>
          ) : null}
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div id={containerId} className="paypal-hosted__button" />
        </>
      )}
    </div>
  );
}
