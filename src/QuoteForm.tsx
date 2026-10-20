import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { airportLabel } from "./data";
import { useI18n } from "./i18n/I18nProvider";
import { sendTransferBookingEmails } from "./notifyBooking";
import {
  generateReservationId,
  saveReservation,
  type Reservation,
} from "./reservations";
import { useAppConfig } from "./store/hooks";
import { fareFor, zoneForHotel, zonesOf } from "./transfers";

type QuoteFormProps = {
  onBooked: (reservation: Reservation) => void;
};

export function QuoteForm({ onBooked }: QuoteFormProps) {
  const { t } = useI18n();
  const config = useAppConfig();
  const { vehicles: allVehicles, hotelsByZone } = config;
  const vehicles = allVehicles.filter((v) => v.active !== false);
  const zones = zonesOf(config);
  const hotels = zones.flatMap((zone) => hotelsByZone[zone] ?? []);
  const [service, setService] = useState("Private Transfer");
  const [transferType, setTransferType] = useState("Airport → Hotel");
  const [rideClass, setRideClass] = useState("Private");
  const [date, setDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showChildren, setShowChildren] = useState(false);
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
  const isSharedService = service === "Shared transportation";
  const isShared =
    isSharedService || (isRoundTrip && rideClass === "Shared");

  const hotelMatches = useMemo(() => {
    const q = hotel.trim().toLowerCase();
    if (!q) return hotels.slice(0, 8);
    return hotels.filter((h) => h.toLowerCase().includes(q)).slice(0, 8);
  }, [hotel, hotels]);

  const quoted = useMemo(() => {
    const pax = Math.max(0, adults) + Math.max(0, children);
    const vehicle =
      [...vehicles]
        .sort((a, b) => a.maxPassengers - b.maxPassengers)
        .find((item) => pax <= item.maxPassengers) ??
      vehicles[vehicles.length - 1];
    if (!vehicle) return null;
    const zone = zoneForHotel(hotelsByZone, hotel) ?? zones[0] ?? "Punta Cana";
    const fare = fareFor(config, vehicle.id, zone);
    const price = isRoundTrip
      ? isShared
        ? fare.sharedRoundTrip
        : fare.roundTrip
      : isShared
        ? fare.sharedOneWay
        : fare.oneWay;
    return { vehicle, zone, price };
  }, [
    adults,
    children,
    vehicles,
    hotelsByZone,
    zones,
    hotel,
    config,
    isRoundTrip,
    isShared,
  ]);

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

    const safeAdults = Math.max(0, adults);
    const safeChildren = Math.max(0, children);

    if (safeAdults < 1) {
      setError(t("quote.errorAdults"));
      setSubmitting(false);
      return;
    }

    if (!quoted) {
      setError(t("quote.errorVehicles"));
      setSubmitting(false);
      return;
    }

    const vehicle = quoted.vehicle;
    const price = quoted.price;

    const origin = isRoundTrip
      ? airportLabel
      : transferType === "Hotel → Airport" || transferType === "Hotel → Hotel"
        ? hotel.trim()
        : airportLabel;
    const destination = isRoundTrip
      ? hotel.trim()
      : transferType === "Airport → Hotel" || transferType === "Hotel → Hotel"
        ? hotel.trim()
        : airportLabel;

    const flightNotes = isRoundTrip
      ? `Arrival: ${airline} ${flight} · Departure: ${returnAirline} ${returnFlight}`
      : `${airline} ${flight}`;

    const passengerLabel = `${safeAdults} adult${safeAdults === 1 ? "" : "s"}${
      safeChildren > 0
        ? ` · ${safeChildren} child${safeChildren === 1 ? "" : "ren"}`
        : ""
    }`;

    const typeLabel = isRoundTrip
      ? rideClass
      : isSharedService
        ? "Shared"
        : transferType;

    const reservation: Reservation = {
      id: generateReservationId("transfer"),
      kind: "transfer",
      name: name.trim(),
      contactInfo: `${whatsapp.trim()} · ${email.trim()}`,
      email: email.trim(),
      origin,
      destination,
      date,
      time: "To be confirmed",
      returnDate: isRoundTrip ? departureDate : undefined,
      returnTime: isRoundTrip ? "To be confirmed" : undefined,
      passengers: safeAdults + safeChildren,
      vehicle: isShared ? "Shared transfer" : vehicle.name,
      wantReturn: isRoundTrip,
      price,
      flight: flightNotes,
      hotelPickup: hotel.trim(),
      notes: `Service: ${service} · Type: ${typeLabel} · Passengers: ${passengerLabel}`,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    try {
      saveReservation(reservation);
    } catch {
      /* ignore storage errors */
    }

    void sendTransferBookingEmails(reservation, {
      service,
      transferType: typeLabel,
      adults: String(safeAdults),
      children: String(safeChildren),
      whatsapp: whatsapp.trim(),
      arrivalAirline: airline.trim(),
      arrivalFlight: flight.trim(),
      departureAirline: isRoundTrip ? returnAirline.trim() : undefined,
      departureFlight: isRoundTrip ? returnFlight.trim() : undefined,
    }).catch(() => {
      /* Email is best-effort. The booking is already saved. */
    });

    setSubmitting(false);
    onBooked(reservation);
  }

  return (
    <form className="quote-form" onSubmit={onSubmit}>
      <h3>{t("quote.title")}</h3>
      <div className="quote-form__grid">
        <label className="field">
          <span>{t("quote.service")}</span>
          <select value={service} onChange={(e) => setService(e.target.value)} required>
            <option value="Private Transfer">{t("quote.privateTransfer")}</option>
            <option value="Shared transportation">{t("quote.sharedTransportation")}</option>
            <option value="Round trip">{t("quote.roundTrip")}</option>
          </select>
        </label>
        {isRoundTrip ? (
          <label className="field">
            <span>{t("quote.rideType")}</span>
            <select
              value={rideClass}
              onChange={(e) => setRideClass(e.target.value)}
              required
            >
              <option value="Private">{t("quote.private")}</option>
              <option value="Shared">{t("quote.shared")}</option>
            </select>
          </label>
        ) : (
          <label className="field">
            <span>{t("quote.transferType")}</span>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              required
            >
              <option value="Airport → Hotel">{t("quote.airportHotel")}</option>
              <option value="Hotel → Airport">{t("quote.hotelAirport")}</option>
              <option value="Hotel → Hotel">{t("quote.hotelHotel")}</option>
            </select>
          </label>
        )}
        <label className="field">
          <span>{isRoundTrip ? t("quote.arrivalDate") : t("quote.pickupDropoff")}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        {isRoundTrip && (
          <label className="field">
            <span>{t("quote.departureDate")}</span>
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
          <span>{t("quote.adults")}</span>
          <input
            type="number"
            min={1}
            max={20}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value) || 0)}
            required
          />
        </label>
        {showChildren ? (
          <label className="field field--children">
            <span className="field__head">
              {t("quote.children")}
              <button
                type="button"
                className="field__remove"
                aria-label={t("quote.removeChildren")}
                onClick={() => {
                  setShowChildren(false);
                  setChildren(0);
                }}
              >
                ×
              </button>
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value) || 0)}
              required
              autoFocus
            />
          </label>
        ) : (
          <div className="field field--add-children">
            <button
              type="button"
              className="quote-form__add-option"
              onClick={() => {
                setShowChildren(true);
                setChildren(1);
              }}
            >
              + {t("quote.addChildren")}
            </button>
          </div>
        )}
        <div className="field hotel-combo" ref={hotelWrapRef}>
          <label htmlFor="quote-hotel">{t("quote.hotel")}</label>
          <input
            id="quote-hotel"
            role="combobox"
            placeholder={t("quote.hotelPh")}
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
              <span>{t("quote.arrivalAirline")}</span>
              <input
                placeholder={t("quote.airlinePh")}
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t("quote.arrivalFlight")}</span>
              <input
                placeholder={t("quote.flightPh")}
                value={flight}
                onChange={(e) => setFlight(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t("quote.departureAirline")}</span>
              <input
                placeholder={t("quote.airlinePh")}
                value={returnAirline}
                onChange={(e) => setReturnAirline(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t("quote.departureFlight")}</span>
              <input
                placeholder={t("quote.flightPh")}
                value={returnFlight}
                onChange={(e) => setReturnFlight(e.target.value)}
                required
              />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>{t("quote.airline")}</span>
              <input
                placeholder={t("quote.airlinePh")}
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t("quote.flight")}</span>
              <input
                placeholder={t("quote.flightPh")}
                value={flight}
                onChange={(e) => setFlight(e.target.value)}
                required
              />
            </label>
          </>
        )}
        <label className="field">
          <span>{t("quote.fullName")}</span>
          <input
            placeholder={t("quote.fullNamePh")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="field">
          <span>{t("quote.email")}</span>
          <input
            type="email"
            placeholder={t("quote.emailPh")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="field quote-form__full">
          <span>{t("quote.whatsapp")}</span>
          <input
            type="tel"
            placeholder={t("quote.whatsappPh")}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            autoComplete="tel"
            required
          />
        </label>
      </div>
      {quoted && hotel.trim() && (
        <p className="quote-form__price">
          <span>{t("quote.priceLabel")}</span>
          <strong>US${quoted.price}</strong>
          <small>{quoted.vehicle.name}</small>
        </p>
      )}
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
        {submitting ? t("quote.sending") : t("quote.submit")}
      </button>
    </form>
  );
}
