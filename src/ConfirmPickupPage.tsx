import { useMemo, useState } from "react";
import { logoSrc } from "./assets";
import { useI18n } from "./i18n/I18nProvider";
import { getSiteContact } from "./store/config";
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
  const { t } = useI18n();
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

  const returnSuffix =
    reservation?.wantReturn && reservation.returnTime
      ? ` · ${t("confirm.return")} ${reservation.returnDate} · ${reservation.returnTime}`
      : "";

  return (
    <main className="staff-pickup">
      <div className="staff-pickup__card">
        <img src={logoSrc()} alt="Ersunny Travel" width={120} height={120} />
        <h1>{t("confirm.title")}</h1>

        {!reservation ? (
          <p>{t("confirm.missing")}</p>
        ) : (
          <>
            <p className="staff-pickup__id">{reservation.id}</p>
            <dl className="staff-pickup__meta">
              <div>
                <dt>{t("confirm.route")}</dt>
                <dd>
                  {reservation.origin} → {reservation.destination}
                </dd>
              </div>
              <div>
                <dt>{t("confirm.pickup")}</dt>
                <dd>
                  {reservation.date}
                  {hasSchedule
                    ? ` · ${reservation.pickupTime}`
                    : ` · ${t("confirm.pending")}`}
                </dd>
              </div>
              {reservation.wantReturn && reservation.returnDate && (
                <div>
                  <dt>{t("confirm.return")}</dt>
                  <dd>
                    {reservation.returnDate}
                    {reservation.returnTime &&
                    reservation.returnTime !== "To be confirmed"
                      ? ` · ${reservation.returnTime}`
                      : ` · ${t("confirm.pending")}`}
                  </dd>
                </div>
              )}
            </dl>

            {!hasSchedule ? (
              <p>{t("confirm.waiting")}</p>
            ) : reservation.customerConfirmed ? (
              <p className="tracker-ok" role="status">
                {t("confirm.confirmed", {
                  date: reservation.date,
                  time: reservation.pickupTime ?? "",
                  return: returnSuffix,
                })}
              </p>
            ) : (
              <>
                <p>{t("confirm.pleaseConfirm")}</p>
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
                  {confirming ? t("confirm.confirming") : t("confirm.button")}
                </button>
              </>
            )}
          </>
        )}

        <p className="staff-pickup__hint">
          {t("confirm.hint", {
            whatsapp: getSiteContact().whatsapp,
            email: getSiteContact().email,
          })}
        </p>
        <a href="/">{t("confirm.backHome")}</a>
      </div>
    </main>
  );
}
