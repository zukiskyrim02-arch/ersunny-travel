import { useEffect, useState } from "react";
import { BookingForm } from "./BookingForm";
import { ExcursionBooking } from "./ExcursionBooking";
import { PaymentSection } from "./PaymentSection";
import { SideMenu } from "./SideMenu";
import { asset } from "./assets";
import {
  about,
  bankPayment,
  contact,
  destinations,
  faqs,
  fleet,
  steps,
} from "./data";
import type { Reservation } from "./reservations";

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tracker" | "contact">("tracker");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [latestReservation, setLatestReservation] = useState<Reservation | null>(
    null,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!latestReservation) return;
    const id = window.setTimeout(() => {
      document.getElementById("pago")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(id);
  }, [latestReservation]);

  function openMenu(panel: "tracker" | "contact" = "tracker") {
    setMenuPanel(panel);
    setMenuOpen(true);
  }

  function handleBooked(reservation: Reservation) {
    setLatestReservation(reservation);
  }

  return (
    <>
      <div className="contact-bar" aria-label="Contacto rápido">
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
        <span aria-hidden>·</span>
        <button type="button" onClick={() => openMenu("contact")}>
          WhatsApp: {contact.whatsappLabel}
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={() => openMenu("tracker")}>
          Confirmar recogida
        </button>
      </div>

      <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="nav__inner">
          <a className="nav__brand" href="#top">
            <img
              src={asset("ersunny-logo.png")}
              alt="Ersunny Travel"
              width={220}
              height={120}
            />
          </a>

          <div className="nav__actions">
            <nav className="nav__links nav__links--desktop" aria-label="Principal">
              <a href="#reservar">Traslados</a>
              <a href="#excursiones">Excursiones</a>
              <a href="#nosotros">Nosotros</a>
              <a href="#faq">FAQ</a>
              {latestReservation && <a href="#pago">Confirmación</a>}
              <a className="nav__cta" href="#reservar">
                Agendar
              </a>
            </nav>

            <button
              className="nav__menu-btn"
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => openMenu("tracker")}
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

      <main id="top">
        <section className="hero" aria-label="Inicio">
          <div className="hero__media" aria-hidden>
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"
              alt=""
              width={2000}
              height={1333}
            />
          </div>
          <div className="hero__content">
            <img
              className="hero__logo"
              src={asset("ersunny-logo.png")}
              alt="Ersunny Travel"
              width={640}
              height={360}
            />
            <h1 className="hero__headline">
              Del aeropuerto a tu hotel, sin esperas.
            </h1>
            <p className="hero__sub">
              Agenda tu traslado, paga por transferencia APAP y confirma tu
              recogida con tu número de reserva.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#reservar">
                Reservar traslado
              </a>
              <a className="btn btn--ghost" href="#excursiones">
                Ver excursiones
              </a>
            </div>
          </div>
        </section>

        <section className="section section--ocean" id="reservar">
          <div className="container booking">
            <aside className="booking__aside">
              <p className="section__eyebrow">Reserva en línea</p>
              <h2>Agenda tu traslado y paga de inmediato.</h2>
              <p>
                Completa el formulario. Al confirmar, te mostramos los datos de
                pago APAP con tu número de reserva. Precios oficiales de
                transporte y excursiones: pendientes.
              </p>
              <ul className="booking__perks">
                <li className="booking__perk">
                  <span className="booking__perk-icon" aria-hidden>✓</span>
                  <div>
                    <strong>Autoservicio</strong>
                    <span>Reservas tú mismo, sin esperar cotización.</span>
                  </div>
                </li>
                <li className="booking__perk">
                  <span className="booking__perk-icon" aria-hidden>✓</span>
                  <div>
                    <strong>Pago directo</strong>
                    <span>Transferencia a cuenta empresarial APAP.</span>
                  </div>
                </li>
                <li className="booking__perk">
                  <span className="booking__perk-icon" aria-hidden>✓</span>
                  <div>
                    <strong>Pick-up tracker</strong>
                    <span>Confirma la hora con tu número de reserva.</span>
                  </div>
                </li>
              </ul>
            </aside>
            <BookingForm onBooked={handleBooked} />
          </div>
        </section>

        <ExcursionBooking onBooked={handleBooked} />

        {latestReservation && (
          <PaymentSection
            reservation={latestReservation}
            onOpenContact={() => openMenu("contact")}
            onOpenTracker={() => openMenu("tracker")}
          />
        )}

        <section className="section section--sand" id="destinos">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Zonas</p>
              <h2 className="section__title">Punta Cana, Bávaro y Macao</h2>
              <p className="section__lead">
                Cobertura puerta a puerta en los resorts más solicitados de la
                costa este.
              </p>
            </div>
            <div className="destinations">
              {destinations.map((d) => (
                <article className="destination" key={d.zone}>
                  <img
                    src={d.image}
                    alt=""
                    loading="lazy"
                    width={800}
                    height={1000}
                  />
                  <div className="destination__body">
                    <h3>{d.zone}</h3>
                    <p>{d.blurb}</p>
                    <p className="destination__meta">Desde PUJ · {d.time}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="flota">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Flota</p>
              <h2 className="section__title">Viaja como quieras</h2>
              <p className="section__lead">
                Vehículos climatizados, conductores locales y espacio real para
                maletas.
              </p>
            </div>
            <div className="fleet">
              {fleet.map((item) => (
                <article className="fleet-item" key={item.title}>
                  <p className="fleet-item__label">{item.label}</p>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--ocean" id="como">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Proceso</p>
              <h2 className="section__title">Tres pasos. Cero estrés.</h2>
              <p className="section__lead">
                Diseñado para que tu vacación empiece al bajar del avión.
              </p>
            </div>
            <div className="steps">
              {steps.map((step) => (
                <article className="step" key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="nosotros">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Ersunny Travel</p>
              <h2 className="section__title">Misión, visión y valores</h2>
              <p className="section__lead">
                Transporte turístico seguro y excursiones que celebran la
                cultura y belleza de cada destino.
              </p>
            </div>

            <div className="about-grid">
              <article className="about-block">
                <h3>Misión</h3>
                <p>{about.mission}</p>
              </article>
              <article className="about-block">
                <h3>Visión</h3>
                <p>{about.vision}</p>
              </article>
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

        <section className="section section--sand" id="faq">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">FAQ</p>
              <h2 className="section__title">Preguntas frecuentes</h2>
              <p className="section__lead">
                Respuestas claras sobre reservas, vuelos, pagos y recogida en
                el aeropuerto.
              </p>
            </div>
            <div className="faq-list">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item.q}>
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

        <section className="cta-band">
          <div className="container">
            <h2>¿Listo para aterrizar en paz?</h2>
            <p>Reserva ahora y paga con transferencia APAP en la misma página.</p>
            <div className="hero__actions" style={{ justifyContent: "center" }}>
              <a className="btn btn--primary" href="#reservar">
                Ir a reservar
              </a>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => openMenu("contact")}
              >
                Contacto
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" id="contacto">
        <div className="container">
          <div className="footer__top">
            <div>
              <a className="footer__brand" href="#top">
                <img
                  src={asset("ersunny-logo.png")}
                  alt="Ersunny Travel"
                  width={220}
                  height={120}
                />
              </a>
              <p className="footer__note">
                Transfer privado del Aeropuerto Internacional de Punta Cana
                (PUJ) a tu resort.
              </p>
            </div>
            <div className="footer__cols">
              <div>
                <h4>Explorar</h4>
                <a href="#reservar">Traslados</a>
                <a href="#excursiones">Excursiones</a>
                {latestReservation && <a href="#pago">Confirmación</a>}
                <a href="#nosotros">Nosotros</a>
                <a href="#faq">FAQ</a>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => openMenu("tracker")}
                >
                  Confirmar recogida
                </button>
              </div>
              <div>
                <h4>Contacto</h4>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                <p>WhatsApp: {contact.whatsappLabel}</p>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => openMenu("contact")}
                >
                  Abrir menú de contacto
                </button>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <p>© {new Date().getFullYear()} Ersunny Travel · Punta Cana</p>
            <p>RNC {bankPayment.rnc}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
