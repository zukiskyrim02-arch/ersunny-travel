import { useEffect, useRef, useState } from "react";
import { CardnetPayButton } from "./CardnetPayButton";
import { RecaptchaBox, type RecaptchaHandle } from "./payments/RecaptchaBox";
import { useI18n } from "./i18n/I18nProvider";
import { PayPalHostedButton } from "./PayPalHostedButton";
import {
  clearCardnetQueryFromUrl,
  readCardnetReturnFromUrl,
  verifyCardnetPayment,
} from "./payments/cardnet";
import {
  findReservation,
  updateReservation,
  type Reservation,
} from "./reservations";

type PaymentSectionProps = {
  reservation: Reservation;
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

export function PaymentSection({ reservation: initial }: PaymentSectionProps) {
  const { t, locale } = useI18n();
  const [reservation, setReservation] = useState(initial);
  const [copiedId, setCopiedId] = useState(false);
  const [cardnetBanner, setCardnetBanner] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<RecaptchaHandle>(null);
  const [verifying, setVerifying] = useState(false);
  const isExcursion = reservation.kind === "excursion";
  const alreadyPaid = reservation.status === "paid";

  useEffect(() => {
    setReservation(initial);
  }, [initial]);

  useEffect(() => {
    const ret = readCardnetReturnFromUrl();
    if (!ret) return;

    if (ret.status === "cancel") {
      setCardnetBanner(t("pay.cardnetCanceled"));
      clearCardnetQueryFromUrl(ret.reservationId || reservation.id);
      return;
    }

    let cancelled = false;
    setVerifying(true);
    void verifyCardnetPayment(ret.state)
      .then(async (result) => {
        if (cancelled) return;
        if (result.approved) {
          updateReservation(result.reservationId, {
            status: "paid",
            authorizationCode: result.authorizationCode || undefined,
          });
          const found = findReservation(result.reservationId);
          if (found) setReservation(found);
          const approved = t("pay.cardnetApproved", { id: result.reservationId });
          setCardnetBanner(
            result.authorizationCode
              ? `${approved} ${result.authorizationCode}`
              : approved,
          );
          if (found) {
            void import("./notifyBooking").then(({ sendPaidBookingEmails }) =>
              sendPaidBookingEmails(found).catch(() => undefined),
            );
          }
        } else {
          const declined = t("pay.cardnetDeclined");
          setCardnetBanner(
            result.responseCode ? `${declined} (${result.responseCode})` : declined,
          );
        }
        clearCardnetQueryFromUrl(result.reservationId);
      })
      .catch(() => {
        if (!cancelled) setCardnetBanner(t("pay.cardnetConfirmError"));
        clearCardnetQueryFromUrl(ret.reservationId || reservation.id);
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservation.id, t]);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(reservation.id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      /* ignore */
    }
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
        </div>

        {(cardnetBanner || verifying) && (
          <p
            className={`confirm__banner${alreadyPaid ? " confirm__banner--ok" : ""}`}
            role="status"
          >
            {verifying ? t("pay.cardnetVerifying") : cardnetBanner}
          </p>
        )}

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
                  : `US$${reservation.price}`}
              </strong>
            </div>
          </div>
        </article>

        <div className="confirm__pay payment-form" id="datos-pago">
          <h2>{t("pay.methodsTitle")}</h2>
          <p>
            {reservation.price == null
              ? t("pay.methodsLeadPending")
              : t("pay.methodsLead", { price: reservation.price })}
          </p>

          {alreadyPaid ? (
            <p className="confirm__banner confirm__banner--ok" role="status">
              {t("pay.alreadyPaid", { id: reservation.id })}
            </p>
          ) : (
            <div className="pay-options">
              <RecaptchaBox ref={captchaRef} onToken={setCaptchaToken} />
              <CardnetPayButton
                reservation={reservation}
                amount={reservation.price}
                captchaToken={captchaToken}
                onCaptchaUsed={() => captchaRef.current?.reset()}
              />
              <div className="pay-divider" aria-hidden>
                <span>{t("pay.or")}</span>
              </div>
              <PayPalHostedButton
                reservation={reservation}
                amount={reservation.price}
                hideTicket
                captchaToken={captchaToken}
                onCaptchaUsed={() => captchaRef.current?.reset()}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
