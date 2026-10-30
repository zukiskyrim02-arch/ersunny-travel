import { useEffect, useMemo, useState, type FormEvent } from "react";
import { HotelCombo } from "./HotelCombo";
import { useI18n } from "./i18n/I18nProvider";
import { useMedia } from "./media/library";
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
  const media = useMedia();
  const config = useAppConfig();
  const pickups = useMemo(() => {
    if (config.excursionPickups.length) return config.excursionPickups;
    return Object.values(config.hotelsByZone).flat();
  }, [config.excursionPickups, config.hotelsByZone]);
  const excursions = useMemo(
    () => config.excursions.filter((e) => e.active),
    [config.excursions],
  );

  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [hotelPickup, setHotelPickup] = useState("");
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
    if (!hotelPickup.trim()) {
      setError(t("exc.errorHotel"));
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
              const title = item.title;
              const duration = t(durationKey(item.duration));
              const blurb = item.blurb;
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
                    key={item.image}
                    src={media.excursionImage(item.id, item.image, 800)}
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
              <strong>{selected?.title ?? ""}</strong>
              <span>
                {selected ? t(durationKey(selected.duration)) : ""}
              </span>
              <ul>
                {(selected?.highlights ?? []).map((point, i) => (
                  <li key={`${i}-${point}`}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="booking-form__grid">
              <HotelCombo
                id="exc-hotel"
                className="field--full"
                label={t("exc.pickupHotel")}
                placeholder={t("quote.hotelPh")}
                value={hotelPickup}
                options={pickups}
                required
                onChange={setHotelPickup}
              />

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
                    : `US$${selected.price * passengers}`}
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
