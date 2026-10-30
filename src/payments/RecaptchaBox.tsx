import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/locales";

type Grecaptcha = {
  ready: (callback: () => void) => void;
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    ___grecaptcha_cfg?: unknown;
  }
}

export type RecaptchaHandle = {
  reset: () => void;
};

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

/** Google reCAPTCHA `hl` codes for our site locales. */
function recaptchaHl(locale: Locale): string {
  if (locale === "zh") return "zh-CN";
  return locale;
}

let loader: Promise<Grecaptcha> | null = null;
let loadedHl: string | null = null;

function unloadRecaptcha() {
  document
    .querySelectorAll('script[src*="google.com/recaptcha/api.js"]')
    .forEach((el) => el.remove());
  delete window.grecaptcha;
  delete window.___grecaptcha_cfg;
  loader = null;
  loadedHl = null;
}

function loadRecaptcha(hl: string): Promise<Grecaptcha> {
  if (window.grecaptcha?.render && loadedHl === hl) {
    return Promise.resolve(window.grecaptcha);
  }
  if (loadedHl != null && loadedHl !== hl) {
    unloadRecaptcha();
  }
  if (!loader) {
    loadedHl = hl;
    loader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?hl=${encodeURIComponent(hl)}&render=explicit`;
      script.async = true;
      script.onload = () => {
        const api = window.grecaptcha;
        if (!api) {
          reject(new Error("reCAPTCHA did not load"));
          return;
        }
        api.ready(() => resolve(api));
      };
      script.onerror = () => {
        unloadRecaptcha();
        reject(new Error("reCAPTCHA did not load"));
      };
      document.head.appendChild(script);
    });
  }
  return loader;
}

export const RecaptchaBox = forwardRef<
  RecaptchaHandle,
  { onToken: (token: string) => void }
>(function RecaptchaBox({ onToken }, ref) {
  const { t, locale } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetId.current != null) window.grecaptcha?.reset(widgetId.current);
      onTokenRef.current("");
    },
  }));

  useEffect(() => {
    if (!SITE_KEY || !boxRef.current) return undefined;
    let cancelled = false;
    const hl = recaptchaHl(locale);
    const host = boxRef.current;
    host.innerHTML = "";
    widgetId.current = null;
    onTokenRef.current("");

    loadRecaptcha(hl)
      .then((api) => {
        if (cancelled || !boxRef.current || widgetId.current != null) return;
        widgetId.current = api.render(boxRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => {
        if (!cancelled) onTokenRef.current("");
      });

    return () => {
      cancelled = true;
      widgetId.current = null;
      if (host) host.innerHTML = "";
    };
  }, [locale]);

  if (!SITE_KEY) {
    return <p className="recaptcha-box__missing">{t("pay.captchaMissing")}</p>;
  }

  return (
    <div className="recaptcha-box">
      <p className="recaptcha-box__title">{t("pay.captchaTitle")}</p>
      <div ref={boxRef} />
    </div>
  );
});
