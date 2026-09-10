import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { airportLabel, hotelsByZone } from "./data";
import { sendBookingNotification } from "./notifyBooking";
import {
  generateReservationId,
  saveReservation,
  type Reservation,
} from "./reservations";
import { useAppConfig } from "./store/hooks";

const hotels = [
  ...hotelsByZone["Punta Cana"],
  ...hotelsByZone.Bávaro,
  ...hotelsByZone.Macao,
];

type QuoteFormProps = {
  onBooked: (reservation: Reservation) => void;
};

function passengerCount(label: string): number {
  if (label.startsWith("1 ")) return 1;
  if (label.startsWith("2 ")) return 2;
  if (label.startsWith("3 ")) return 3;
  if (label.startsWith("4 ")) return 4;
  if (label.startsWith("5")) return 6;
  if (label.includes("Family")) return 4;
  return 2;
}

export function QuoteForm({ onBooked }: QuoteFormProps) {
  const { vehicles } = useAppConfig();
  const [service, setService] = useState("Private Transfer");
  const [transferType, setTransferType] = useState("Airport → Hotel");
  const [date, setDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState("2 Adults");
  const [hotel, setHotel] = useState("");
  const [airline, setAirline] = useState("");
  const [flight, setFlight] = useState("");
  const [returnAirline, setReturnAirline] = useState("");
  const [returnFlight, setReturnFlight] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hotelOpen, setHotelOpen] = useState(false);
  const hotelWrapRef = useRef<HTMLDivElement>(null);

  const isRoundTrip = service === "Round trip";

  const hotelMatches = useMemo(() => {
    const q = hotel.trim().toLowerCase();
    if (!q) return hotels.slice(0, 8);
    return hotels.filter((h) => h.toLowerCase().includes(q)).slice(0, 8);
  }, [hotel]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!hotelWrapRef.current?.contains(e.target as Node)) {
        setHotelOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const pax = passengerCount(passengers);
    const vehicle =
      [...vehicles]
        .sort((a, b) => a.maxPassengers - b.maxPassengers)
        .find((v) => pax <= v.maxPassengers) ??
      vehicles[vehicles.length - 1];

    if (!vehicle) {
      setError("No vehicles are configured.");
      setSubmitting(false);
      return;
    }

    const base = vehicle.basePrice;
    const price = Math.round(base * (isRoundTrip ? 1.9 : 1));

    const origin =
      transferType === "Hotel → Airport" || transferType === "Hotel → Hotel"
        ? hotel.trim()
        : airportLabel;
    const destination =
      transferType === "Airport → Hotel" || transferType === "Hotel → Hotel"
        ? hotel.trim()
        : airportLabel;

    const flightNotes = isRoundTrip
      ? `Arrival: ${airline} ${flight} · Departure: ${returnAirline} ${returnFlight}`
      : `${airline} ${flight}`;

    const reservation: Reservation = {
      id: generateReservationId("transfer"),
      kind: "transfer",
      name: name.trim(),
      contactInfo: `${whatsapp.trim()} · ${email.trim()}`,
      origin,
      destination,
      date,
      time: "To be confirmed",
      returnDate: isRoundTrip ? departureDate : undefined,
      returnTime: isRoundTrip ? "To be confirmed" : undefined,
      passengers: pax,
      vehicle: vehicle.name,
      wantReturn: isRoundTrip,
      price,
      flight: flightNotes,
      hotelPickup: hotel.trim(),
      notes: `Service: ${service} · Type: ${transferType}`,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      saveReservation(reservation);
    } catch {
      /* ignore storage errors */
    }

    try {
      await sendBookingNotification({
        _subject: `New transfer booking ${reservation.id}`,
        reservation_id: reservation.id,
        customer_name: reservation.name,
        email: email.trim(),
        whatsapp_app: whatsapp.trim(),
        service,
        transfer_type: transferType,
        arrival_or_pickup_date: date,
        departure_date: isRoundTrip ? departureDate : "N/A",
        passengers,
        hotel: hotel.trim(),
        vehicle: vehicle.name,
        price_usd: String(price),
        arrival_airline: airline.trim(),
        arrival_flight: flight.trim(),
        departure_airline: isRoundTrip ? returnAirline.trim() : "N/A",
        departure_flight: isRoundTrip ? returnFlight.trim() : "N/A",
        replyto: email.trim(),
      });
    } catch {
      // Still continue to payment; email provider may need first-time activation
    }

    setSubmitting(false);
    onBooked(reservation);
  }

  return (
    <form className="quote-form" onSubmit={onSubmit}>
      <h3>Book transportation</h3>
      <div className="quote-form__grid">
        <label className="field">
          <span>Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)} required>
            <option>Private Transfer</option>
            <option>Round trip</option>
          </select>
        </label>
        <label className="field">
          <span>Transfer type</span>
          <select
            value={transferType}
            onChange={(e) => setTransferType(e.target.value)}
            required
          >
            <option>Airport → Hotel</option>
            <option>Hotel → Airport</option>
            <option>Hotel → Hotel</option>
          </select>
        </label>
        <label className="field">
          <span>{isRoundTrip ? "Arrival date" : "Pickup / Drop-off"}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        {isRoundTrip && (
          <label className="field">
            <span>Departure date</span>
            <input
              type="date"
              value={departureDate}
              min={date || undefined}
              onChange={(e) => setDepartureDate(e.target.value)}
              required
            />
          </label>
        )}
        <label className="field">
          <span>Passengers</span>
          <select
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
            required
          >
            <option>1 Adult</option>
            <option>2 Adults</option>
            <option>3 Adults</option>
            <option>4 Adults</option>
            <option>5+ Adults</option>
            <option>Family with kids</option>
          </select>
        </label>
        <div className="field hotel-combo" ref={hotelWrapRef}>
          <label htmlFor="quote-hotel">Hotel (or destination)</label>
          <input
            id="quote-hotel"
            role="combobox"
            placeholder="e.g. Paradisus Palma Real"
            value={hotel}
            autoComplete="off"
            required
            aria-autocomplete="list"
            aria-expanded={hotelOpen}
            aria-controls="quote-hotel-list"
            onFocus={() => setHotelOpen(true)}
            onChange={(e) => {
              setHotel(e.target.value);
              setHotelOpen(true);
            }}
          />
          {hotelOpen && hotelMatches.length > 0 && (
            <ul
              id="quote-hotel-list"
              className="hotel-combo__list"
              role="listbox"
            >
              {hotelMatches.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    role="option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setHotel(h);
                      setHotelOpen(false);
                    }}
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {isRoundTrip ? (
          <>
            <label className="field">
              <span>Arrival airline</span>
              <input
                placeholder="e.g. American Airlines"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Arrival flight</span>
              <input
                placeholder="e.g. AA123"
                value={flight}
                onChange={(e) => setFlight(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Departure airline</span>
              <input
                placeholder="e.g. JetBlue"
                value={returnAirline}
                onChange={(e) => setReturnAirline(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Departure flight</span>
              <input
                placeholder="e.g. AA456"
                value={returnFlight}
                onChange={(e) => setReturnFlight(e.target.value)}
                required
              />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>Airline name</span>
              <input
                placeholder="e.g. American Airlines"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Flight number</span>
              <input
                placeholder="e.g. AA123"
                value={flight}
                onChange={(e) => setFlight(e.target.value)}
                required
              />
            </label>
          </>
        )}
        <label className="field">
          <span>Full name</span>
          <input
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="field quote-form__full">
          <span>WhatsApp app</span>
          <input
            type="tel"
            placeholder="+1 809…"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            autoComplete="tel"
            required
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="btn-blue quote-form__submit"
        type="submit"
        disabled={submitting}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
        </svg>
        {submitting ? "Sending…" : "Request transfer"}
      </button>
    </form>
  );
}
