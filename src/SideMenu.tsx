import { useEffect, useState, type FormEvent } from "react";
import { asset } from "./assets";
import { contact } from "./data";
import { findReservation, type Reservation } from "./reservations";

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
  panel: "tracker" | "contact";
  onPanelChange: (panel: "tracker" | "contact") => void;
};

export function SideMenu({ open, onClose, panel, onPanelChange }: SideMenuProps) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  function handleLookup(e: FormEvent) {
    e.preventDefault();
    setConfirmed(false);
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
          <img src={asset("ersunny-logo.png")} alt="Ersunny Travel" width={160} height={160} />
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
            Confirm pickup
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
                Enter your reservation number to view and confirm your pickup
                time.
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
                        {result.pickupTime
                          ? ` · ${result.pickupTime}`
                          : result.kind === "transfer"
                            ? " · time to be confirmed"
                            : ""}
                      </dd>
                    </div>
                    {result.wantReturn && result.returnDate && (
                      <div>
                        <dt>Return</dt>
                        <dd>
                          {result.returnDate} · {result.returnTime}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Guests</dt>
                      <dd>{result.passengers}</dd>
                    </div>
                  </dl>

                  {!confirmed ? (
                    <button
                      type="button"
                      className="btn btn--primary btn--full"
                      onClick={() => setConfirmed(true)}
                    >
                      {result.kind === "excursion"
                        ? "Confirm attendance"
                        : "Confirm pickup time"}
                    </button>
                  ) : (
                    <p className="tracker-ok" role="status">
                      {result.kind === "excursion"
                        ? `Excursion confirmed for ${result.date}. We'll let you know the pickup time.`
                        : result.pickupTime
                          ? `Pickup confirmed: ${result.date} at ${result.pickupTime}.`
                          : `Pickup confirmed for ${result.date}. We'll email you the exact time.`}
                    </p>
                  )}
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
