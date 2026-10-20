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
  captchaToken: string;
  onCaptchaUsed: () => void;
};

export function CardnetPayButton({
  reservation,
  amount,
  captchaToken,
  onCaptchaUsed,
}: CardnetPayButtonProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const usdDopRate = Number(import.meta.env.VITE_USD_DOP_RATE || "") || 61.45;
  const dop =
    amount != null && Number.isFinite(usdDopRate) && usdDopRate > 0
      ? Math.round(amount * usdDopRate * 100) / 100
      : null;

  if (amount == null || amount <= 0) {
    return (
      <div className="cardnet-pay">
        <p className="cardnet-pay__status">{t("pay.pricePending")}</p>
      </div>
    );
  }

  async function onPayClick() {
    if (!captchaToken) {
      setError(t("pay.captchaError"));
      return;
    }
    setError("");
    setLoading(true);
    const token = captchaToken;
    onCaptchaUsed();
    try {
      const session = await startCardnetCheckout({
        reservation,
        amountUsd: amount!,
        captchaToken: token,
        pageLanguage: locale === "es" ? "ESP" : "ING",
      });
      redirectToCardnetAuthorize(session);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error && err.message === "captcha"
          ? t("pay.captchaError")
          : err instanceof Error && err.message
            ? err.message
            : t("pay.cardnetError"),
      );
    }
  }

  return (
    <div className="cardnet-pay">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-blue cardnet-pay__btn"
        disabled={loading || !captchaToken}
        onClick={() => void onPayClick()}
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
      {dop != null && (
        <p className="cardnet-pay__status">
          {t("pay.cardnetDop", {
            amount: dop.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          })}
        </p>
      )}
    </div>
  );
}
