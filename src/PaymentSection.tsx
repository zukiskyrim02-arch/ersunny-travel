import { useEffect, useRef, useState } from "react";
import { CardnetPayButton } from "./CardnetPayButton";
import { RecaptchaBox, type RecaptchaHandle } from "./payments/RecaptchaBox";
import { useI18n } from "./i18n/I18nProvider";
import { PayPalHostedButton } from "./PayPalHostedButton";
import {
  redirectToCardnetAuthorize,
  startCardnetCheckout,
} from "./payments/cardnet";
import {
  clearCardnetQueryFromUrl,
  readCardnetReturnFromUrl,
  verifyCardnetPayment,
} from "./payments/cardnet";
import { formatDisplayDate, formatDisplayTime } from "../shared/datetime";
import {
  ensureReservationSaved,
  fetchReservationFromFirebase,
  findReservation,
  updateReservation,
  type Reservation,
} from "./reservations";

type PaymentSectionProps = {
  reservation: Reservation;
};

export function PaymentSection({ reservation: initial }: PaymentSectionProps) {
  const { t, locale } = useI18n();
  const [reservation, setReservation] = useState(initial);
  const [copiedId, setCopiedId] = useState(false);
  const [cardnetBanner, setCardnetBanner] = useState<string | null>(null);
  const captchaRef = useRef<RecaptchaHandle>(null);
  const [method, setMethod] = useState<"card" | "paypal" | null>(null);
  const [paypalUnlocked, setPaypalUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const methodRef = useRef<"card" | "paypal" | null>(null);
  const payingRef = useRef(false);
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
            result.responseCode && result.responseCode !== "order"
              ? `${declined} (${result.responseCode})`
              : declined,
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
      ? `${formatDisplayDate(reservation.date)} – ${formatDisplayDate(reservation.returnDate)}`
      : formatDisplayDate(reservation.date) || "—";

  const serviceSubtitle = isExcursion
    ? reservation.destination
    : reservation.wantReturn
      ? t("pay.privateRound")
      : t("pay.privateOne");

  const pickupTimeLabel =
    reservation.pickupTime && reservation.pickupTime !== "To be confirmed"
      ? formatDisplayTime(reservation.pickupTime)
      : t("pay.toConfirm");
  const priceLabel =
    reservation.price == null ? t("pay.toConfirm") : `US$${reservation.price}`;
  const usdDopRate = Number(import.meta.env.VITE_USD_DOP_RATE || "") || 61.45;
  const dop =
    reservation.price != null && reservation.price > 0
      ? Math.round(reservation.price * usdDopRate * 100) / 100
      : null;
  const originLabel = isExcursion
    ? reservation.hotelPickup || reservation.origin
    : reservation.origin;

  function chooseMethod(next: "card" | "paypal") {
    if (payingRef.current) return;
    setPayError("");
    if (methodRef.current === next) return;
    methodRef.current = next;
    setMethod(next);
  }

  async function onCaptchaToken(token: string) {
    const chosen = methodRef.current;
    if (!token || !chosen || payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setPayError("");
    try {
      const saved = await fetchReservationFromFirebase(reservation.id);
      const current = saved?.price != null ? saved : reservation;
      if (!saved) await ensureReservationSaved(current);
      if (saved) setReservation(saved);
      if (chosen === "card") {
        if (current.price == null || current.price <= 0) {
          setPayError(t("pay.pricePending"));
          methodRef.current = null;
          setMethod(null);
          return;
        }
        const session = await startCardnetCheckout({
          reservation: current,
          amountUsd: current.price,
          captchaToken: token,
          pageLanguage: locale === "es" ? "ESP" : "ING",
        });
        redirectToCardnetAuthorize(session);
        return;
      }
      const res = await fetch("/api/cardnet/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ intent: "paypal", captchaToken: token }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok || body.error) {
        setPayError(
          body.error === "rate_limited" ? t("pay.rateLimited") : t("pay.captchaError"),
        );
        methodRef.current = null;
        setMethod(null);
        return;
      }
      setPaypalUnlocked(true);
      methodRef.current = null;
      setMethod(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const savedPrice =
        err && typeof err === "object" && "price" in err
          ? Number((err as { price?: number }).price)
          : NaN;
      if (message === "amount" && Number.isFinite(savedPrice) && savedPrice > 0) {
        setReservation((current) => ({ ...current, price: savedPrice }));
        setPayError(t("pay.savedPrice", { price: savedPrice }));
      } else {
        setPayError(
          message === "captcha"
            ? t("pay.captchaError")
            : message === "rate_limited"
              ? t("pay.rateLimited")
              : message === "reservation_price"
                ? t("pay.priceUnconfirmed")
                : message === "amount"
                  ? t("pay.amountMismatch")
                  : message || t("pay.cardnetError"),
        );
      }
      methodRef.current = null;
      setMethod(null);
    } finally {
      payingRef.current = false;
      setPaying(false);
      captchaRef.current?.reset();
    }
  }

  return (
    <section className="section pay-screen" id="pago">
      <div className="container pay-screen__wrap">
        <header className="pay-screen__head">
          <p className="pay-screen__eyebrow">{t("pay.title")}</p>
          <h1>{serviceSubtitle}</h1>
          <div className="pay-screen__id">
            <div className="pay-screen__id-meta">
              <span className="pay-screen__id-label">{t("pay.reservationNumber")}</span>
              <span className="pay-screen__id-value">{reservation.id}</span>
            </div>
            <button type="button" className="copy-btn" onClick={() => void copyId()}>
              {copiedId ? t("pay.copied") : t("pay.copy")}
            </button>
          </div>
        </header>

        {(cardnetBanner || verifying) && (
          <p
            className={`pay-alert${alreadyPaid ? " pay-alert--ok" : " pay-alert--warn"}`}
            role="status"
          >
            {verifying ? t("pay.cardnetVerifying") : cardnetBanner}
          </p>
        )}

        <div className="pay-screen__grid">
          <article className="pay-summary">
            <p className="pay-summary__kind">
              {isExcursion ? t("pay.excursion") : t("pay.transfer")}
            </p>
            <dl className="pay-summary__facts">
              <div>
                <dt>{t("pay.date")}</dt>
                <dd>{dateLabel}</dd>
              </div>
              <div>
                <dt>{t("pay.pickupTime")}</dt>
                <dd>{pickupTimeLabel}</dd>
              </div>
              <div>
                <dt>{t("pay.passengers")}</dt>
                <dd>{reservation.passengers}</dd>
              </div>
              <div>
                <dt>{t("pay.serviceType")}</dt>
                <dd>
                  {isExcursion
                    ? t("pay.excursionType")
                    : reservation.wantReturn
                      ? t("pay.privateRound")
                      : t("pay.privateOne")}
                </dd>
              </div>
              {!isExcursion && (
                <div>
                  <dt>{t("pay.vehicle")}</dt>
                  <dd>{reservation.vehicle}</dd>
                </div>
              )}
            </dl>
            <ol className="pay-summary__route">
              <li>
                <span>{t("pay.origin")}</span>
                <strong>{originLabel}</strong>
              </li>
              <li>
                <span>
                  {isExcursion ? t("pay.excursionType") : t("pay.destination")}
                </span>
                <strong>{reservation.destination}</strong>
              </li>
            </ol>
          </article>

          <aside className="pay-checkout" id="datos-pago">
            <div className="pay-checkout__amount">
              <span>{t("pay.amount")}</span>
              <strong>{priceLabel}</strong>
              {dop != null && (
                <p>
                  {t("pay.cardnetDop", {
                    amount: dop.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  })}
                </p>
              )}
            </div>

            {alreadyPaid ? (
              <p className="pay-alert pay-alert--ok" role="status">
                {t("pay.alreadyPaid", { id: reservation.id })}
              </p>
            ) : (
              <div className="pay-checkout__methods">
                <div className="pay-method">
                  <CardnetPayButton
                    reservation={reservation}
                    amount={reservation.price}
                    onChoose={() => chooseMethod("card")}
                    busy={paying && method === "card"}
                  />
                  {method === "card" && (
                    <RecaptchaBox
                      key="card"
                      ref={captchaRef}
                      onToken={(token) => void onCaptchaToken(token)}
                    />
                  )}
                </div>
                <p className="pay-checkout__or">{t("pay.or")}</p>
                <div className="pay-method">
                  <PayPalHostedButton
                    reservation={reservation}
                    amount={reservation.price}
                    hideTicket
                    onChoose={() => chooseMethod("paypal")}
                    unlocked={paypalUnlocked}
                  />
                  {method === "paypal" && !paypalUnlocked && (
                    <RecaptchaBox
                      key="paypal"
                      ref={captchaRef}
                      onToken={(token) => void onCaptchaToken(token)}
                    />
                  )}
                </div>
                {payError && (
                  <p className="form-error" role="alert">
                    {payError}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
