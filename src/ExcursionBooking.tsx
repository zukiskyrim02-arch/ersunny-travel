import { useMemo, useState, type FormEvent } from "react";
import { excursions, hotelsByZone } from "./data";
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
  const [selectedId, setSelectedId] = useState(excursions[0].id);
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [hotelPickup, setHotelPickup] = useState(allHotels[0]);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");

  const selected = useMemo(
    () => excursions.find((e) => e.id === selectedId) ?? excursions[0],
    [selectedId],
  );

  function adjustPassengers(delta: number) {
    setPassengers((n) => Math.min(20, Math.max(1, n + delta)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const reservation: Reservation = {
      id: generateReservationId("excursion"),
      kind: "excursion",
      name,
      contactInfo,
      origin: hotelPickup,
      destination: selected.title,
      date,
      time: "Pickup a confirmar",
      passengers,
      vehicle: "Excursión grupal",
      wantReturn: false,
      price: null,
      hotelPickup,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };
    saveReservation(reservation);
    onBooked(reservation);
  }

  return (
    <section className="section section--ocean" id="excursiones">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Experiencias</p>
          <h2 className="section__title">Reserva tu excursión</h2>
          <p className="section__lead">
            Elige la experiencia, la fecha y tu hotel de recogida. Al confirmar,
            te mostramos el pago APAP. Precios oficiales: pendientes.
          </p>
        </div>

        <div className="excursion-layout">
          <div className="excursion-grid" role="listbox" aria-label="Excursiones">
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
                  <img src={item.image} alt="" loading="lazy" width={640} height={420} />
                  <div className="excursion-card__body">
                    <p className="excursion-card__meta">{item.duration}</p>
                    <h3>{item.title}</h3>
                    <p>{item.blurb}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <form className="booking-form excursion-form" onSubmit={handleSubmit}>
            <div className="excursion-form__selected">
              <small>Seleccionada</small>
              <strong>{selected.title}</strong>
              <span>{selected.duration}</span>
              <ul>
                {selected.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="booking-form__grid">
              <div className="field field--full">
                <label htmlFor="exc-hotel">Hotel de recogida</label>
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
                <label htmlFor="exc-date">Fecha</label>
                <input
                  id="exc-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="exc-passengers">Personas</label>
                <div className="passenger-stepper">
                  <button
                    type="button"
                    aria-label="Quitar persona"
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
                    aria-label="Agregar persona"
                    onClick={() => adjustPassengers(1)}
                    disabled={passengers >= 20}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="exc-name">Nombre</label>
                <input
                  id="exc-name"
                  type="text"
                  placeholder="Tu nombre"
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
                  placeholder="+1 809… o correo"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>

              <div className="field field--full">
                <label htmlFor="exc-notes">Notas</label>
                <textarea
                  id="exc-notes"
                  placeholder="Edades de niños, movilidad, preferencias…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="booking-form__footer">
              <div className="price-tag">
                <small>Precio oficial</small>
                <strong>Pendiente</strong>
              </div>
              <button type="submit" className="btn btn--primary">
                Reservar excursión
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
