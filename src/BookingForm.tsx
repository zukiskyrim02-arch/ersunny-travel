import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  airportLabel,
  hotelsByZone,
  type Zone,
} from "./data";
import { useAppConfig } from "./store/hooks";
import {
  generateReservationId,
  saveReservation,
  type Reservation,
} from "./reservations";

type Place =
  | { kind: "airport" }
  | { kind: "hotel"; zone: Zone; name: string };

type BookingFormProps = {
  onBooked: (reservation: Reservation) => void;
};

function parsePlace(key: string): Place {
  if (key === "airport") return { kind: "airport" };
  const [, zone, ...rest] = key.split(":");
  return { kind: "hotel", zone: zone as Zone, name: rest.join(":") };
}

function placeLabel(place: Place) {
  return place.kind === "airport" ? airportLabel : place.name;
}

function pricingZone(origin: Place, destination: Place): Zone {
  if (origin.kind === "hotel") return origin.zone;
  if (destination.kind === "hotel") return destination.zone;
  return "Punta Cana";
}

function PlaceOptions() {
  return (
    <>
      <option value="airport">{airportLabel}</option>
      <optgroup label="Punta Cana">
        {hotelsByZone["Punta Cana"].map((h) => (
          <option key={h} value={`hotel:Punta Cana:${h}`}>
            {h}
          </option>
        ))}
      </optgroup>
      <optgroup label="Bávaro">
        {hotelsByZone.Bávaro.map((h) => (
          <option key={h} value={`hotel:Bávaro:${h}`}>
            {h}
          </option>
        ))}
      </optgroup>
      <optgroup label="Macao">
        {hotelsByZone.Macao.map((h) => (
          <option key={h} value={`hotel:Macao:${h}`}>
            {h}
          </option>
        ))}
      </optgroup>
    </>
  );
}

export function BookingForm({ onBooked }: BookingFormProps) {
  const config = useAppConfig();
  const vehicles = config.vehicles;

  const [originKey, setOriginKey] = useState("airport");
  const [destinationKey, setDestinationKey] = useState(
    `hotel:Punta Cana:${hotelsByZone["Punta Cana"][0]}`,
  );
  const [wantReturn, setWantReturn] = useState(false);
  const [passengers, setPassengers] = useState(2);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "suv");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flight, setFlight] = useState("");
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const origin = useMemo(() => parsePlace(originKey), [originKey]);
  const destination = useMemo(() => parsePlace(destinationKey), [destinationKey]);

  const activeVehicle =
    vehicles.find((v) => v.id === vehicleId) ??
    vehicles.find((v) => passengers <= v.maxPassengers) ??
    vehicles[0];

  const recommendedVehicle = useMemo(() => {
    const sorted = [...vehicles].sort((a, b) => a.maxPassengers - b.maxPassengers);
    return sorted.find((v) => passengers <= v.maxPassengers) ?? sorted[sorted.length - 1];
  }, [passengers, vehicles]);

  const price = useMemo(() => {
    if (!activeVehicle) return 0;
    const zone = pricingZone(origin, destination);
    const oneWay = activeVehicle.basePrice + (config.zoneSurcharge[zone] ?? 0);
    return wantReturn ? oneWay * 2 : oneWay;
  }, [activeVehicle, origin, destination, wantReturn, config.zoneSurcharge]);

  // Keep selected vehicle valid when catalog changes
  useEffect(() => {
    if (!vehicles.find((v) => v.id === vehicleId) && vehicles[0]) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicles, vehicleId]);

  function ensureDifferent(nextOrigin: string, nextDestination: string) {
    if (nextOrigin !== nextDestination) {
      setOriginKey(nextOrigin);
      setDestinationKey(nextDestination);
      return;
    }
    const place = parsePlace(nextOrigin);
    if (place.kind === "airport") {
      setOriginKey(nextOrigin);
      setDestinationKey(`hotel:Punta Cana:${hotelsByZone["Punta Cana"][0]}`);
    } else {
      setOriginKey(nextOrigin);
      setDestinationKey("airport");
    }
  }

  function handleOriginChange(key: string) {
    const next = parsePlace(key);
    const dest = parsePlace(destinationKey);
    if (key === destinationKey) {
      ensureDifferent(
        key,
        next.kind === "airport"
          ? `hotel:Punta Cana:${hotelsByZone["Punta Cana"][0]}`
          : "airport",
      );
      return;
    }
    if (next.kind === "hotel" && dest.kind === "hotel") {
      setOriginKey(key);
      setDestinationKey("airport");
      return;
    }
    if (next.kind === "airport" && dest.kind === "airport") {
      setOriginKey(key);
      setDestinationKey(`hotel:Punta Cana:${hotelsByZone["Punta Cana"][0]}`);
      return;
    }
    setOriginKey(key);
  }

  function handleDestinationChange(key: string) {
    if (key === originKey) {
      ensureDifferent(
        parsePlace(key).kind === "airport"
          ? `hotel:Punta Cana:${hotelsByZone["Punta Cana"][0]}`
          : "airport",
        key,
      );
      return;
    }
    const next = parsePlace(key);
    const orig = parsePlace(originKey);
    if (next.kind === "hotel" && orig.kind === "hotel") {
      setOriginKey("airport");
      setDestinationKey(key);
      return;
    }
    setDestinationKey(key);
  }

  function swapPlaces() {
    setOriginKey(destinationKey);
    setDestinationKey(originKey);
  }

  function pickVehicleForPassengers(n: number) {
    const fit = [...vehicles]
      .sort((a, b) => a.maxPassengers - b.maxPassengers)
      .find((v) => n <= v.maxPassengers);
    if (fit) setVehicleId(fit.id);
  }

  function adjustPassengers(delta: number) {
    setPassengers((n) => {
      const next = Math.min(30, Math.max(1, n + delta));
      pickVehicleForPassengers(next);
      return next;
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Selecciona la fecha de ida.");
      return;
    }
    if (wantReturn && !returnDate) {
      setError("Selecciona la fecha de regreso.");
      return;
    }
    if (!name.trim() || !contactInfo.trim()) {
      setError("Completa tu nombre y WhatsApp o email.");
      return;
    }
    if (!activeVehicle) {
      setError("No hay vehículos configurados.");
      return;
    }

    const reservation: Reservation = {
      id: generateReservationId("transfer"),
      kind: "transfer",
      name: name.trim(),
      contactInfo: contactInfo.trim(),
      origin: placeLabel(origin),
      destination: placeLabel(destination),
      date,
      time: "Por confirmar",
      returnDate: wantReturn ? returnDate : undefined,
      returnTime: wantReturn ? "Por confirmar" : undefined,
      passengers,
      vehicle: activeVehicle.name,
      wantReturn,
      price,
      flight: flight || undefined,
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

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>
      <div className="booking-form__grid">
        <div className="field field--full route-fields">
          <div className="field">
            <label htmlFor="origin">Origen</label>
            <select
              id="origin"
              value={originKey}
              onChange={(e) => handleOriginChange(e.target.value)}
            >
              <PlaceOptions />
            </select>
          </div>

          <button
            type="button"
            className="route-swap"
            onClick={swapPlaces}
            aria-label="Intercambiar origen y destino"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="field">
            <label htmlFor="destination">Destino</label>
            <select
              id="destination"
              value={destinationKey}
              onChange={(e) => handleDestinationChange(e.target.value)}
            >
              <PlaceOptions />
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="passengers">Personas</label>
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
              id="passengers"
              type="number"
              min={1}
              max={30}
              value={passengers}
              onChange={(e) => {
                const n = Math.min(30, Math.max(1, Number(e.target.value) || 1));
                setPassengers(n);
                pickVehicleForPassengers(n);
              }}
              required
            />
            <button
              type="button"
              aria-label="Agregar persona"
              onClick={() => adjustPassengers(1)}
              disabled={passengers >= 30}
            >
              +
            </button>
          </div>
          <p className="field-hint">
            Sugerido: {recommendedVehicle?.name ?? "—"}
          </p>
        </div>

        <div className="field">
          <label htmlFor="return-toggle">Regreso</label>
          <button
            id="return-toggle"
            type="button"
            role="switch"
            aria-checked={wantReturn}
            className={`return-toggle${wantReturn ? " is-on" : ""}`}
            onClick={() => setWantReturn((v) => !v)}
          >
            <span className="return-toggle__track" aria-hidden>
              <span className="return-toggle__thumb" />
            </span>
            <span className="return-toggle__label">
              {wantReturn ? "Ida y vuelta" : "Solo ida"}
            </span>
          </button>
        </div>

        <div className={`field${wantReturn ? "" : " field--full"}`}>
          <label htmlFor="date">Fecha de ida</label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="field-hint">La hora de recogida la confirmamos nosotros.</p>
        </div>

        {wantReturn && (
          <div className="field">
            <label htmlFor="return-date">Fecha de regreso</label>
            <input
              id="return-date"
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        )}

        <div className="field field--full">
          <label htmlFor="flight">Nº de vuelo</label>
          <input
            id="flight"
            type="text"
            value={flight}
            onChange={(e) => setFlight(e.target.value)}
            placeholder={
              origin.kind === "airport" || destination.kind === "airport"
                ? "AA1234"
                : "Opcional"
            }
          />
        </div>

        <div className="field field--full">
          <label>Vehículo</label>
          <div className="vehicle-picker" role="radiogroup" aria-label="Vehículo">
            {vehicles.map((v) => {
              const tooSmall = passengers > v.maxPassengers;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={vehicleId === v.id}
                  disabled={tooSmall}
                  className={`vehicle-option${vehicleId === v.id ? " is-active" : ""}`}
                  onClick={() => setVehicleId(v.id)}
                >
                  <strong>{v.name}</strong>
                  <span>
                    {v.capacity} · ${v.basePrice}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            type="text"
            placeholder="Tu nombre"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="contact">WhatsApp / Email</label>
          <input
            id="contact"
            type="text"
            placeholder="+1 809… o correo"
            required
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
          />
        </div>

        <div className="field field--full">
          <label htmlFor="notes">Notas</label>
          <textarea
            id="notes"
            placeholder="Asientos infantiles, equipaje especial…"
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
          <small>
            Precio
            {wantReturn ? " · ida y vuelta" : " · solo ida"}
          </small>
          <strong>${price} USD</strong>
        </div>
        <button type="submit" className="btn btn--primary">
          Reservar y pagar
        </button>
      </div>
    </form>
  );
}
