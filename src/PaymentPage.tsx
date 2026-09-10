import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PaymentSection } from "./PaymentSection";
import { SideMenu } from "./SideMenu";
import { logoSrc } from "./assets";
import { contact } from "./data";
import { findReservation } from "./reservations";
import { navigate } from "./routing";

const waBookHref = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(
  "Hi Ersunny Travel! I'd like to book a transfer or excursion.",
)}`;

function reservationIdFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return (params.get("id") || params.get("order") || "").trim();
}

export function PaymentPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [navOpen, setNavOpen] = useState(false);
  const [lookupId, setLookupId] = useState(() => reservationIdFromUrl());
  const [queryId, setQueryId] = useState(() => reservationIdFromUrl());
  const [error, setError] = useState(() => {
    const id = reservationIdFromUrl();
    if (!id) return "";
    return findReservation(id) ? "" : "Reservation not found. Check the code and try again.";
  });

  const reservation = useMemo(
    () => (queryId ? findReservation(queryId) : undefined),
    [queryId],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [queryId]);

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

  function onLookup(e: FormEvent) {
    e.preventDefault();
    setError("");
    const id = lookupId.trim();
    if (!id) {
      setError("Enter your reservation number.");
      return;
    }
    const found = findReservation(id);
    if (!found) {
      setError("Reservation not found. Check the code and try again.");
      return;
    }
    setQueryId(found.id);
    navigate(`/payment?id=${encodeURIComponent(found.id)}`);
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
            <a href="/about" onClick={() => setNavOpen(false)}>
              About Us
            </a>
            <a href="/contact" onClick={() => setNavOpen(false)}>
              Contact
            </a>
            <a
              href="/payment"
              className="is-active"
              onClick={() => setNavOpen(false)}
            >
              Payment
            </a>
            <button
              type="button"
              className="site-nav__tracker"
              onClick={() => openMenu("tracker")}
            >
              Pickup status
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

      <main id="main-content" className="payment-page">
        {reservation ? (
          <PaymentSection
            reservation={reservation}
            onOpenTracker={() => openMenu("tracker")}
          />
        ) : (
          <section className="section section--confirm" id="pago">
            <div className="container confirm">
              <div className="confirm__hero">
                <h2>Payment form</h2>
                <p>
                  Enter your reservation number to open the secure payment form.
                </p>
              </div>
              <form className="payment-lookup quote-form" onSubmit={onLookup}>
                <label className="field quote-form__full">
                  <span>Reservation number</span>
                  <input
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    placeholder="e.g. EST-ABCD1234"
                    autoComplete="off"
                    required
                  />
                </label>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn-blue quote-form__submit" type="submit">
                  Continue to payment
                </button>
                <p className="payment-lookup__hint">
                  No reservation yet?{" "}
                  <a href="/#cotizar">Book transportation</a> or{" "}
                  <a href="/excursions">book an excursion</a>.
                </p>
              </form>
            </div>
          </section>
        )}
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
            <p className="site-footer__heading">Pay</p>
            <a href="/payment">Payment form</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a
              href={`https://wa.me/${contact.whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp {contact.whatsapp}
            </a>
          </div>
        </div>
        <div className="container site-footer__bottom">
          <p>
            © {new Date().getFullYear()} Ersunny Travel · Design By Ismakun
          </p>
        </div>
      </footer>
    </>
  );
}
