import { useState, type FormEvent } from "react";
import { logoSrc } from "./assets";
import { contact } from "./data";
import { sendCustomerConfirmedPickup } from "./notifyBooking";
import {
  findReservation,
  upsertReservation,
  type Reservation,
} from "./reservations";

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
  panel: "tracker" | "contact";
  onPanelChange: (panel: "tracker" | "contact") => void;
};

function formatTimeLabel(value?: string) {
  if (!value || value === "To be confirmed") return null;
  return value;
}

export function SideMenu({ open, onClose, panel, onPanelChange }: SideMenuProps) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  function handleLookup(e: FormEvent) {
    e.preventDefault();
    setStatusMsg("");
    const found = findReservation(code);
    if (!found) {
      setResult(null);
      setError(
        "We couldn't find that reservation. Check the number or email us at contact@ersunnytravel.com.",
      );
      return;
    }
    setError("");
    setResult(found);
  }

  async function confirmPickup() {
    if (!result) return;
    const pickup = formatTimeLabel(result.pickupTime) || formatTimeLabel(result.time);
    if (!pickup) return;
    setConfirming(true);
    const updated = upsertReservation({
      ...result,
      customerConfirmed: true,
      status: "confirmed",
    });
    setResult(updated);
    setStatusMsg(`Pickup confirmed: ${updated.date} at ${pickup}.`);
    try {
      await sendCustomerConfirmedPickup(updated);
    } catch {
      /* best-effort */
    }
    setConfirming(false);
  }

  const scheduledPickup =
    result &&
    (formatTimeLabel(result.pickupTime) || formatTimeLabel(result.time));

  return (
    <>
      <button
        type="button"
        className={`drawer-backdrop${open ? " is-open" : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className={`drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Ersunny menu"
      >
        <div className="drawer__head">
          <img src={logoSrc()} alt="Ersunny Travel" width={160} height={160} />
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="drawer__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={panel === "tracker"}
            className={panel === "tracker" ? "is-active" : ""}
            onClick={() => onPanelChange("tracker")}
          >
            Pickup status
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === "contact"}
            className={panel === "contact" ? "is-active" : ""}
            onClick={() => onPanelChange("contact")}
          >
            Contact
          </button>
        </div>

        <div className="drawer__body">
          {panel === "tracker" ? (
            <div>
              <h2>Pickup tracker</h2>
              <p>
                Enter your reservation number to view your booking and confirm
                the pickup time once Ersunny Travel has set it.
              </p>
              <form className="tracker-form" onSubmit={handleLookup}>
                <label htmlFor="reservation-code">Reservation number</label>
                <input
                  id="reservation-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. EST-A1B2C3"
                  required
                />
                <button type="submit" className="btn btn--primary btn--full">
                  Find reservation
                </button>
              </form>

              {error && <p className="tracker-error">{error}</p>}

              {result && (
                <div className="tracker-result">
                  <p className="tracker-result__id">{result.id}</p>
                  <dl>
                    <div>
                      <dt>Type</dt>
                      <dd>
                        {result.kind === "excursion" ? "Excursion" : "Transfer"}
                      </dd>
                    </div>
                    <div>
                      <dt>Passenger</dt>
                      <dd>{result.name}</dd>
                    </div>
                    <div>
                      <dt>
                        {result.kind === "excursion" ? "Excursion" : "Route"}
                      </dt>
                      <dd>
                        {result.kind === "excursion"
                          ? result.destination
                          : `${result.origin} → ${result.destination}`}
                      </dd>
                    </div>
                    {result.kind === "excursion" && result.hotelPickup && (
                      <div>
                        <dt>Pickup hotel</dt>
                        <dd>{result.hotelPickup}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Date</dt>
                      <dd>
                        {result.date}
                        {scheduledPickup
                          ? ` · ${scheduledPickup}`
                          : " · time to be confirmed"}
                      </dd>
                    </div>
                    {result.wantReturn && result.returnDate && (
                      <div>
                        <dt>Return</dt>
                        <dd>
                          {result.returnDate}
                          {formatTimeLabel(result.returnTime)
                            ? ` · ${formatTimeLabel(result.returnTime)}`
                            : " · time to be confirmed"}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Guests</dt>
                      <dd>{result.passengers}</dd>
                    </div>
                  </dl>

                  {result.customerConfirmed || statusMsg ? (
                    <p className="tracker-ok" role="status">
                      {statusMsg ||
                        `Pickup confirmed: ${result.date} at ${scheduledPickup}.`}
                    </p>
                  ) : scheduledPickup ? (
                    <button
                      type="button"
                      className="btn btn--primary btn--full"
                      disabled={confirming}
                      onClick={() => void confirmPickup()}
                    >
                      {confirming ? "Confirming…" : "Confirm pickup time"}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2>Contact options</h2>
              <p>We're ready to help with bookings, changes, and pickups.</p>
              <ul className="contact-list">
                <li>
                  <span>Email</span>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
                <li>
                  <span>WhatsApp</span>
                  <a
                    href={`https://wa.me/${contact.whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {contact.whatsapp}
                  </a>
                </li>
              </ul>
              <a
                className="btn btn--primary btn--full"
                href={`https://wa.me/${contact.whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
              >
                Message us on WhatsApp
              </a>
              <a className="btn btn--ghost-dark btn--full" href={`mailto:${contact.email}`}>
                Email us
              </a>
              <a className="btn btn--ghost-dark btn--full" href="/about/faq" onClick={onClose}>
                View FAQs
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
