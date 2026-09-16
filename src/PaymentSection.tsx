import { useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import { useAppConfig } from "./store/hooks";
import { PayPalHostedButton } from "./PayPalHostedButton";
import type { Reservation } from "./reservations";

type PaymentSectionProps = {
  reservation: Reservation;
  onOpenTracker?: () => void;
};

function formatDate(iso: string, locale: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const loc = locale === "zh" ? "zh-CN" : locale;
  return d.toLocaleDateString(loc, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PaymentSection({
  reservation,
  onOpenTracker,
}: PaymentSectionProps) {
  const { t, locale } = useI18n();
  const { contact } = useAppConfig();
  const [copiedId, setCopiedId] = useState(false);
  const isExcursion = reservation.kind === "excursion";

  async function copyId() {
    try {
      await navigator.clipboard.writeText(reservation.id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function scrollToPayPal() {
    document.getElementById("datos-pago")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const dateLabel =
    reservation.wantReturn && reservation.returnDate
      ? `${formatDate(reservation.date, locale)} – ${formatDate(reservation.returnDate, locale)}`
      : formatDate(reservation.date, locale);

  const serviceSubtitle = isExcursion
    ? reservation.destination
    : reservation.wantReturn
      ? t("pay.privateRound")
      : t("pay.privateOne");

  const pickupTimeLabel =
    reservation.pickupTime && reservation.pickupTime !== "To be confirmed"
      ? reservation.pickupTime
      : t("pay.toConfirm");

  return (
    <section className="section section--confirm" id="pago">
      <div className="container confirm">
        <div className="confirm__hero">
          <div className="confirm__badge" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="5"
                width="16"
                height="15"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 3.5v3M16 3.5v3M4 9.5h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M8.5 14.5 10.8 16.8 15.5 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1>{t("pay.title")}</h1>
          <div className="confirm__ref">
            <span>{t("pay.reservationNumber")}</span>
            <strong>{reservation.id}</strong>
            <button
              type="button"
              className="copy-btn"
              onClick={() => void copyId()}
            >
              {copiedId ? t("pay.copied") : t("pay.copy")}
            </button>
          </div>
          <p>
            {isExcursion ? t("pay.receivedExcursion") : t("pay.receivedTransfer")}
          </p>
        </div>

        <div className="confirm__contacts">
          <a
            className="confirm__contact"
            href={`mailto:${contact.email}?subject=Reservation%20${reservation.id}`}
          >
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <strong>{t("pay.email")}</strong>
            <small>{contact.email}</small>
          </a>

          <a
            className="confirm__contact"
            href={`https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(`Hi, my reservation is ${reservation.id}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="confirm__contact-icon confirm__contact-icon--wa" aria-hidden>
              WA
            </span>
            <strong>{t("pay.whatsapp")}</strong>
            <small>{contact.whatsapp}</small>
          </a>

          <button type="button" className="confirm__contact" onClick={onOpenTracker}>
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 8v4l3 2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <strong>{t("pay.pickup")}</strong>
            <small>{t("pay.confirmTime")}</small>
          </button>

          <button type="button" className="confirm__contact" onClick={scrollToPayPal}>
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="6"
                  width="18"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <strong>{t("pay.paypal")}</strong>
            <small>{t("pay.card")}</small>
          </button>
        </div>

        <article className="confirm__card">
          <div className="confirm__card-head">
            <div className="confirm__service-thumb" aria-hidden>
              {isExcursion ? "☀" : "🚐"}
            </div>
            <div>
              <p className="confirm__service-label">
                {isExcursion ? t("pay.excursion") : t("pay.transfer")}
              </p>
              <h3>{serviceSubtitle}</h3>
              <p className="confirm__service-id">{reservation.id}</p>
            </div>
          </div>

          <div className="confirm__meta">
            <div>
              <span>{t("pay.date")}</span>
              <strong>{dateLabel}</strong>
            </div>
            <div>
              <span>{t("pay.pickupTime")}</span>
              <strong>{pickupTimeLabel}</strong>
            </div>
          </div>

          <div className="confirm__route">
            <p className="confirm__route-title">
              {isExcursion ? t("pay.details") : t("pay.route")}
            </p>
            <ol className="confirm__timeline">
              <li>
                <span className="confirm__dot confirm__dot--start" />
                <div>
                  <small>{t("pay.origin")}</small>
                  <strong>
                    {isExcursion
                      ? reservation.hotelPickup || reservation.origin
                      : reservation.origin}
                  </strong>
                </div>
              </li>
              <li>
                <span className="confirm__dot confirm__dot--end" />
                <div>
                  <small>
                    {isExcursion ? t("pay.excursionType") : t("pay.destination")}
                  </small>
                  <strong>{reservation.destination}</strong>
                </div>
              </li>
            </ol>
          </div>

          <div className="confirm__meta confirm__meta--footer">
            <div>
              <span>{t("pay.passengers")}</span>
              <strong>{reservation.passengers}</strong>
            </div>
            <div>
              <span>{t("pay.serviceType")}</span>
              <strong>
                {isExcursion
                  ? t("pay.excursionType")
                  : reservation.wantReturn
                    ? t("pay.privateRound")
                    : t("pay.privateOne")}
              </strong>
            </div>
            {!isExcursion && (
              <div>
                <span>{t("pay.vehicle")}</span>
                <strong>{reservation.vehicle}</strong>
              </div>
            )}
            <div>
              <span>{t("pay.amount")}</span>
              <strong>
                {reservation.price == null
                  ? t("pay.toConfirm")
                  : `$${reservation.price} USD`}
              </strong>
            </div>
          </div>
        </article>

        <div className="confirm__pay payment-form" id="datos-pago">
          <h2>{t("pay.paypalTitle")}</h2>
          <p>
            {reservation.price == null
              ? t("pay.paypalLeadPending")
              : t("pay.paypalLead", { price: reservation.price })}
          </p>

          <PayPalHostedButton reservation={reservation} amount={reservation.price} />

          <p className="confirm__pay-hint">
            {t("pay.paypalHint", { id: reservation.id })}
          </p>
        </div>
      </div>
    </section>
  );
}
