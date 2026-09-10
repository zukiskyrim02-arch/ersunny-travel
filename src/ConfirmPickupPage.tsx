import { useMemo, useState } from "react";
import { logoSrc } from "./assets";
import { contact } from "./data";
import { sendCustomerConfirmedPickup } from "./notifyBooking";
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
  const payload = encoded ? decodeStaffPayload(encoded) : null;
  const fromStore = id ? findReservation(id) : undefined;

  if (payload) {
    const merged: Reservation = {
      ...(fromStore ?? {
        id: payload.id,
        kind: payload.kind ?? "transfer",
        name: payload.name,
        contactInfo: payload.contactInfo,
        email: payload.email,
        origin: payload.origin,
        destination: payload.destination,
        date: payload.date,
        time: payload.time || "To be confirmed",
        returnDate: payload.returnDate,
        returnTime: payload.returnTime,
        passengers: payload.passengers,
        vehicle: payload.vehicle,
        wantReturn: Boolean(payload.wantReturn),
        price: payload.price,
        flight: payload.flight,
        notes: payload.notes,
        hotelPickup: payload.hotelPickup,
        createdAt: payload.createdAt || new Date().toISOString(),
        status: payload.status ?? "paid",
      }),
      ...payload,
      pickupTime: payload.pickupTime,
      time: payload.pickupTime || payload.time || "To be confirmed",
      wantReturn: Boolean(payload.wantReturn),
    };
    return upsertReservation(merged);
  }

  return fromStore ?? null;
}

export function ConfirmPickupPage() {
  const initial = useMemo(() => loadFromUrl(), []);
  const [reservation, setReservation] = useState<Reservation | null>(initial);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const hasSchedule = Boolean(
    reservation?.pickupTime && reservation.pickupTime !== "To be confirmed",
  );

  async function confirmPickup() {
    if (!reservation || !hasSchedule) return;
    setConfirming(true);
    setError("");
    const updated = upsertReservation({
      ...reservation,
      customerConfirmed: true,
      status: "confirmed",
    });
    setReservation(updated);
    try {
      await sendCustomerConfirmedPickup(updated);
    } catch {
      /* company notify is best-effort */
    }
    setConfirming(false);
  }

  return (
    <main className="staff-pickup">
      <div className="staff-pickup__card">
        <img src={logoSrc()} alt="Ersunny Travel" width={120} height={120} />
        <h1>Confirm pickup</h1>

        {!reservation ? (
          <p>
            We couldn&apos;t load this reservation. Use the link from your email
            or check status with your reservation number on the website.
          </p>
        ) : (
          <>
            <p className="staff-pickup__id">{reservation.id}</p>
            <dl className="staff-pickup__meta">
              <div>
                <dt>Route</dt>
                <dd>
                  {reservation.origin} → {reservation.destination}
                </dd>
              </div>
              <div>
                <dt>Pickup</dt>
                <dd>
                  {reservation.date}
                  {hasSchedule ? ` · ${reservation.pickupTime}` : " · pending"}
                </dd>
              </div>
              {reservation.wantReturn && reservation.returnDate && (
                <div>
                  <dt>Return</dt>
                  <dd>
                    {reservation.returnDate}
                    {reservation.returnTime &&
                    reservation.returnTime !== "To be confirmed"
                      ? ` · ${reservation.returnTime}`
                      : " · pending"}
                  </dd>
                </div>
              )}
            </dl>

            {!hasSchedule ? (
              <p>
                Your pickup time is not set yet. Ersunny Travel will email you
                when it is confirmed.
              </p>
            ) : reservation.customerConfirmed ? (
              <p className="tracker-ok" role="status">
                Pickup confirmed for {reservation.date} at {reservation.pickupTime}
                {reservation.wantReturn && reservation.returnTime
                  ? ` · return ${reservation.returnDate} at ${reservation.returnTime}`
                  : ""}
                .
              </p>
            ) : (
              <>
                <p>
                  Please confirm you agree with this pickup schedule assigned by
                  Ersunny Travel.
                </p>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn--primary btn--full"
                  disabled={confirming}
                  onClick={() => void confirmPickup()}
                >
                  {confirming ? "Confirming…" : "Confirm pickup time"}
                </button>
              </>
            )}
          </>
        )}

        <p className="staff-pickup__hint">
          Need a change? WhatsApp {contact.whatsapp} or {contact.email}
        </p>
        <a href="/">Back to home</a>
      </div>
    </main>
  );
}
