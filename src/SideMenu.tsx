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
        "No encontramos esa reserva. Revisa el número o escríbenos a contact@ersunnytravel.com.",
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
        aria-label="Cerrar menú"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className={`drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Menú Ersunny"
      >
        <div className="drawer__head">
          <img src={asset("ersunny-logo.png")} alt="Ersunny Travel" width={160} height={90} />
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Cerrar">
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
            Confirmar recogida
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === "contact"}
            className={panel === "contact" ? "is-active" : ""}
            onClick={() => onPanelChange("contact")}
          >
            Contacto
          </button>
        </div>

        <div className="drawer__body">
          {panel === "tracker" ? (
            <div>
              <h2>Rastreador de recogida</h2>
              <p>
                Ingresa tu número de reserva para ver y confirmar la hora de
                pick-up.
              </p>
              <form className="tracker-form" onSubmit={handleLookup}>
                <label htmlFor="reservation-code">Número de reserva</label>
                <input
                  id="reservation-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej. EST-A1B2C3"
                  required
                />
                <button type="submit" className="btn btn--primary btn--full">
                  Buscar reserva
                </button>
              </form>

              {error && <p className="tracker-error">{error}</p>}

              {result && (
                <div className="tracker-result">
                  <p className="tracker-result__id">{result.id}</p>
                  <dl>
                    <div>
                      <dt>Tipo</dt>
                      <dd>
                        {result.kind === "excursion" ? "Excursión" : "Traslado"}
                      </dd>
                    </div>
                    <div>
                      <dt>Pasajero</dt>
                      <dd>{result.name}</dd>
                    </div>
                    <div>
                      <dt>
                        {result.kind === "excursion" ? "Excursión" : "Ruta"}
                      </dt>
                      <dd>
                        {result.kind === "excursion"
                          ? result.destination
                          : `${result.origin} → ${result.destination}`}
                      </dd>
                    </div>
                    {result.kind === "excursion" && result.hotelPickup && (
                      <div>
                        <dt>Hotel pickup</dt>
                        <dd>{result.hotelPickup}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Fecha</dt>
                      <dd>
                        {result.date}
                        {result.kind === "transfer" ? " · hora por confirmar" : ""}
                      </dd>
                    </div>
                    {result.wantReturn && result.returnDate && (
                      <div>
                        <dt>Regreso</dt>
                        <dd>
                          {result.returnDate} · {result.returnTime}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Personas</dt>
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
                        ? "Confirmar asistencia"
                        : "Confirmar hora de recogida"}
                    </button>
                  ) : (
                    <p className="tracker-ok" role="status">
                      {result.kind === "excursion"
                        ? `Excursión confirmada para el ${result.date}. Te avisamos la hora de pickup.`
                        : `Recogida confirmada para el ${result.date}. Te enviaremos la hora exacta por email.`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2>Vías de contacto</h2>
              <p>Estamos listos para ayudarte con reservas, cambios y recogidas.</p>
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
                Escribir por WhatsApp
              </a>
              <a className="btn btn--ghost-dark btn--full" href={`mailto:${contact.email}`}>
                Escribir por email
              </a>
              <a className="btn btn--ghost-dark btn--full" href="#faq" onClick={onClose}>
                Ver preguntas frecuentes
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
