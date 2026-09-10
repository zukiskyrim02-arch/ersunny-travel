import { useState } from "react";
import { bankPayment, contact } from "./data";
import { useAppConfig } from "./store/hooks";
import { redirectToAzul } from "./payments/azul";
import type { Reservation } from "./reservations";

type PaymentSectionProps = {
  reservation: Reservation;
  onOpenTracker?: () => void;
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PaymentSection({
  reservation,
  onOpenTracker,
}: PaymentSectionProps) {
  const { azul } = useAppConfig();
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [showApap, setShowApap] = useState(false);
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

  async function payWithAzul() {
    setPayError("");
    setPaying(true);
    try {
      const err = await redirectToAzul(azul, reservation);
      if (err) setPayError(err);
    } catch {
      setPayError("Pago Azul could not be started. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  const dateLabel =
    reservation.wantReturn && reservation.returnDate
      ? `${formatDate(reservation.date)} – ${formatDate(reservation.returnDate)}`
      : formatDate(reservation.date);

  const serviceSubtitle = isExcursion
    ? reservation.destination
    : reservation.wantReturn
      ? "Private · round trip"
      : "Private · one way";

  const canPayAzul =
    azul.enabled &&
    reservation.price != null &&
    reservation.price > 0 &&
    Boolean(azul.merchantId.trim() && azul.authKey.trim());

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
          <h1>Payment form</h1>
          <div className="confirm__ref">
            <span>Reservation number</span>
            <strong>{reservation.id}</strong>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyText(reservation.id, "id")}
            >
              {copiedId ? "Copied" : "Copy"}
            </button>
          </div>
          <p>
            Complete payment for your {isExcursion ? "excursion" : "transfer"}.
            Pay securely with <strong>Pago Azul</strong> or contact us:
          </p>
        </div>

        <div className="confirm__contacts">
          <a
            className="confirm__contact"
            href={`mailto:${contact.email}?subject=Reservation%20${reservation.id}`}
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

          <a
            className="confirm__contact"
            href={`https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(`Hi, my reservation is ${reservation.id}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="confirm__contact-icon confirm__contact-icon--wa" aria-hidden>
              WA
            </span>
            <strong>WhatsApp</strong>
            <small>{contact.whatsapp}</small>
          </a>

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
            <strong>Pickup</strong>
            <small>Confirm time</small>
          </button>

          <button type="button" className="confirm__contact" onClick={() => void payWithAzul()}>
            <span className="confirm__contact-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="6"
                  width="18"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <strong>Pago Azul</strong>
            <small>Card</small>
          </button>
        </div>

        <article className="confirm__card">
          <div className="confirm__card-head">
            <div className="confirm__service-thumb" aria-hidden>
              {isExcursion ? "☀" : "🚐"}
            </div>
            <div>
              <p className="confirm__service-label">
                {isExcursion ? "EXCURSION" : "TRANSFER"}
              </p>
              <h3>{serviceSubtitle}</h3>
              <p className="confirm__service-id">{reservation.id}</p>
            </div>
          </div>

          <div className="confirm__meta">
            <div>
              <span>Date</span>
              <strong>{dateLabel}</strong>
            </div>
            <div>
              <span>Pickup time</span>
              <strong>{reservation.pickupTime || "To be confirmed"}</strong>
            </div>
          </div>

          <div className="confirm__route">
            <p className="confirm__route-title">
              {isExcursion
                ? "Details"
                : reservation.wantReturn
                  ? "Route (round trip)"
                  : "Route"}
            </p>
            <ol className="confirm__timeline">
              <li>
                <span className="confirm__dot confirm__dot--start" />
                <div>
                  <small>{isExcursion ? "Hotel / pickup" : "Origin / pickup"}</small>
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
                  <small>{isExcursion ? "Excursion" : "Destination"}</small>
                  <strong>{reservation.destination}</strong>
                </div>
              </li>
            </ol>
          </div>

          <div className="confirm__meta confirm__meta--footer">
            <div>
              <span>Passengers</span>
              <strong>{reservation.passengers}</strong>
            </div>
            <div>
              <span>Service type</span>
              <strong>
                {isExcursion
                  ? "Excursion"
                  : reservation.wantReturn
                    ? "Private transfer (round trip)"
                    : "Private transfer (one way)"}
              </strong>
            </div>
            {!isExcursion && (
              <div>
                <span>Vehicle</span>
                <strong>{reservation.vehicle}</strong>
              </div>
            )}
            <div>
              <span>Amount</span>
              <strong>
                {reservation.price == null
                  ? "To be confirmed"
                  : `$${reservation.price} USD`}
              </strong>
            </div>
          </div>
        </article>

        <form
          className="confirm__pay payment-form"
          id="datos-pago"
          onSubmit={(e) => {
            e.preventDefault();
            void payWithAzul();
          }}
        >
          <h2>Pay with Azul</h2>
          <p>
            You'll be redirected to the secure <strong>Pago Azul</strong> page
            to pay by card (Visa, Mastercard, and more). Environment:{" "}
            {azul.env === "production" ? "production" : "test"}.
          </p>

          {payError && (
            <p className="form-error" role="alert">
              {payError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={paying || !canPayAzul}
          >
            {paying
              ? "Connecting to Azul…"
              : reservation.price == null
                ? "Price pending — payment is not available yet"
                : `Pay $${reservation.price} USD with Azul`}
          </button>

          {!azul.merchantId || !azul.authKey ? (
            <p className="confirm__pay-hint">
              Configure the Merchant ID and AuthKey in Admin → Pago Azul to
              enable live payments.
            </p>
          ) : null}

          <button
            type="button"
            className="confirm__apap-toggle"
            onClick={() => setShowApap((v) => !v)}
          >
            {showApap ? "Hide bank transfer" : "Also pay by APAP bank transfer"}
          </button>

          {showApap && (
            <>
              <p>
                Alternative: transfer to our business account. Include{" "}
                <strong>{reservation.id}</strong> in the payment reference.
              </p>
              <dl className="payment__details">
                <div>
                  <dt>Bank</dt>
                  <dd>{bankPayment.bank}</dd>
                </div>
                <div>
                  <dt>Account type</dt>
                  <dd>{bankPayment.accountType}</dd>
                </div>
                <div>
                  <dt>Account number</dt>
                  <dd>
                    <span>{bankPayment.accountNumber}</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(bankPayment.accountNumber, "account")}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Account holder</dt>
                  <dd>{bankPayment.holder}</dd>
                </div>
                <div>
                  <dt>RNC</dt>
                  <dd>{bankPayment.rnc}</dd>
                </div>
              </dl>
              <a
                className="btn btn--primary"
                href={`mailto:${contact.email}?subject=Payment%20receipt%20${reservation.id}`}
              >
                Send payment receipt
              </a>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
