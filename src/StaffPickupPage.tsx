import { useMemo, useState, type FormEvent } from "react";
import { logoSrc } from "./assets";
import { contact } from "./data";
import { sendPickupTimesToCustomer } from "./notifyBooking";
import {
  decodeStaffPayload,
  findReservation,
  upsertReservation,
  type Reservation,
} from "./reservations";

function loadFromUrl(): Reservation | null {
  const params = new URLSearchParams(window.location.search);
  const id = (params.get("id") || "").trim();
  const encoded = (params.get("r") || "").trim();
  const fromStore = id ? findReservation(id) : undefined;
  if (fromStore) return fromStore;
  if (!encoded) return null;
  const payload = decodeStaffPayload(encoded);
  if (!payload) return null;
  return {
    ...payload,
    kind: payload.kind ?? "transfer",
    time: payload.time || "To be confirmed",
    wantReturn: Boolean(payload.wantReturn),
    status: payload.status ?? "paid",
  };
}

export function StaffPickupPage() {
  const initial = useMemo(() => loadFromUrl(), []);
  const [reservation, setReservation] = useState<Reservation | null>(initial);
  const [date, setDate] = useState(initial?.date ?? "");
  const [pickupTime, setPickupTime] = useState(
    initial?.pickupTime && initial.pickupTime !== "To be confirmed"
      ? initial.pickupTime
      : "",
  );
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? "");
  const [returnTime, setReturnTime] = useState(
    initial?.returnTime && initial.returnTime !== "To be confirmed"
      ? initial.returnTime
      : "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isRoundTrip = Boolean(reservation?.wantReturn);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reservation) return;
    setError("");

    if (!date || !pickupTime) {
      setError("Enter the pickup date and time.");
      return;
    }
    if (isRoundTrip && (!returnDate || !returnTime)) {
      setError("Enter the return date and pickup time.");
      return;
    }

    setSaving(true);
    const updated = upsertReservation({
      ...reservation,
      date,
      pickupTime,
      time: pickupTime,
      returnDate: isRoundTrip ? returnDate : reservation.returnDate,
      returnTime: isRoundTrip ? returnTime : reservation.returnTime,
      wantReturn: isRoundTrip,
      status: reservation.status === "pending" ? "paid" : reservation.status,
      customerConfirmed: false,
    });
    setReservation(updated);
    setSaved(true);

    try {
      await sendPickupTimesToCustomer(updated);
    } catch {
      setError(
        "Times were saved in the system, but the customer email could not be sent. Message them on WhatsApp.",
      );
    }
    setSaving(false);
  }

  if (!reservation) {
    return (
      <main className="staff-pickup">
        <div className="staff-pickup__card">
          <img src={logoSrc()} alt="Ersunny Travel" width={120} height={120} />
          <h1>Set pickup times</h1>
          <p>
            Open this page from the button/link in the paid-booking email so the
            reservation details load automatically.
          </p>
          <a className="btn btn--primary" href="/admin">
            Go to admin
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="staff-pickup">
      <div className="staff-pickup__card">
        <img src={logoSrc()} alt="Ersunny Travel" width={120} height={120} />
        <h1>Set pickup times</h1>
        <p className="staff-pickup__id">{reservation.id}</p>
        <dl className="staff-pickup__meta">
          <div>
            <dt>Passenger</dt>
            <dd>{reservation.name}</dd>
          </div>
          <div>
            <dt>Route</dt>
            <dd>
              {reservation.origin} → {reservation.destination}
            </dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{reservation.contactInfo}</dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>{reservation.passengers}</dd>
          </div>
        </dl>

        <form className="staff-pickup__form" onSubmit={onSubmit}>
          <label>
            <span>{isRoundTrip ? "Outbound date" : "Pickup date"}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSaved(false);
              }}
              required
            />
          </label>
          <label>
            <span>{isRoundTrip ? "Outbound pickup time" : "Pickup time"}</span>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => {
                setPickupTime(e.target.value);
                setSaved(false);
              }}
              required
            />
          </label>
          {isRoundTrip && (
            <>
              <label>
                <span>Return date</span>
                <input
                  type="date"
                  value={returnDate}
                  min={date || undefined}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    setSaved(false);
                  }}
                  required
                />
              </label>
              <label>
                <span>Return pickup time</span>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => {
                    setReturnTime(e.target.value);
                    setSaved(false);
                  }}
                  required
                />
              </label>
            </>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="tracker-ok" role="status">
              Pickup times saved. The customer was emailed a confirmation link.
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
            {saving ? "Saving…" : "Save pickup times & notify customer"}
          </button>
        </form>

        <p className="staff-pickup__hint">
          Questions? {contact.email} · {contact.whatsapp}
        </p>
        <a href="/admin">Open full admin →</a>
      </div>
    </main>
  );
}
