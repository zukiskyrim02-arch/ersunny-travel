import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";
import type { Locale } from "./i18n/locales";

type LanguageSwitchProps = {
  /** Compact control for tight header layouts */
  compact?: boolean;
};

export function LanguageSwitch({ compact = false }: LanguageSwitchProps) {
  const { locale, setLocale, locales, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(code: Locale) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <div
      className={`lang-switch${open ? " is-open" : ""}${compact ? " lang-switch--compact" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="lang-switch__btn"
        aria-label={t("nav.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{current.flag}</span>
        <span className="lang-switch__code">{current.label}</span>
        <svg
          className="lang-switch__caret"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul className="lang-switch__menu" role="listbox" aria-label={t("nav.language")}>
          {locales.map((item) => (
            <li key={item.code} role="option" aria-selected={item.code === locale}>
              <button
                type="button"
                className={item.code === locale ? "is-active" : undefined}
                onClick={() => choose(item.code)}
              >
                <span aria-hidden>{item.flag}</span>
                <span>{item.name}</span>
                <span className="lang-switch__menu-code">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
