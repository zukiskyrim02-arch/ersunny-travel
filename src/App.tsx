import { useEffect, useState } from "react";
import { QuoteForm } from "./QuoteForm";
import { SideMenu } from "./SideMenu";
import { LanguageSwitch } from "./LanguageSwitch";
import { asset, logoSrc } from "./assets";
import type { Reservation } from "./reservations";
import { navigate } from "./routing";
import { SiteFooter } from "./SiteFooter";
import { useI18n } from "./i18n/I18nProvider";
import { useAppConfig } from "./store/hooks";

const HERO_IMG = asset("hero-cover.webp");
const HERO_IMG_MOBILE = asset("hero-cover-mobile.webp");
const HERO_IMG_FALLBACK = asset("hero-cover.jpg");
const HERO_IMG_MOBILE_FALLBACK = asset("hero-cover-mobile.jpg");
const BEACH_IMG = asset("hero-cover-mobile.webp");
const TRANSFER_IMG = asset("transfer-van.webp");
const TRANSFER_IMG_FALLBACK = asset("transfer-van.jpg");
const EXCURSION_IMG =
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=480&q=55&fm=webp";

const trustItems = [
  { titleKey: "trust.safe", copyKey: "trust.safeCopy", icon: "shield" },
  { titleKey: "trust.wa", copyKey: "trust.waCopy", icon: "whatsapp" },
  { titleKey: "trust.private", copyKey: "trust.privateCopy", icon: "car" },
  { titleKey: "trust.email", copyKey: "trust.emailCopy", icon: "mail" },
];

const testimonials = [
  {
    name: "Maria G.",
    placeKey: "review.0.place",
    tripKey: "review.0.trip",
    quoteKey: "review.0.quote",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=70&fm=webp",
  },
  {
    name: "Carlos R.",
    placeKey: "review.1.place",
    tripKey: "review.1.trip",
    quoteKey: "review.1.quote",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70&fm=webp",
  },
  {
    name: "Emma L.",
    placeKey: "review.2.place",
    tripKey: "review.2.trip",
    quoteKey: "review.2.quote",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70&fm=webp",
  },
];

function Stars() {
  const { t } = useI18n();
  return (
    <div className="review-stars" aria-label={t("stars.aria")}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" width="16" height="16" aria-hidden>
          <path
            fill="currentColor"
            d="M10 1.6 12.7 7l5.9.5-4.5 3.9 1.4 5.7L10 14.8 4.5 17.1l1.4-5.7L1.4 7.5 7.3 7 10 1.6Z"
          />
        </svg>
      ))}
    </div>
  );
}

function TrustIcon({ name }: { name: string }) {
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.5 4.5 5.5v6.2c0 5.1 3.3 8.6 7.5 10.3 4.2-1.7 7.5-5.2 7.5-10.3V5.5L12 2.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m8.8 12.1 2.2 2.2 4.4-4.6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.2A9.8 9.8 0 0 0 3.4 16.9L2.2 21.8l5-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3a8 8 0 1 1 6.8 3.7Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-1.4-.5-2.6-1.6-3.4-2.9-.1-.2 0-.3.1-.4l.4-.5c.1-.1.2-.3.1-.5-.1-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3s-.8.8-.8 1.9.8 2.2.9 2.3c.1.2 1.6 2.6 4 3.5 1.4.5 2 .6 2.7.5.4-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.1-1.2-.1 0-.3-.1-.5-.2Z" />
      </svg>
    );
  }
  if (name === "car") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 15.5h15l-1.1-4.1a2.2 2.2 0 0 0-2.1-1.6H7.7a2.2 2.2 0 0 0-2.1 1.6l-1.1 4.1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M6.2 9.8 7.4 7.4A1.6 1.6 0 0 1 8.8 6.5h6.4a1.6 1.6 0 0 1 1.4.9l1.2 2.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="7.2" cy="15.5" r="1.35" fill="currentColor" />
        <circle cx="16.8" cy="15.5" r="1.35" fill="currentColor" />
        <path
          d="M3.5 15.5h17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4.8 7.5 6.5 5.1a1.2 1.2 0 0 0 1.4 0l6.5-5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const { t, locale } = useI18n();
  const config = useAppConfig();
  const contact = config.contact;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [navOpen, setNavOpen] = useState(false);
  const popularExcursions = config.excursions
    .filter((e) => e.active)
    .slice(0, 5);

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

  const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
    t("common.waPrefill"),
  )}`;

  const heroEyebrow =
    locale === "es" && config.page.heroEyebrow
      ? config.page.heroEyebrow
      : t("hero.eyebrow");
  const heroTitle =
    locale === "es" && config.page.heroTitle
      ? config.page.heroTitle
      : t("hero.title");
  const heroLead =
    locale === "es" && config.page.heroLead
      ? config.page.heroLead
      : t("hero.lead");
  const servicesTitle =
    locale === "es" && config.page.servicesTitle
      ? config.page.servicesTitle
      : t("section.servicesTitle");
  const servicesLead =
    locale === "es" && config.page.servicesLead
      ? config.page.servicesLead
      : t("section.servicesLead");

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="site-header__logo" href="/" aria-label={t("nav.logoAria")}>
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
            <a href="/" className="is-active" onClick={() => setNavOpen(false)}>
              {t("nav.home")}
            </a>
            <a href="/#servicios" onClick={() => setNavOpen(false)}>
              {t("nav.transfers")}
            </a>
            <a href="/excursions" onClick={() => setNavOpen(false)}>
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

      <main id="main-content">
        <section className="hero-new" aria-label="Punta Cana airport transfers">
          <div className="hero-new__media">
            <picture>
              <source
                media="(max-width: 768px)"
                srcSet={HERO_IMG_MOBILE}
                type="image/webp"
              />
              <source
                media="(max-width: 768px)"
                srcSet={HERO_IMG_MOBILE_FALLBACK}
                type="image/jpeg"
              />
              <source srcSet={HERO_IMG} type="image/webp" />
              <img
                src={HERO_IMG_FALLBACK}
                alt="Ersunny Travel private van and driver welcoming guests at a Punta Cana resort"
                width={1600}
                height={900}
                sizes="100vw"
                fetchPriority="high"
                decoding="sync"
              />
            </picture>
          </div>
          <div className="hero-new__overlay" aria-hidden />
          <div className="hero-new__content">
            <p className="hero-new__eyebrow">{heroEyebrow}</p>
            <h1 className="hero-new__title">{heroTitle}</h1>
            <p className="hero-new__sub">{heroLead}</p>
            <div className="hero-new__actions">
              <a className="btn-yellow" href="/#cotizar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 16h14l-1.2-4.2A2 2 0 0 0 15.9 10H8.1a2 2 0 0 0-1.9 1.8L5 16Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M7 16v2M17 16v2M3 16h18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                {t("hero.ctaTransfer")}
              </a>
              <a className="btn-ghost-light" href="/excursions">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
                  <path d="m12 8 2 4 4 .5-3 2.7.8 4.3L12 17l-3.8 2.5.8-4.3-3-2.7L10 12l2-4Z" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                {t("hero.ctaExcursions")}
              </a>
            </div>
          </div>

          <div className="trust-bar">
            {trustItems.map((item) => (
              <div className="trust-bar__item" key={item.titleKey}>
                <span className="trust-bar__icon">
                  <TrustIcon name={item.icon} />
                </span>
                <div>
                  <strong>{t(item.titleKey)}</strong>
                  {item.icon === "mail" ? (
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  ) : item.icon === "whatsapp" ? (
                    <a
                      href={`https://wa.me/${contact.whatsappDigits}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t(item.copyKey)}
                    </a>
                  ) : (
                    <span>{t(item.copyKey)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section--soft" id="servicios" key={`servicios-${locale}`}>
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">{t("section.servicesEyebrow")}</p>
              <h2 className="section__title">{servicesTitle}</h2>
              <p className="section__lead">{servicesLead}</p>
            </div>

            <div className="services-grid">
              <article className="service-card">
                <div className="service-card__img">
                  <picture>
                    <source srcSet={TRANSFER_IMG} type="image/webp" />
                    <img
                      src={TRANSFER_IMG_FALLBACK}
                      alt="Private van for Punta Cana airport transfers to Bávaro and Macao hotels"
                      loading="lazy"
                      width={800}
                      height={480}
                    />
                  </picture>
                </div>
                <div className="service-card__body">
                  <div className="service-card__top">
                    <span className="service-card__icon" aria-hidden>
                      <TrustIcon name="car" />
                    </span>
                    <div>
                      <h3>{t("services.transfersTitle")}</h3>
                      <p className="service-card__sub">
                        {t("services.transfersSub")}
                      </p>
                    </div>
                  </div>
                  <ul className="service-card__list">
                    <li>{t("services.transfers1")}</li>
                    <li>{t("services.transfers2")}</li>
                    <li>{t("services.transfers3")}</li>
                  </ul>
                  <a className="service-card__link" href="/#cotizar">
                    {t("services.bookTransfer")}
                  </a>
                </div>
              </article>

              <article className="service-card">
                <div className="service-card__img">
                  <img
                    src={EXCURSION_IMG}
                    alt="Catamaran excursion in Punta Cana"
                    loading="lazy"
                    width={800}
                    height={480}
                  />
                </div>
                <div className="service-card__body">
                  <div className="service-card__top">
                    <span className="service-card__icon" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M12 20c.4-1.8 3.2-4.2 4.8-7.2A5.2 5.2 0 1 0 7.2 12.8C8.8 15.8 11.6 18.2 12 20Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9.2 9.2c1.1-2.2 2.2-3.4 2.8-3.7.6.3 1.7 1.5 2.8 3.7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 14.5c1.3.8 2.6 1.2 4 1.2s2.7-.4 4-1.2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <div>
                      <h3>{t("services.excursionsTitle")}</h3>
                      <p className="service-card__sub">
                        {t("services.excursionsSub")}
                      </p>
                    </div>
                  </div>
                  <ul className="service-card__list">
                    <li>{t("services.excursions1")}</li>
                    <li>{t("services.excursions2")}</li>
                    <li>{t("services.excursions3")}</li>
                    <li>{t("services.excursions4")}</li>
                  </ul>
                  <a className="service-card__link" href="/excursions">
                    {t("services.viewExcursions")}
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="quote-band" id="cotizar">
          <div className="quote-band__media" aria-hidden>
            <img src={BEACH_IMG} alt="" width={800} height={450} loading="lazy" decoding="async" />
          </div>
          <div className="quote-band__inner container">
            <div className="quote-band__copy">
              <p className="section__eyebrow section__eyebrow--light">
                {t("section.quoteEyebrow")}
              </p>
              <h2>{t("section.quoteTitle")}</h2>
              <p>{t("section.quoteLead")}</p>
              <ul className="quote-perks">
                <li>{t("section.perk1")}</li>
                <li>{t("section.perk2")}</li>
                <li>{t("section.perk3")}</li>
              </ul>
            </div>
            <div className="quote-band__form">
              <QuoteForm onBooked={handleBooked} />
            </div>
          </div>
        </section>

        <section
          className="section section--soft"
          id="excursiones-populares"
          key={`excursiones-${locale}`}
        >
          <div className="container">
            <div className="excursions-head">
              <div>
                <p className="section__eyebrow">{t("section.excursionsEyebrow")}</p>
                <h2 className="section__title">{t("section.excursionsTitle")}</h2>
              </div>
              <a className="service-card__link" href="/excursions">
                {t("section.viewAll")}
              </a>
            </div>

            <div className="excursion-cards">
              {popularExcursions.map((item) => {
                const title = t(`exc.${item.id}.title`);
                const duration = t(
                  item.duration === "Half day"
                    ? "exc.duration.half"
                    : "exc.duration.full",
                );
                return (
                <article className="excursion-card" key={item.id}>
                  <div className="excursion-card__img">
                    <img
                      src={item.image}
                      alt={title}
                      loading="lazy"
                      width={480}
                      height={320}
                    />
                  </div>
                  <div className="excursion-card__body">
                    <h3>{title}</h3>
                    <ul className="excursion-card__meta">
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle
                            cx="12"
                            cy="12"
                            r="8"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 8v4.5l3 1.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>{duration}</span>
                      </li>
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M12 3v18M8 7.5c1.2-1 2.5-1.5 4-1.5 2.2 0 4 1.1 4 3s-1.8 3-4 3-4 1.1-4 3 1.8 3 4 3c1.5 0 2.8-.5 4-1.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>
                          {item.price != null
                            ? t("section.priceFrom", { price: item.price })
                            : t("section.priceOnRequest")}
                        </span>
                      </li>
                    </ul>
                    <a className="btn-blue" href="/excursions">
                      {t("section.viewDetails")}
                    </a>
                  </div>
                </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="section reviews"
          id="testimonios"
          key={`testimonios-${locale}`}
        >
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">{t("section.reviewsEyebrow")}</p>
              <h2 className="section__title">{t("section.reviewsTitle")}</h2>
              <p className="section__lead">{t("section.reviewsLead")}</p>
            </div>

            <div className="reviews-board">
              <article className="review review--featured">
                <span className="review__mark" aria-hidden>
                  “
                </span>
                <Stars />
                <blockquote>{t(testimonials[0].quoteKey)}</blockquote>
                <footer className="review__author">
                  <img
                    src={testimonials[0].avatar}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                  />
                  <div>
                    <strong>{testimonials[0].name}</strong>
                    <span>
                      {t(testimonials[0].placeKey)} · {t(testimonials[0].tripKey)}
                    </span>
                  </div>
                </footer>
              </article>

              <div className="reviews-board__side">
                {testimonials.slice(1).map((item) => (
                  <article className="review" key={item.name}>
                    <Stars />
                    <blockquote>{t(item.quoteKey)}</blockquote>
                    <footer className="review__author">
                      <img
                        src={item.avatar}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                      />
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {t(item.placeKey)} · {t(item.tripKey)}
                        </span>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
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
