import { useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import {
  redirectToCardnetAuthorize,
  startCardnetCheckout,
} from "./payments/cardnet";
import type { Reservation } from "./reservations";

type CardnetPayButtonProps = {
  reservation: Reservation;
  amount: number | null;
};

export function CardnetPayButton({ reservation, amount }: CardnetPayButtonProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (amount == null || amount <= 0) {
    return (
      <div className="cardnet-pay">
        <p className="cardnet-pay__status">{t("pay.pricePending")}</p>
      </div>
    );
  }

  async function onPay() {
    setError("");
    setLoading(true);
    try {
      const session = await startCardnetCheckout({
        reservation,
        amountUsd: amount!,
        pageLanguage: locale === "es" ? "SPA" : "ENG",
      });
      redirectToCardnetAuthorize(session);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : t("pay.cardnetError"));
    }
  }

  return (
    <div className="cardnet-pay">
      <p className="cardnet-pay__lead">
        {t("pay.cardnetLead", { price: amount })}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-blue cardnet-pay__btn"
        disabled={loading}
        onClick={() => void onPay()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M6 15h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {loading
          ? t("pay.cardnetConnecting")
          : t("pay.cardnetPayAmount", { price: amount })}
      </button>
      <p className="cardnet-pay__hint">{t("pay.cardnetHint")}</p>
    </div>
  );
}
