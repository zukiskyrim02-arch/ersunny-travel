import { useState, type FormEvent } from "react";

type FlightCard = {
  airline: string;
  code: string;
  status: string;
  detail: string;
  dateLabel: string;
  duration: string;
  departure: { time: string; iata: string; city: string; airport: string };
  arrival: { time: string; iata: string; city: string; airport: string };
  transfer: {
    kind: "llegada" | "salida" | "otro";
    title: string;
    pickup: string;
    note: string;
    steps: { title: string; detail: string }[];
  };
};

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function FlightsPanel() {
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flights, setFlights] = useState<FlightCard[]>([]);
  const [selected, setSelected] = useState(0);

  async function search(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flight, date }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        flights?: FlightCard[];
      };
      if (!res.ok || !body.flights?.length) {
        setFlights([]);
        setError(body.error || "No se pudo buscar el vuelo.");
        return;
      }
      setFlights(body.flights);
      setSelected(0);
    } catch {
      setError("No se pudo buscar el vuelo.");
    } finally {
      setBusy(false);
    }
  }

  const current = flights[selected] ?? flights[0];

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Vuelos</h1>
          <p>
            Consulta el horario real y calcula la recogida si el vuelo entra o
            sale de Punta Cana.
          </p>
        </div>
      </header>

      <form className="admin-flight-search" onSubmit={(event) => void search(event)}>
        <label>
          Número de vuelo
          <input
            value={flight}
            placeholder="B6 169"
            onChange={(event) => setFlight(event.target.value)}
            required
          />
        </label>
        <label>
          Fecha
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}

      {current && (
        <div className="admin-flight-layout">
          <div className="admin-flight-list">
            {flights.map((item, index) => (
              <article
                key={`${item.code}-${item.departure.time}-${index}`}
                className={`admin-flight${index === selected ? " is-on" : ""}`}
              >
                <p className="admin-flight__date">{item.dateLabel}</p>
                <div className="admin-flight__route">
                  <div>
                    <strong>{item.departure.time}</strong>
                    <small>
                      {item.departure.city}, {item.departure.iata}
                    </small>
                  </div>
                  <div className="admin-flight__line" aria-hidden>
                    <span />
                    <small>{item.duration || item.status}</small>
                    <span />
                  </div>
                  <div>
                    <strong>{item.arrival.time}</strong>
                    <small>
                      {item.arrival.city}, {item.arrival.iata}
                    </small>
                  </div>
                  <div className="admin-flight__pick">
                    <b>{item.transfer.pickup}</b>
                    <small>{item.transfer.title}</small>
                    <button type="button" onClick={() => setSelected(index)}>
                      Ver
                    </button>
                  </div>
                </div>
                <p className="admin-flight__meta">
                  {item.airline} {item.code}
                  {item.detail ? ` · ${item.detail}` : ""}
                </p>
              </article>
            ))}
          </div>

          <aside className="admin-card admin-flight-plan">
            <div className="admin-card__head">
              <h2>Cálculo del traslado</h2>
            </div>
            <p className="admin-flight-plan__pickup">{current.transfer.pickup}</p>
            <p className="admin-muted">{current.transfer.note}</p>
            <ol>
              {current.transfer.steps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </section>
  );
}
