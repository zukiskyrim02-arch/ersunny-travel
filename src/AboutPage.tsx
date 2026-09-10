import { useEffect, useState } from "react";
import { logoSrc } from "./assets";
import { useI18n } from "./i18n/I18nProvider";
import { useAppConfig } from "./store/hooks";
import { SiteFooter } from "./SiteFooter";
import { LanguageSwitch } from "./LanguageSwitch";
import { SideMenu } from "./SideMenu";

const VALUE_INDICES = [0, 1, 2, 3, 4] as const;
const FAQ_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export function AboutPage() {
  const { t, locale } = useI18n();
  const { contact, page } = useAppConfig();
  const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
    t("common.waPrefill"),
  )}`;
  const mission =
    locale === "es" && page.aboutMission
      ? page.aboutMission
      : t("about.mission");
  const vision =
    locale === "es" && page.aboutVision
      ? page.aboutVision
      : t("about.vision");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [navOpen, setNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    function goToFaqOrTop() {
      const path = window.location.pathname || "/";
      if (path.includes("faq") || window.location.hash === "#faq") {
        window.setTimeout(() => {
          document
            .getElementById("faq")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      } else {
        window.scrollTo(0, 0);
      }
    }
    goToFaqOrTop();
    window.addEventListener("popstate", goToFaqOrTop);
    window.addEventListener("hashchange", goToFaqOrTop);
    return () => {
      window.removeEventListener("popstate", goToFaqOrTop);
      window.removeEventListener("hashchange", goToFaqOrTop);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, navOpen]);

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
            <a href="/excursions" onClick={() => setNavOpen(false)}>
              {t("nav.excursions")}
            </a>
            <a
              href="/about"
              className="is-active"
              onClick={() => setNavOpen(false)}
            >
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

      <main id="main-content" className="about-page" key={`about-${locale}`}>
        <section className="about-page__hero">
          <div className="container">
            <p className="section__eyebrow">{t("about.eyebrow")}</p>
            <h1 className="section__title">{t("about.title")}</h1>
            <p className="section__lead">{t("about.lead")}</p>
          </div>
        </section>

        <section className="section section--soft">
          <div className="container">
            <div className="about-grid">
              <article className="about-block">
                <h2>{t("about.missionTitle")}</h2>
                <p>{mission}</p>
              </article>
              <article className="about-block">
                <h2>{t("about.visionTitle")}</h2>
                <p>{vision}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="section__eyebrow">{t("about.valuesEyebrow")}</p>
              <h2 className="section__title">{t("about.valuesTitle")}</h2>
            </div>
            <div className="values-grid">
              {VALUE_INDICES.map((i) => (
                <article className="value-item" key={i}>
                  <h3>{t(`about.value.${i}.title`)}</h3>
                  <p>{t(`about.value.${i}.copy`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--soft" id="faq">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="section__eyebrow">{t("about.faqEyebrow")}</p>
              <h2 className="section__title">{t("about.faqTitle")}</h2>
            </div>
            <div className="faq-list">
              {FAQ_INDICES.map((index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    className={`faq-item${isOpen ? " is-open" : ""}`}
                    key={index}
                  >
                    <button
                      type="button"
                      className="faq-item__q"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{t(`faq.${index}.q`)}</span>
                      <span aria-hidden>{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <p className="faq-item__a">{t(`faq.${index}.a`)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
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
