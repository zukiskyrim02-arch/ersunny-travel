import { useEffect, useMemo, useState, type FormEvent } from "react";
import { hotelsByZone } from "./data";
import { useAppConfig } from "./store/hooks";
import {
  generateReservationId,
  saveReservation,
  type Reservation,
} from "./reservations";

type ExcursionBookingProps = {
  onBooked: (reservation: Reservation) => void;
};

const allHotels = [
  ...hotelsByZone["Punta Cana"],
  ...hotelsByZone.Bávaro,
  ...hotelsByZone.Macao,
];

export function ExcursionBooking({ onBooked }: ExcursionBookingProps) {
  const config = useAppConfig();
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
      setError("No excursions are available.");
      return;
    }
    if (!date) {
      setError("Select the excursion date.");
      return;
    }
    if (!name.trim() || !contactInfo.trim()) {
      setError("Enter your name and WhatsApp number or email.");
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
      <section className="section section--ocean" id="excursiones">
        <div className="container">
          <div className="section__head">
            <p className="section__eyebrow">Punta Cana excursions</p>
            <h1 className="section__title">Book tours &amp; island experiences</h1>
            <p className="section__lead">
              New experiences are coming soon. In the meantime, you can book
              your transfer.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--ocean" id="excursiones">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Punta Cana excursions</p>
          <h1 className="section__title">Book tours &amp; island experiences</h1>
          <p className="section__lead">
            Choose your experience, date, and pickup hotel. After you confirm,
            you can pay securely by card with Pago Azul.
          </p>
        </div>

        <div className="excursion-layout">
          <div className="excursion-grid" role="listbox" aria-label="Excursions">
            {excursions.map((item) => {
              const active = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`excursion-card${active ? " is-active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <img src={item.image} alt={`${item.title} in Punta Cana`} loading="lazy" width={640} height={420} />
                  <div className="excursion-card__body">
                    <p className="excursion-card__meta">{item.duration}</p>
                    <h3>{item.title}</h3>
                    <p>{item.blurb}</p>
                    <p className="excursion-card__price">
                      {item.price == null ? "Price to be confirmed" : `From $${item.price} USD / person`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <form className="booking-form excursion-form" onSubmit={handleSubmit} noValidate>
            <div className="excursion-form__selected">
              <small>Selected</small>
              <strong>{selected?.title}</strong>
              <span>{selected?.duration}</span>
              <ul>
                {selected?.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="booking-form__grid">
              <div className="field field--full">
                <label htmlFor="exc-hotel">Pickup hotel</label>
                <select
                  id="exc-hotel"
                  value={hotelPickup}
                  onChange={(e) => setHotelPickup(e.target.value)}
                  required
                >
                  <optgroup label="Punta Cana">
                    {hotelsByZone["Punta Cana"].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bávaro">
                    {hotelsByZone.Bávaro.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Macao">
                    {hotelsByZone.Macao.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="field">
                <label htmlFor="exc-date">Date</label>
                <input
                  id="exc-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="exc-passengers">Guests</label>
                <div className="passenger-stepper">
                  <button
                    type="button"
                    aria-label="Remove guest"
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
                    aria-label="Add guest"
                    onClick={() => adjustPassengers(1)}
                    disabled={passengers >= 20}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="exc-name">Name</label>
                <input
                  id="exc-name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="exc-contact">WhatsApp / Email</label>
                <input
                  id="exc-contact"
                  type="text"
                  placeholder="+1 809… or email"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>

              <div className="field field--full">
                <label htmlFor="exc-notes">Notes</label>
                <textarea
                  id="exc-notes"
                  placeholder="Children's ages, accessibility needs, preferences…"
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
                <small>Estimated total</small>
                <strong>
                  {selected?.price == null
                    ? "Pending"
                    : `$${selected.price * passengers} USD`}
                </strong>
              </div>
              <button type="submit" className="btn btn--primary">
                Book excursion
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
