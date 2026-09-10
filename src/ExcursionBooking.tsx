import { useEffect, useMemo, useState, type FormEvent } from "react";
import { hotelsByZone as defaultHotels } from "./data";
import { useI18n } from "./i18n/I18nProvider";
import { useAppConfig } from "./store/hooks";
import {
  generateReservationId,
  saveReservation,
  type Reservation,
} from "./reservations";

type ExcursionBookingProps = {
  onBooked: (reservation: Reservation) => void;
};

function durationKey(duration: string) {
  return duration === "Half day" ? "exc.duration.half" : "exc.duration.full";
}

export function ExcursionBooking({ onBooked }: ExcursionBookingProps) {
  const { t, locale } = useI18n();
  const config = useAppConfig();
  const hotelsByZone = config.hotelsByZone ?? defaultHotels;
  const allHotels = [
    ...hotelsByZone["Punta Cana"],
    ...hotelsByZone.Bávaro,
    ...hotelsByZone.Macao,
  ];
  const excursions = useMemo(
    () => config.excursions.filter((e) => e.active),
    [config.excursions],
  );

  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [hotelPickup, setHotelPickup] = useState(allHotels[0]);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!excursions.length) return;
    if (!excursions.find((e) => e.id === selectedId)) {
      setSelectedId(excursions[0].id);
    }
  }, [excursions, selectedId]);

  const selected = useMemo(
    () => excursions.find((e) => e.id === selectedId) ?? excursions[0],
    [excursions, selectedId],
  );

  function adjustPassengers(delta: number) {
    setPassengers((n) => Math.min(20, Math.max(1, n + delta)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError(t("exc.errorNone"));
      return;
    }
    if (!date) {
      setError(t("exc.errorDate"));
      return;
    }
    if (!name.trim() || !contactInfo.trim()) {
      setError(t("exc.errorContact"));
      return;
    }
    const unit = selected.price;
    const reservation: Reservation = {
      id: generateReservationId("excursion"),
      kind: "excursion",
      name: name.trim(),
      contactInfo: contactInfo.trim(),
      origin: hotelPickup,
      destination: selected.title,
      date,
      time: "To be confirmed",
      passengers,
      vehicle: "Group excursion",
      wantReturn: false,
      price: unit == null ? null : unit * passengers,
      hotelPickup,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    try {
      saveReservation(reservation);
    } catch {
      /* ignore */
    }
    onBooked(reservation);
  }

  if (!excursions.length) {
    return (
      <section
        className="section section--ocean"
        id="excursiones"
        key={`excursiones-empty-${locale}`}
      >
        <div className="container">
          <div className="section__head">
            <p className="section__eyebrow">{t("exc.eyebrow")}</p>
            <h1 className="section__title">{t("exc.emptyTitle")}</h1>
            <p className="section__lead">{t("exc.emptyLead")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="section section--ocean"
      id="excursiones"
      key={`excursiones-${locale}`}
    >
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">{t("exc.eyebrow")}</p>
          <h1 className="section__title">{t("exc.title")}</h1>
          <p className="section__lead">{t("exc.lead")}</p>
        </div>

        <div className="excursion-layout">
          <div
            className="excursion-grid"
            role="listbox"
            aria-label={t("exc.title")}
          >
            {excursions.map((item) => {
              const active = item.id === selectedId;
              const title = t(`exc.${item.id}.title`);
              const duration = t(durationKey(item.duration));
              const blurb = t(`exc.${item.id}.blurb`);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`excursion-card${active ? " is-active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <img
                    src={item.image}
                    alt={title}
                    loading="lazy"
                    width={640}
                    height={420}
                  />
                  <div className="excursion-card__body">
                    <p className="excursion-card__meta">{duration}</p>
                    <h3>{title}</h3>
                    <p>{blurb}</p>
                    <p className="excursion-card__price">
                      {item.price == null
                        ? t("exc.priceTbc")
                        : t("exc.pricePerson", { price: item.price })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <form
            className="booking-form excursion-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="excursion-form__selected">
              <small>{t("exc.selected")}</small>
              <strong>
                {selected ? t(`exc.${selected.id}.title`) : ""}
              </strong>
              <span>
                {selected ? t(durationKey(selected.duration)) : ""}
              </span>
              <ul>
                {(selected?.highlights ?? []).map((_, i) => (
                  <li key={i}>{t(`exc.${selected!.id}.h${i}`)}</li>
                ))}
              </ul>
            </div>

            <div className="booking-form__grid">
              <div className="field field--full">
                <label htmlFor="exc-hotel">{t("exc.pickupHotel")}</label>
                <select
                  id="exc-hotel"
                  value={hotelPickup}
                  onChange={(e) => setHotelPickup(e.target.value)}
                  required
                >
                  <optgroup label={t("zone.puntacana")}>
                    {hotelsByZone["Punta Cana"].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t("zone.bavaro")}>
                    {hotelsByZone.Bávaro.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t("zone.macao")}>
                    {hotelsByZone.Macao.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="field">
                <label htmlFor="exc-date">{t("exc.date")}</label>
                <input
                  id="exc-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="exc-passengers">{t("exc.guests")}</label>
                <div className="passenger-stepper">
                  <button
                    type="button"
                    aria-label={t("exc.removeGuest")}
                    onClick={() => adjustPassengers(-1)}
                    disabled={passengers <= 1}
                  >
                    −
                  </button>
                  <input
                    id="exc-passengers"
                    type="number"
                    min={1}
                    max={20}
                    value={passengers}
                    onChange={(e) =>
                      setPassengers(
                        Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                      )
                    }
                    required
                  />
                  <button
                    type="button"
                    aria-label={t("exc.addGuest")}
                    onClick={() => adjustPassengers(1)}
                    disabled={passengers >= 20}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="exc-name">{t("exc.name")}</label>
                <input
                  id="exc-name"
                  type="text"
                  placeholder={t("exc.namePh")}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="exc-contact">{t("exc.contact")}</label>
                <input
                  id="exc-contact"
                  type="text"
                  placeholder={t("exc.contactPh")}
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>

              <div className="field field--full">
                <label htmlFor="exc-notes">{t("exc.notes")}</label>
                <textarea
                  id="exc-notes"
                  placeholder={t("exc.notesPh")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="booking-form__footer">
              <div className="price-tag">
                <small>{t("exc.estimated")}</small>
                <strong>
                  {selected?.price == null
                    ? t("exc.pending")
                    : `$${selected.price * passengers} USD`}
                </strong>
              </div>
              <button type="submit" className="btn btn--primary">
                {t("exc.book")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
