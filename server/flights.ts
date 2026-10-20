import type { ApiResult } from "./authFlow.js";

const PUJ = "PUJ";
const ARRIVAL_BUFFER_MIN = 50;
const DEPARTURE_LEAD_MIN = 180;

type Airport = {
  iata?: string;
  fs?: string;
  name?: string;
  city?: string;
};

type RawFlight = {
  flightNote?: { canceled?: boolean; message?: string };
  schedule?: {
    scheduledDeparture?: string;
    scheduledDepartureUTC?: string;
    estimatedActualDeparture?: string;
    scheduledArrival?: string;
    scheduledArrivalUTC?: string;
    estimatedActualArrival?: string;
  };
  status?: { status?: string; statusDescription?: string };
  resultHeader?: {
    carrier?: { name?: string; fs?: string };
    flightNumber?: string;
  };
  operatedBy?: string;
  departureAirport?: Airport;
  arrivalAirport?: Airport;
};

export type FlightCard = {
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

function parseQuery(raw: string) {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z0-9]{2})(\d{1,4})$/);
  if (!match) return null;
  return { carrier: match[1], number: String(Number(match[2])) };
}

function clock(iso: string | undefined): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
}

function dayLabel(date: Date) {
  return date
    .toLocaleDateString("es-DO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(".", "")
    .toUpperCase();
}

function durationLabel(depUtc?: string, arrUtc?: string) {
  if (!depUtc || !arrUtc) return "";
  const minutes = Math.round(
    (new Date(arrUtc).getTime() - new Date(depUtc).getTime()) / 60_000,
  );
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function place(airport: Airport | undefined) {
  const iata = airport?.iata || airport?.fs || "";
  return {
    iata,
    city: airport?.city || iata,
    airport: airport?.name || airport?.city || iata,
  };
}

function asFlights(payload: unknown): RawFlight[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return data.filter((item) => item && typeof item === "object");
  if (data && typeof data === "object" && "departureAirport" in data) {
    return [data as RawFlight];
  }
  return [];
}

function toCard(raw: RawFlight): FlightCard | null {
  const departure = place(raw.departureAirport);
  const arrival = place(raw.arrivalAirport);
  const schedule = raw.schedule ?? {};
  const depAt = clock(schedule.estimatedActualDeparture || schedule.scheduledDeparture);
  const arrAt = clock(schedule.estimatedActualArrival || schedule.scheduledArrival);
  if (!depAt || !arrAt || !departure.iata || !arrival.iata) return null;

  const code = `${raw.resultHeader?.carrier?.fs || ""} ${raw.resultHeader?.flightNumber || ""}`.trim();
  const canceled = Boolean(raw.flightNote?.canceled);
  const arrivesPuj = arrival.iata === PUJ;
  const leavesPuj = departure.iata === PUJ;

  let transfer: FlightCard["transfer"];
  if (canceled) {
    transfer = {
      kind: "otro",
      title: "Vuelo cancelado",
      pickup: "—",
      note: "No programes el traslado hasta confirmar un vuelo nuevo.",
      steps: [{ title: "Cancelado", detail: raw.flightNote?.message || "La aerolínea canceló este vuelo." }],
    };
  } else if (arrivesPuj) {
    const ready = addMinutes(arrAt, ARRIVAL_BUFFER_MIN);
    transfer = {
      kind: "llegada",
      title: "Recogida en el aeropuerto",
      pickup: timeLabel(ready),
      note: "Unos 50 minutos después de aterrizar, cuando el pasajero sale de migración y equipaje.",
      steps: [
        { title: "Aterriza en PUJ", detail: timeLabel(arrAt) },
        { title: "Listo para recoger", detail: timeLabel(ready) },
        { title: "Traslado al hotel", detail: "Sale del aeropuerto hacia la zona reservada" },
      ],
    };
  } else if (leavesPuj) {
    const pickup = addMinutes(depAt, -DEPARTURE_LEAD_MIN);
    transfer = {
      kind: "salida",
      title: "Recogida en el hotel",
      pickup: timeLabel(pickup),
      note: "Tres horas antes de la salida, para llegar a PUJ con tiempo.",
      steps: [
        { title: "Sale del hotel", detail: timeLabel(pickup) },
        { title: "Llega al aeropuerto", detail: "Con margen para el check-in" },
        { title: `Sale ${code}`, detail: timeLabel(depAt) },
      ],
    };
  } else {
    transfer = {
      kind: "otro",
      title: "Sin traslado en PUJ",
      pickup: "—",
      note: "Este vuelo no sale ni llega a Punta Cana, así que no cambia la hora del traslado.",
      steps: [
        { title: departure.iata, detail: timeLabel(depAt) },
        { title: arrival.iata, detail: timeLabel(arrAt) },
      ],
    };
  }

  return {
    airline: raw.resultHeader?.carrier?.name || raw.operatedBy || "Aerolínea",
    code,
    status: canceled ? "Cancelado" : raw.status?.status || "Programado",
    detail: raw.status?.statusDescription || raw.flightNote?.message || "",
    dateLabel: dayLabel(depAt),
    duration: durationLabel(schedule.scheduledDepartureUTC, schedule.scheduledArrivalUTC),
    departure: { time: timeLabel(depAt), ...departure },
    arrival: { time: timeLabel(arrAt), ...arrival },
    transfer,
  };
}

export async function lookupFlights(body: Record<string, unknown>): Promise<ApiResult> {
  const parsed = parseQuery(String(body.flight || ""));
  const date = String(body.date || "");
  if (!parsed) {
    return { status: 400, body: { error: "Escribe el vuelo como B6 169 o AA1234." } };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return { status: 400, body: { error: "Elige la fecha del vuelo." } };
  }

  const url = `https://www.flightstats.com/v2/api-next/flight-tracker/${parsed.carrier}/${parsed.number}/${Number(match[1])}/${Number(match[2])}/${Number(match[3])}`;
  let payload: unknown;
  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "ErsunnyTravel/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return { status: 502, body: { error: "No se pudo consultar el horario del vuelo." } };
    }
    payload = await res.json();
  } catch {
    return { status: 502, body: { error: "La consulta del vuelo no respondió. Inténtalo de nuevo." } };
  }

  const flights = asFlights(payload).map(toCard).filter((item): item is FlightCard => Boolean(item));
  if (!flights.length) {
    return {
      status: 404,
      body: {
        error:
          "No hay horario publicado para ese vuelo en esa fecha. Prueba el código de la aerolínea y un día cercano.",
      },
    };
  }
  return { status: 200, body: { flights } };
}
