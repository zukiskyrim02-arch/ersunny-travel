import { useEffect, useState, type FormEvent } from "react";
import { SideMenu } from "./SideMenu";
import { asset } from "./assets";
import { bankPayment, contact } from "./data";

const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
  "Hi Ersunny Travel! I'd like to book a transfer or excursion.",
)}`;

export function ContactPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("contact");
  const [navOpen, setNavOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, navOpen]);

  function openMenu(panel: "tracker" | "contact" = "contact") {
    setNavOpen(false);
    setMenuPanel(panel);
    setMenuOpen(true);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const lines = [
      `Hola Ersunny Travel, soy ${name || "un cliente"}.`,
      message || "Me gustaría más información sobre sus servicios.",
    ];
    const url = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(lines.join("\n\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="site-header__logo" href="#/">
            <img
              src={asset("ersunny-logo.png")}
              alt="Ersunny Travel"
              width={160}
              height={72}
            />
          </a>

          <nav
            className={`site-nav${navOpen ? " is-open" : ""}`}
            aria-label="Main"
          >
            <a href="#/" onClick={() => setNavOpen(false)}>
              Home
            </a>
            <a href="#servicios" onClick={() => setNavOpen(false)}>
              Transfers
            </a>
            <a href="#/excursions" onClick={() => setNavOpen(false)}>
              Excursions
            </a>
            <a href="#/about" onClick={() => setNavOpen(false)}>
              About Us
            </a>
            <a
              href="#/contact"
              className="is-active"
              onClick={() => setNavOpen(false)}
            >
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

      <main className="contact-page">
        <section className="contact-hero" aria-label="Contact">
          <div className="contact-hero__media" aria-hidden>
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"
              alt=""
              width={2000}
              height={1200}
            />
          </div>
          <div className="contact-hero__overlay" aria-hidden />
          <div className="contact-hero__inner container">
            <div className="contact-hero__copy">
              <p className="contact-hero__eyebrow">Contact us</p>
              <h1>
                We’re here to <em>help</em>
              </h1>
              <p>
                Reach us on WhatsApp or email — usually with a reply in minutes
                before and during your trip in Punta Cana.
              </p>
              <div className="contact-hero__actions">
                <a
                  className="btn-wa"
                  href={`https://wa.me/${contact.whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp {contact.whatsapp}
                </a>
                <a className="btn-ghost-light" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </div>
            </div>

            <form className="contact-form contact-form--hero" onSubmit={onSubmit}>
              <p className="contact-form__label">Quick message</p>
              <h2>Send us a note</h2>
              <p className="contact-form__lead">
                We’ll open WhatsApp with your message so we can reply faster.
              </p>
              <label className="field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="field">
                <span>Message</span>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your transfer or excursion…"
                  required
                />
              </label>
              <button className="btn-blue" type="submit">
                Continue on WhatsApp
              </button>
            </form>
          </div>
        </section>

        <section className="section contact-channels">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="section__eyebrow">Ways to reach us</p>
              <h2 className="section__title">Pick what works best for you</h2>
            </div>
            <div className="contact-channels__grid">
              <a
                className="contact-channel"
                href={`https://wa.me/${contact.whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-channel__icon contact-channel__icon--wa" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z" />
                  </svg>
                </span>
                <h3>WhatsApp</h3>
                <p>Fastest replies for bookings and pickup updates.</p>
                <strong>{contact.whatsapp}</strong>
              </a>

              <a className="contact-channel" href={`mailto:${contact.email}`}>
                <span className="contact-channel__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
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
                    />
                  </svg>
                </span>
                <h3>Email</h3>
                <p>Perfect for itineraries, invoices and detailed requests.</p>
                <strong>{contact.email}</strong>
              </a>

              <div className="contact-channel contact-channel--static">
                <span className="contact-channel__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
                <h3>Based in Punta Cana</h3>
                <p>Airport transfers and excursions across the east coast.</p>
                <strong>Dominican Republic</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <a href="#/" className="site-footer__logo">
              <img
                src={asset("ersunny-logo.png")}
                alt="Ersunny Travel"
                width={160}
                height={72}
              />
            </a>
            <p>Your trip, our priority.</p>
          </div>
          <div>
            <h4>Services</h4>
            <a href="#servicios">Transfers</a>
            <a href="#/excursions">Excursions</a>
            <a href="#/about">About us</a>
            <a href="#/contact">Contact</a>
          </div>
          <div>
            <h4>Information</h4>
            <a href="#/about/faq">FAQs</a>
            <button type="button" onClick={() => openMenu("tracker")}>
              Confirm pickup
            </button>
          </div>
          <div>
            <h4>Contact</h4>
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
            © {new Date().getFullYear()} Ersunny Travel · RNC {bankPayment.rnc}
          </p>
        </div>
      </footer>

      <a
        className="wa-float"
        href={waBookHref}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.1-.3.2-.6.1-1.6-.6-2.9-1.7-3.8-3.2-.1-.2 0-.3.1-.5l.5-.6c.1-.2.2-.3.1-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 1.6.6 2.2.7 3 .6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.3-.2-.6-.3Z" />
          <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Z" />
        </svg>
      </a>
    </>
  );
}
