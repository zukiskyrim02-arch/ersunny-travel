import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { buildPayPalTicket, loadPayPalSdk } from "./payments/paypal";
import {
  updateReservation,
  type Reservation,
} from "./reservations";
import { sendPaidBookingEmails } from "./notifyBooking";

type PayPalHostedButtonProps = {
  reservation: Reservation;
  amount?: number | null;
  className?: string;
  onPaid?: (reservation: Reservation) => void;
};

export function PayPalHostedButton({
  reservation,
  amount,
  className,
  onPaid,
}: PayPalHostedButtonProps) {
  const { t } = useI18n();
  const reactId = useId().replace(/:/g, "");
  const containerId = `paypal-buttons-${reactId}`;
  const buttonsRef = useRef<{ close?: () => void } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paidOk, setPaidOk] = useState(false);

  const ticket = buildPayPalTicket(reservation);
  const price =
    amount != null && amount > 0
      ? amount
      : reservation.price != null && reservation.price > 0
        ? reservation.price
        : null;

  useEffect(() => {
    let cancelled = false;

    async function mount() {
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
        el.innerHTML = "";

        buttonsRef.current?.close?.();
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
          onApprove: async (_data, actions) => {
            await actions.order.capture();
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
            if (!cancelled) {
              const detail =
                err instanceof Error && err.message
                  ? err.message
                  : t("pay.azulError");
              setError(detail);
            }
          },
        });

        buttonsRef.current = buttons;
        await buttons.render(`#${containerId}`);
      } catch (err) {
        if (!cancelled) {
          const detail =
            err instanceof Error && err.message
              ? err.message
              : t("pay.azulError");
          setError(detail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void mount();
    return () => {
      cancelled = true;
      buttonsRef.current?.close?.();
      buttonsRef.current = null;
    };
  }, [
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

  if (price == null) {
    return (
      <div className={className ?? "paypal-hosted"}>
        <p className="paypal-hosted__status">{t("pay.pricePending")}</p>
      </div>
    );
  }

  return (
    <div className={className ?? "paypal-hosted"}>
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
            <dd>${price} USD</dd>
          </div>
        </dl>
      </article>

      {paidOk ? (
        <p className="paypal-hosted__success" role="status">
          {t("pay.paypalPaid", { id: reservation.id })}
        </p>
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
