import { useState } from "react";
import { bankPayment, contact } from "./data";
import type { Reservation } from "./reservations";

type PaymentSectionProps = {
  reservation: Reservation;
};

export function PaymentSection({ reservation }: PaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const isExcursion = reservation.kind === "excursion";

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(bankPayment.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="section section--sand" id="pago">
      <div className="container payment">
        <div className="section__head">
          <p className="section__eyebrow">Reserva confirmada</p>
          <h2 className="section__title">Completa tu pago APAP</h2>
          <p className="section__lead">
            Tu {isExcursion ? "excursión" : "traslado"} quedó registrado.
            Transfiere a la cuenta empresarial e incluye tu número de reserva en
            el concepto.
          </p>
        </div>

        <div className="payment__banner" role="status">
          <div>
            <small>Tu número de reserva</small>
            <strong>{reservation.id}</strong>
          </div>
          <div>
            <small>{isExcursion ? "Excursión" : "Ruta"}</small>
            <strong>
              {isExcursion
                ? reservation.destination
                : `${reservation.origin} → ${reservation.destination}`}
            </strong>
          </div>
          <div>
            <small>Monto</small>
            <strong>
              {reservation.price == null
                ? "A confirmar"
                : `~$${reservation.price} USD`}
            </strong>
          </div>
        </div>

        <div className="payment__grid">
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
                <button type="button" className="copy-btn" onClick={copyAccount}>
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

          <div className="payment__help">
            <h3>Después de pagar</h3>
            <ol>
              <li>Envía el comprobante a {contact.email}.</li>
              <li>
                Incluye tu número de reserva ({reservation.id}) en el asunto.
              </li>
              <li>
                {isExcursion
                  ? "Te confirmamos por email la hora exacta de recogida en tu hotel."
                  : "Confirma tu hora de recogida en el menú → Confirmar recogida."}
              </li>
            </ol>
            <a
              className="btn btn--primary"
              href={`mailto:${contact.email}?subject=Comprobante%20${reservation.id}`}
            >
              Enviar comprobante
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
