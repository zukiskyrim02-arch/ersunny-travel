import { useEffect, useState } from "react";
import { SideMenu } from "./SideMenu";
import { logoSrc } from "./assets";
import { about, contact, faqs } from "./data";

const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
  "Hi Ersunny Travel! I'd like to book a transfer or excursion.",
)}`;

export function AboutPage() {
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
            aria-label="Ersunny Travel home"
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
            aria-label="Main"
          >
            <a href="/" onClick={() => setNavOpen(false)}>
              Home
            </a>
            <a href="/#servicios" onClick={() => setNavOpen(false)}>
              Transfers
            </a>
            <a href="/excursions" onClick={() => setNavOpen(false)}>
              Excursions
            </a>
            <a
              href="/about"
              className="is-active"
              onClick={() => setNavOpen(false)}
            >
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

      <main id="main-content" className="about-page">
        <section className="about-page__hero">
          <div className="container">
            <p className="section__eyebrow">About Ersunny Travel</p>
            <h1 className="section__title">
              Private transfers &amp; excursions in Punta Cana
            </h1>
            <p className="section__lead">
              Safe tourist transport from Punta Cana Airport to hotels in Punta
              Cana, Bávaro, and Macao — plus excursions that celebrate Dominican
              culture and nature.
            </p>
          </div>
        </section>

        <section className="section section--soft">
          <div className="container">
            <div className="about-grid">
              <article className="about-block">
                <h2>Mission</h2>
                <p>{about.mission}</p>
              </article>
              <article className="about-block">
                <h2>Vision</h2>
                <p>{about.vision}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="section__eyebrow">Our values</p>
              <h2 className="section__title">What guides every transfer</h2>
            </div>
            <div className="values-grid">
              {about.values.map((value) => (
                <article className="value-item" key={value.title}>
                  <h3>{value.title}</h3>
                  <p>{value.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--soft" id="faq">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="section__eyebrow">FAQ</p>
              <h2 className="section__title">Frequently asked questions</h2>
            </div>
            <div className="faq-list">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    className={`faq-item${isOpen ? " is-open" : ""}`}
                    key={item.q}
                  >
                    <button
                      type="button"
                      className="faq-item__q"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{item.q}</span>
                      <span aria-hidden>{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && <p className="faq-item__a">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contacto">
        <div className="container site-footer__grid">
          <div>
            <a href="/" className="site-footer__logo" aria-label="Ersunny Travel home">
              <img
                src={logoSrc()}
                alt="Ersunny Travel"
                width={160}
                height={160}
              />
            </a>
            <p>
              Private transfers &amp; excursions in Punta Cana, Bávaro &amp;
              Macao.
            </p>
          </div>
          <div>
            <p className="site-footer__heading">Services</p>
            <a href="/#servicios">Transfers</a>
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
            © {new Date().getFullYear()} Ersunny Travel · Design By Ismakun
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
