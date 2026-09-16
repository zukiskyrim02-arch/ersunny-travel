import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import {
  buildPayPalTicket,
  loadPayPalSdk,
  lockHostedButtonAmount,
  PAYPAL_HOSTED_BUTTON_ID,
} from "./payments/paypal";
import type { Reservation } from "./reservations";

type PayPalHostedButtonProps = {
  reservation: Reservation;
  amount?: number | null;
  className?: string;
};

export function PayPalHostedButton({
  reservation,
  amount,
  className,
}: PayPalHostedButtonProps) {
  const { t } = useI18n();
  const reactId = useId().replace(/:/g, "");
  const containerId = `paypal-container-${PAYPAL_HOSTED_BUTTON_ID}-${reactId}`;
  const rendered = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const ticket = buildPayPalTicket(reservation);
  const price =
    amount != null && amount > 0
      ? amount
      : reservation.price != null && reservation.price > 0
        ? reservation.price
        : null;

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    const polls: number[] = [];
    rendered.current = false;

    function applyAmount() {
      if (price == null) return;
      const el = document.getElementById(containerId);
      if (el) lockHostedButtonAmount(el, price);
    }

    async function mount() {
      if (price == null) {
        setLoading(false);
        return;
      }

      setError("");
      setLoading(true);

      try {
        const paypal = await loadPayPalSdk();
        if (cancelled || rendered.current) return;

        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = "";

        await paypal
          .HostedButtons({
            hostedButtonId: PAYPAL_HOSTED_BUTTON_ID,
          })
          .render(`#${containerId}`);

        if (cancelled) return;
        rendered.current = true;
        applyAmount();
        observer = new MutationObserver(() => applyAmount());
        observer.observe(el, { childList: true, subtree: true });
        [120, 400, 900, 1600].forEach((ms) => {
          polls.push(window.setTimeout(applyAmount, ms));
        });
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
      observer?.disconnect();
      polls.forEach((id) => window.clearTimeout(id));
    };
  }, [containerId, price, t]);

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

      {loading && !error ? (
        <p className="paypal-hosted__status">{t("pay.connecting")}</p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div id={containerId} className="paypal-hosted__button" />
    </div>
  );
}
