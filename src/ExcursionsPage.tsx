import { useEffect, useState } from "react";
import { ExcursionBooking } from "./ExcursionBooking";
import { LanguageSwitch } from "./LanguageSwitch";
import { SideMenu } from "./SideMenu";
import { logoSrc } from "./assets";
import { useI18n } from "./i18n/I18nProvider";
import { useAppConfig } from "./store/hooks";
import type { Reservation } from "./reservations";
import { navigate } from "./routing";
import { SiteFooter } from "./SiteFooter";

export function ExcursionsPage() {
  const { t, locale } = useI18n();
  const { contact } = useAppConfig();
  const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
    t("common.waPrefill"),
  )}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, navOpen]);

  function handleBooked(reservation: Reservation) {
    navigate(`/payment?id=${encodeURIComponent(reservation.id)}`);
  }

  function openMenu(panel: "tracker" | "contact" = "tracker") {
    setNavOpen(false);
    setMenuPanel(panel);
    setMenuOpen(true);
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a
            className="site-header__logo"
            href="/"
            aria-label={t("nav.logoAria")}
          >
            <img
              src={logoSrc()}
              alt="Ersunny Travel"
              width={160}
              height={160}
            />
          </a>

          <nav
            className={`site-nav${navOpen ? " is-open" : ""}`}
            aria-label={t("nav.home")}
          >
            <a href="/" onClick={() => setNavOpen(false)}>
              {t("nav.home")}
            </a>
            <a href="/#servicios" onClick={() => setNavOpen(false)}>
              {t("nav.transfers")}
            </a>
            <a
              href="/excursions"
              className="is-active"
              onClick={() => setNavOpen(false)}
            >
              {t("nav.excursions")}
            </a>
            <a href="/about" onClick={() => setNavOpen(false)}>
              {t("nav.about")}
            </a>
            <a href="/contact" onClick={() => setNavOpen(false)}>
              {t("nav.contact")}
            </a>
            <button
              type="button"
              className="site-nav__tracker"
              onClick={() => openMenu("tracker")}
            >
              {t("nav.pickupStatus")}
            </button>
            <div className="site-nav__lang-mobile">
              <LanguageSwitch />
            </div>
          </nav>

          <div className="site-header__actions">
            <a
              className="btn-wa"
              href={waBookHref}
              target="_blank"
              rel="noreferrer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.1-.3.2-.6.1-1.6-.6-2.9-1.7-3.8-3.2-.1-.2 0-.3.1-.5l.5-.6c.1-.2.2-.3.1-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 1.6.6 2.2.7 3 .6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.6-.3Z" />
                <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z" />
              </svg>
              <span className="btn-wa__label">{t("nav.bookNow")}</span>
            </a>
            <div className="site-header__lang-desktop">
              <LanguageSwitch />
            </div>
            <button
              className="menu-toggle"
              type="button"
              aria-label={t("nav.openMenu")}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        panel={menuPanel}
        onPanelChange={setMenuPanel}
      />

      <main id="main-content" className="excursions-page">
        <ExcursionBooking onBooked={handleBooked} />
      </main>

      <SiteFooter key={locale} onOpenTracker={() => openMenu("tracker")} />

      <a
        className="wa-float"
        href={waBookHref}
        target="_blank"
        rel="noreferrer"
        aria-label={t("common.waFloat")}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.1-.3.2-.6.1-1.6-.6-2.9-1.7-3.8-3.2-.1-.2 0-.3.1-.5l.5-.6c.1-.2.2-.3.1-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 1.6.6 2.2.7 3 .6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.6-.3Z" />
          <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z" />
        </svg>
      </a>
    </>
  );
}
