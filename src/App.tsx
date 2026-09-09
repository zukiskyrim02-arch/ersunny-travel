import { useEffect, useState } from "react";
import { QuoteForm } from "./QuoteForm";
import { SideMenu } from "./SideMenu";
import { asset } from "./assets";
import { contact, excursions as showcaseExcursions } from "./data";

const HERO_IMG = asset("hero-cover.webp");
const HERO_IMG_FALLBACK = asset("hero-cover.jpg");
const BEACH_IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80&fm=webp";
const TRANSFER_IMG = asset("transfer-van.webp");
const TRANSFER_IMG_FALLBACK = asset("transfer-van.jpg");
const EXCURSION_IMG =
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80&fm=webp";

const trustItems = [
  {
    title: "Safe & Reliable",
    copy: "Your peace of mind is our priority.",
    icon: "shield",
  },
  {
    title: "WhatsApp Support",
    copy: "Direct chat before and during your trip.",
    icon: "whatsapp",
  },
  {
    title: "Private Transfers",
    copy: "Comfort for your group.",
    icon: "car",
  },
  {
    title: "Email Support",
    copy: contact.email,
    icon: "mail",
  },
];

const testimonials = [
  {
    name: "Maria G.",
    place: "United States",
    quote:
      "Excellent service from pickup to drop-off. The driver was waiting with our name and the SUV was spotless.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Carlos R.",
    place: "Spain",
    quote:
      "Booked Saona through Ersunny and everything was seamless. Clear communication on WhatsApp the whole time.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Emma L.",
    place: "Canada",
    quote:
      "Airport transfer with kids was stress-free. On time, friendly, and fair pricing. Highly recommend.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
  },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [navOpen, setNavOpen] = useState(false);

  const popularExcursions = showcaseExcursions.slice(0, 5);

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

  const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
    "Hi Ersunny Travel! I'd like to book a transfer or excursion.",
  )}`;

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="site-header__logo" href="/" aria-label="Ersunny Travel home">
            <img
              src={asset("ersunny-logo.png")}
              alt="Ersunny Travel"
              width={160}
              height={160}
            />
          </a>

          <nav
            className={`site-nav${navOpen ? " is-open" : ""}`}
            aria-label="Main"
          >
            <a href="/" className="is-active" onClick={() => setNavOpen(false)}>
              Home
            </a>
            <a href="/#servicios" onClick={() => setNavOpen(false)}>
              Transfers
            </a>
            <a href="/excursions" onClick={() => setNavOpen(false)}>
              Excursions
            </a>
            <a href="/about" onClick={() => setNavOpen(false)}>
              About Us
            </a>
            <a href="/contact" onClick={() => setNavOpen(false)}>
              Contact
            </a>
            <button
              type="button"
              className="site-nav__tracker"
              onClick={() => openMenu("tracker")}
            >
              Confirm pickup
            </button>
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
              Book Now
            </a>
            <span className="lang-switch" aria-label="Language">
              <span aria-hidden>🇺🇸</span> EN
            </span>
            <button
              className="menu-toggle"
              type="button"
              aria-label="Open menu"
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
              <source srcSet={HERO_IMG} type="image/webp" />
              <img
                src={HERO_IMG_FALLBACK}
                alt="Private transfer ready at Punta Cana Airport for hotel drop-off"
                width={1600}
                height={960}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>
          <div className="hero-new__overlay" aria-hidden />
          <div className="hero-new__content">
            <p className="hero-new__eyebrow">
              Affordable &amp; luxury airport transfers · Punta Cana, Bávaro &amp; Macao
            </p>
            <h1 className="hero-new__title">
              Punta Cana airport transfers <em>without worries</em>
            </h1>
            <p className="hero-new__sub">
              Private transfers from Punta Cana Airport (PUJ) to hotels in Punta
              Cana, Bávaro, and Macao — budget-friendly or luxury vehicles — plus
              excursions and WhatsApp support in one place.
            </p>
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
                Book Your Transfer
              </a>
              <a className="btn-ghost-light" href="/excursions">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
                  <path d="m12 8 2 4 4 .5-3 2.7.8 4.3L12 17l-3.8 2.5.8-4.3-3-2.7L10 12l2-4Z" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                View Excursions
              </a>
            </div>
          </div>

          <div className="trust-bar">
            {trustItems.map((item) => (
              <div className="trust-bar__item" key={item.title}>
                <span className="trust-bar__icon">
                  <TrustIcon name={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  {item.icon === "mail" ? (
                    <a href={`mailto:${contact.email}`}>{item.copy}</a>
                  ) : item.icon === "whatsapp" ? (
                    <a
                      href={`https://wa.me/${contact.whatsappDigits}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.copy}
                    </a>
                  ) : (
                    <span>{item.copy}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section--soft" id="servicios">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Our services</p>
              <h2 className="section__title">
                Private transfers &amp; excursions in Punta Cana
              </h2>
              <p className="section__lead">
                Transfers and excursions designed to make your trip unforgettable.
              </p>
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
                      <h3>Private Transfers</h3>
                      <p className="service-card__sub">
                        Punta Cana Airport ↔ Hotels &amp; Tourist Destinations
                      </p>
                    </div>
                  </div>
                  <ul className="service-card__list">
                    <li>Private and comfortable vehicles</li>
                    <li>Professional drivers</li>
                    <li>On-time service</li>
                  </ul>
                  <a className="service-card__link" href="/#cotizar">
                    Book a Transfer →
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
                      <h3>Excursions</h3>
                      <p className="service-card__sub">
                        Discover the best of Punta Cana and its surroundings.
                      </p>
                    </div>
                  </div>
                  <ul className="service-card__list">
                    <li>Saona Island</li>
                    <li>Catalina Island</li>
                    <li>Scape Park</li>
                    <li>Buggies, Santo Domingo and more...</li>
                  </ul>
                  <a className="service-card__link" href="/excursions">
                    View Excursions →
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="quote-band" id="cotizar">
          <div className="quote-band__media" aria-hidden>
            <img src={BEACH_IMG} alt="" width={2000} height={1200} />
          </div>
          <div className="quote-band__inner container">
            <div className="quote-band__copy">
              <p className="section__eyebrow section__eyebrow--light">
                Quote your Punta Cana transfer
              </p>
              <h2>
                Airport to hotel — <em>fast &amp; secure</em>
              </h2>
              <p>
                Tell us your flight and hotel in Punta Cana, Bávaro, or Macao.
                We reply on WhatsApp with an affordable or luxury vehicle option.
              </p>
              <ul className="quote-perks">
                <li>Response in minutes</li>
                <li>No hidden fees</li>
                <li>Secure payment</li>
              </ul>
            </div>
            <div className="quote-band__form">
              <QuoteForm />
            </div>
          </div>
        </section>

        <section className="section section--soft" id="excursiones-populares">
          <div className="container">
            <div className="excursions-head">
              <div>
                <p className="section__eyebrow">Popular Punta Cana excursions</p>
                <h2 className="section__title">
                  Tours &amp; experiences with hotel pickup
                </h2>
              </div>
              <a className="service-card__link" href="/excursions">
                View all excursions →
              </a>
            </div>

            <div className="excursion-cards">
              {popularExcursions.map((item) => (
                <article className="excursion-card" key={item.id}>
                  <div className="excursion-card__img">
                    <img
                      src={item.image}
                      alt={`${item.title} excursion in Punta Cana`}
                      loading="lazy"
                      width={480}
                      height={320}
                    />
                  </div>
                  <div className="excursion-card__body">
                    <h3>{item.title}</h3>
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
                        <span>{item.duration}</span>
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
                            ? `From US$ ${item.price}`
                            : "Price on request"}
                        </span>
                      </li>
                    </ul>
                    <a className="btn-blue" href="/excursions">
                      View details
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--soft" id="testimonios">
          <div className="container">
            <div className="section__head section__head--center">
              <h2 className="section__title">What our travelers say</h2>
            </div>
            <div className="testimonials">
              {testimonials.map((t) => (
                <article className="testimonial-card" key={t.name}>
                  <img
                    src={t.avatar}
                    alt={`Photo of ${t.name}`}
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                  <div className="testimonial-card__stars" aria-hidden="true">
                    {"★★★★★"}
                  </div>
                  <p>
                    <span className="visually-hidden">5 out of 5 stars. </span>
                    “{t.quote}”
                  </p>
                  <strong>
                    {t.name} — {t.place}
                  </strong>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contacto">
        <div className="container site-footer__grid">
          <div>
            <a href="/" className="site-footer__logo" aria-label="Ersunny Travel home">
              <img
                src={asset("ersunny-logo.png")}
                alt="Ersunny Travel"
                width={160}
                height={160}
              />
            </a>
            <p>Private transfers &amp; excursions in Punta Cana, Bávaro &amp; Macao.</p>
          </div>
          <div>
            <p className="site-footer__heading">Services</p>
            <a href="/#cotizar">Transfers</a>
            <a href="/excursions">Excursions</a>
            <a href="/about">About us</a>
            <a href="/contact">Contact</a>
          </div>
          <div>
            <p className="site-footer__heading">Information</p>
            <a href="/about/faq">FAQs</a>
            <button type="button" onClick={() => openMenu("tracker")}>
              Confirm pickup
            </button>
          </div>
          <div>
            <p className="site-footer__heading">Contact</p>
            <a
              href={`https://wa.me/${contact.whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
            >
              {contact.whatsapp}
            </a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <p>Punta Cana, Dominican Republic</p>
          </div>
        </div>
        <div className="container site-footer__bottom">
          <p>
            © {new Date().getFullYear()} Ersunny Travel · designed By Ismakun
          </p>
        </div>
      </footer>

      <a
        className="wa-float"
        href={waBookHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.1-.3.2-.6.1-1.6-.6-2.9-1.7-3.8-3.2-.1-.2 0-.3.1-.5l.5-.6c.1-.2.2-.3.1-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 1.6.6 2.2.7 3 .6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.6-.3Z" />
          <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z" />
        </svg>
      </a>
    </>
  );
}
