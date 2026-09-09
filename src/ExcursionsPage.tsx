import { useEffect, useState } from "react";
import { ExcursionBooking } from "./ExcursionBooking";
import { PaymentSection } from "./PaymentSection";
import { SideMenu } from "./SideMenu";
import { asset } from "./assets";
import { contact } from "./data";
import type { Reservation } from "./reservations";

const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
  "Hi Ersunny Travel! I'd like to book a transfer or excursion.",
)}`;

export function ExcursionsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [navOpen, setNavOpen] = useState(false);
  const [latestReservation, setLatestReservation] = useState<Reservation | null>(
    null,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, navOpen]);

  useEffect(() => {
    if (!latestReservation) return;
    const id = window.setTimeout(() => {
      document
        .getElementById("pago")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(id);
  }, [latestReservation]);

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
            <a href="/" onClick={() => setNavOpen(false)}>
              Home
            </a>
            <a href="/#servicios" onClick={() => setNavOpen(false)}>
              Transfers
            </a>
            <a
              href="/excursions"
              className="is-active"
              onClick={() => setNavOpen(false)}
            >
              Excursions
            </a>
            <a href="/about" onClick={() => setNavOpen(false)}>
              About Us
            </a>
            <a href="/contact" onClick={() => setNavOpen(false)}>
              Contact
            </a>
            {latestReservation && (
              <a href="#pago" onClick={() => setNavOpen(false)}>
                Confirmation
              </a>
            )}
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

      <main id="main-content" className="excursions-page">
        <ExcursionBooking onBooked={setLatestReservation} />
        {latestReservation && (
          <PaymentSection
            reservation={latestReservation}
            onOpenTracker={() => openMenu("tracker")}
          />
        )}
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
