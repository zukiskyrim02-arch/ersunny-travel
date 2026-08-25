import { useState } from "react";
import { bankPayment, contact } from "./data";
import type { Reservation } from "./reservations";

type PaymentSectionProps = {
  reservation: Reservation;
  onOpenContact?: () => void;
  onOpenTracker?: () => void;
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PaymentSection({
  reservation,
  onOpenContact,
  onOpenTracker,
}: PaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const isExcursion = reservation.kind === "excursion";

  async function copyText(value: string, kind: "account" | "id") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "account") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedId(true);
        window.setTimeout(() => setCopiedId(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }

  const dateLabel = reservation.wantReturn && reservation.returnDate
    ? `${formatDate(reservation.date)} – ${formatDate(reservation.returnDate)}`
    : formatDate(reservation.date);

  const serviceTitle = isExcursion ? "Excursión" : "Traslado";
  const serviceSubtitle = isExcursion
    ? reservation.destination
    : reservation.wantReturn
      ? "Privado · ida y vuelta"
      : "Privado · solo ida";

  return (
    <section className="section section--confirm" id="pago">
      <div className="container confirm">
        <div className="confirm__hero">
          <div className="confirm__badge" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="5"
                width="16"
                height="15"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 3.5v3M16 3.5v3M4 9.5h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M8.5 14.5 10.8 16.8 15.5 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2>¡Reserva solicitada!</h2>
          <div className="confirm__ref">
            <span>Número de reserva</span>
            <strong>{reservation.id}</strong>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyText(reservation.id, "id")}
            >
              {copiedId ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p>
            Hemos recibido tu solicitud de{" "}
            {isExcursion ? "excursión" : "traslado"}. Para finalizar y confirmar
            tu reserva, completa el pago o contáctanos:
          </p>
        </div>

        <div className="confirm__contacts">
          <a
            className="confirm__contact"
            href={`mailto:${contact.email}?subject=Reserva%20${reservation.id}`}
          >
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <strong>Email</strong>
            <small>{contact.email}</small>
          </a>

          {contact.whatsapp ? (
            <a
              className="confirm__contact"
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, mi reserva es ${reservation.id}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="confirm__contact-icon confirm__contact-icon--wa" aria-hidden>
                WA
              </span>
              <strong>WhatsApp</strong>
              <small>{contact.whatsapp}</small>
            </a>
          ) : (
            <button type="button" className="confirm__contact" onClick={onOpenContact}>
              <span className="confirm__contact-icon confirm__contact-icon--wa" aria-hidden>
                WA
              </span>
              <strong>WhatsApp</strong>
              <small>{contact.whatsappLabel}</small>
            </button>
          )}

          <button type="button" className="confirm__contact" onClick={onOpenTracker}>
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 8v4l3 2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <strong>Recogida</strong>
            <small>Confirmar hora</small>
          </button>

          <a
            className="confirm__contact"
            href={`mailto:${contact.email}?subject=Comprobante%20${reservation.id}`}
          >
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5 10 17.5 19 7.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <strong>Comprobante</strong>
            <small>Enviar pago</small>
          </a>
        </div>

        <article className="confirm__card">
          <div className="confirm__card-head">
            <div className="confirm__service-thumb" aria-hidden>
              {isExcursion ? "☀" : "🚐"}
            </div>
            <div>
              <p className="confirm__service-label">
                {isExcursion ? "EXCURSIÓN" : "TRASLADO"}
              </p>
              <h3>{serviceSubtitle}</h3>
              <p className="confirm__service-id">{reservation.id}</p>
            </div>
          </div>

          <div className="confirm__meta">
            <div>
              <span>Fecha</span>
              <strong>{dateLabel}</strong>
            </div>
            <div>
              <span>Hora de recogida</span>
              <strong>Por confirmar</strong>
            </div>
          </div>

          <div className="confirm__route">
            <p className="confirm__route-title">
              {isExcursion
                ? "Detalle"
                : reservation.wantReturn
                  ? "Ruta (ida y vuelta)"
                  : "Ruta"}
            </p>
            <ol className="confirm__timeline">
              <li>
                <span className="confirm__dot confirm__dot--start" />
                <div>
                  <small>{isExcursion ? "Hotel / recogida" : "Origen / recogida"}</small>
                  <strong>
                    {isExcursion
                      ? reservation.hotelPickup || reservation.origin
                      : reservation.origin}
                  </strong>
                </div>
              </li>
              <li>
                <span className="confirm__dot confirm__dot--end" />
                <div>
                  <small>{isExcursion ? "Excursión" : "Destino"}</small>
                  <strong>{reservation.destination}</strong>
                </div>
              </li>
            </ol>
          </div>

          <div className="confirm__meta confirm__meta--footer">
            <div>
              <span>Pasajeros</span>
              <strong>{reservation.passengers}</strong>
            </div>
            <div>
              <span>Tipo de servicio</span>
              <strong>
                {isExcursion
                  ? serviceTitle
                  : reservation.wantReturn
                    ? "Traslado redondo (ida y vuelta)"
                    : "Traslado privado (solo ida)"}
              </strong>
            </div>
            {!isExcursion && (
              <div>
                <span>Vehículo</span>
                <strong>{reservation.vehicle}</strong>
              </div>
            )}
            <div>
              <span>Monto</span>
              <strong>
                {reservation.price == null
                  ? "A confirmar"
                  : `~$${reservation.price} USD`}
              </strong>
            </div>
          </div>
        </article>

        <div className="confirm__pay" id="datos-pago">
          <h3>Completa tu pago APAP</h3>
          <p>
            Transfiere a la cuenta empresarial e incluye{" "}
            <strong>{reservation.id}</strong> en el concepto. Luego envía el
            comprobante por email.
          </p>
          <dl className="payment__details">
            <div>
              <dt>Banco</dt>
              <dd>{bankPayment.bank}</dd>
            </div>
            <div>
              <dt>Tipo de cuenta</dt>
              <dd>{bankPayment.accountType}</dd>
            </div>
            <div>
              <dt>No. de cuenta</dt>
              <dd>
                <span>{bankPayment.accountNumber}</span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyText(bankPayment.accountNumber, "account")}
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </dd>
            </div>
            <div>
              <dt>Titular</dt>
              <dd>{bankPayment.holder}</dd>
            </div>
            <div>
              <dt>RNC</dt>
              <dd>{bankPayment.rnc}</dd>
            </div>
          </dl>
          <a
            className="btn btn--primary"
            href={`mailto:${contact.email}?subject=Comprobante%20${reservation.id}`}
          >
            Enviar comprobante
          </a>
        </div>
      </div>
    </section>
  );
}
