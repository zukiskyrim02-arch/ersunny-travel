import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { contact, hotelsByZone } from "./data";

const hotels = [
  ...hotelsByZone["Punta Cana"],
  ...hotelsByZone.Bávaro,
  ...hotelsByZone.Macao,
];

export function QuoteForm() {
  const [service, setService] = useState("Private Transfer");
  const [transferType, setTransferType] = useState("Airport → Hotel");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("2 Adults");
  const [hotel, setHotel] = useState("");
  const [flight, setFlight] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [hotelOpen, setHotelOpen] = useState(false);
  const hotelWrapRef = useRef<HTMLDivElement>(null);

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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const lines = [
      "Hi Ersunny Travel, I'd like a quote:",
      `• Service: ${service}`,
      `• Type: ${transferType}`,
      `• Date: ${date || "To be confirmed"}`,
      `• Passengers: ${passengers}`,
      `• Hotel/destination: ${hotel || "—"}`,
      `• Flight: ${flight || "—"}`,
      `• WhatsApp: ${whatsapp || "—"}`,
    ];
    const url = `https://wa.me/${contact.whatsappDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form className="quote-form" onSubmit={onSubmit}>
      <h3>Request your quote</h3>
      <div className="quote-form__grid">
        <label className="field">
          <span>Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)}>
            <option>Private Transfer</option>
            <option>Excursion</option>
            <option>Round trip</option>
          </select>
        </label>
        <label className="field">
          <span>Transfer type</span>
          <select
            value={transferType}
            onChange={(e) => setTransferType(e.target.value)}
          >
            <option>Airport → Hotel</option>
            <option>Hotel → Airport</option>
            <option>Hotel → Hotel</option>
          </select>
        </label>
        <label className="field">
          <span>Pickup / Drop-off</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Passengers</span>
          <select
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
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
            placeholder="e.g. Paradisus Palma Real"
            value={hotel}
            autoComplete="off"
            required
            aria-autocomplete="list"
            aria-expanded={hotelOpen}
            onFocus={() => setHotelOpen(true)}
            onChange={(e) => {
              setHotel(e.target.value);
              setHotelOpen(true);
            }}
          />
          {hotelOpen && hotelMatches.length > 0 && (
            <ul className="hotel-combo__list" role="listbox">
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
        <label className="field">
          <span>Flight number (optional)</span>
          <input
            placeholder="e.g. AA123"
            value={flight}
            onChange={(e) => setFlight(e.target.value)}
          />
        </label>
        <label className="field quote-form__full">
          <span>WhatsApp</span>
          <input
            type="tel"
            placeholder="+1 809…"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
          />
        </label>
      </div>
      <button className="btn-blue quote-form__submit" type="submit">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
        </svg>
        Request Quote
      </button>
    </form>
  );
}
