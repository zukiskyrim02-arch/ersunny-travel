import { useState, type FormEvent } from "react";
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

function newChallenge() {
  return {
    a: Math.floor(Math.random() * 7) + 2,
    b: Math.floor(Math.random() * 7) + 2,
  };
}

export function CardnetPayButton({ reservation, amount }: CardnetPayButtonProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [challenge, setChallenge] = useState(newChallenge);
  const [answer, setAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  if (amount == null || amount <= 0) {
    return (
      <div className="cardnet-pay">
        <p className="cardnet-pay__status">{t("pay.pricePending")}</p>
      </div>
    );
  }

  async function doCheckout() {
    setError("");
    setLoading(true);
    try {
      const session = await startCardnetCheckout({
        reservation,
        amountUsd: amount!,
        pageLanguage: locale === "es" ? "SPA" : "ENG",
      });
      redirectToCardnetAuthorize(session);
    } catch {
      setLoading(false);
      setError(t("pay.cardnetError"));
    }
  }

  function onPayClick() {
    setError("");
    setCaptchaError("");
    setAnswer("");
    setChallenge(newChallenge());
    setShowCaptcha(true);
  }

  function onCaptchaSubmit(e: FormEvent) {
    e.preventDefault();
    if (Number(answer.trim()) !== challenge.a + challenge.b) {
      setCaptchaError(t("pay.captchaError"));
      setAnswer("");
      setChallenge(newChallenge());
      return;
    }
    setShowCaptcha(false);
    void doCheckout();
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
        disabled={loading || showCaptcha}
        onClick={onPayClick}
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

      {showCaptcha && (
        <form className="captcha-panel" onSubmit={onCaptchaSubmit}>
          <p className="captcha-panel__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2.5 4.5 5.5v6.2c0 5.1 3.3 8.6 7.5 10.3 4.2-1.7 7.5-5.2 7.5-10.3V5.5L12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="m8.8 12 2.2 2.2 4.2-4.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("pay.captchaTitle")}
          </p>
          <label className="captcha-panel__field">
            <span>
              {t("pay.captchaQuestion", { a: challenge.a, b: challenge.b })}
            </span>
            <input
              type="number"
              inputMode="numeric"
              autoComplete="off"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t("pay.captchaPlaceholder")}
              aria-invalid={Boolean(captchaError)}
              autoFocus
              required
            />
          </label>
          {captchaError && (
            <p className="captcha-panel__error" role="alert">
              {captchaError}
            </p>
          )}
          <div className="captcha-panel__actions">
            <button
              type="button"
              className="captcha-panel__cancel"
              onClick={() => setShowCaptcha(false)}
            >
              {t("pay.captchaCancel")}
            </button>
            <button type="submit" className="btn-blue captcha-panel__confirm">
              {t("pay.captchaConfirm")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
