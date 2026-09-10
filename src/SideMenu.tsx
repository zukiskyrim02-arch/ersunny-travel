import { useState, type FormEvent } from "react";
import { logoSrc } from "./assets";
import { contact } from "./data";
import { useI18n } from "./i18n/I18nProvider";
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
  const { t } = useI18n();
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
      setError(t("side.notFound"));
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
        aria-label={t("side.closeMenu")}
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
          <button type="button" className="drawer__close" onClick={onClose} aria-label={t("side.close")}>
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
            {t("side.pickupStatus")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === "contact"}
            className={panel === "contact" ? "is-active" : ""}
            onClick={() => onPanelChange("contact")}
          >
            {t("side.contact")}
          </button>
        </div>

        <div className="drawer__body">
          {panel === "tracker" ? (
            <div>
              <h2>{t("side.trackerTitle")}</h2>
              <p>{t("side.trackerLead")}</p>
              <form className="tracker-form" onSubmit={handleLookup}>
                <label htmlFor="reservation-code">{t("side.reservationNumber")}</label>
                <input
                  id="reservation-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("side.reservationPh")}
                  required
                />
                <button type="submit" className="btn btn--primary btn--full">
                  {t("side.find")}
                </button>
              </form>

              {error && <p className="tracker-error">{error}</p>}

              {result && (
                <div className="tracker-result">
                  <p className="tracker-result__id">{result.id}</p>
                  <dl>
                    <div>
                      <dt>{t("side.type")}</dt>
                      <dd>
                        {result.kind === "excursion"
                          ? t("side.excursion")
                          : t("side.transfer")}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("side.passenger")}</dt>
                      <dd>{result.name}</dd>
                    </div>
                    <div>
                      <dt>
                        {result.kind === "excursion"
                          ? t("side.excursion")
                          : t("side.route")}
                      </dt>
                      <dd>
                        {result.kind === "excursion"
                          ? result.destination
                          : `${result.origin} → ${result.destination}`}
                      </dd>
                    </div>
                    {result.kind === "excursion" && result.hotelPickup && (
                      <div>
                        <dt>{t("side.pickupHotel")}</dt>
                        <dd>{result.hotelPickup}</dd>
                      </div>
                    )}
                    <div>
                      <dt>{t("side.date")}</dt>
                      <dd>
                        {result.date}
                        {scheduledPickup
                          ? ` · ${scheduledPickup}`
                          : ` · ${t("side.timePending")}`}
                      </dd>
                    </div>
                    {result.wantReturn && result.returnDate && (
                      <div>
                        <dt>{t("side.return")}</dt>
                        <dd>
                          {result.returnDate}
                          {formatTimeLabel(result.returnTime)
                            ? ` · ${formatTimeLabel(result.returnTime)}`
                            : ` · ${t("side.timePending")}`}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>{t("side.guests")}</dt>
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
                      {confirming ? t("side.confirming") : t("side.confirmPickup")}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2>{t("side.contactTitle")}</h2>
              <p>{t("side.contactLead")}</p>
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
                {t("side.messageWa")}
              </a>
              <a className="btn btn--ghost-dark btn--full" href={`mailto:${contact.email}`}>
                {t("side.emailUs")}
              </a>
              <a className="btn btn--ghost-dark btn--full" href="/about/faq" onClick={onClose}>
                {t("side.viewFaqs")}
              </a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
