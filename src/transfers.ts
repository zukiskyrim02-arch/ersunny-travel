import type { Zone } from "./data";
import type { AppConfig, ManagedVehicle } from "./store/config";

export const TRANSFER_ZONES: Zone[] = [
  "Punta Cana",
  "Bávaro",
  "Macao",
  "Playa Esmeralda",
];

/** Catalog round-trip base prices (1–4 passengers) by destination zone. */
export const ZONE_ROUND_TRIP: Record<string, number> = {
  "Punta Cana": 83,
  Bávaro: 83,
  Macao: 94,
  "Playa Esmeralda": 224,
};

/** Passengers covered by the base zone price. */
export const BASE_INCLUDED_PASSENGERS = 4;

/** Extra USD charged per passenger above 4, per way (leg). */
export const EXTRA_PER_WAY_USD = 5;

/** One way = half the round trip + US$5 (e.g. 83 → 41.5 + 5 = 46.5). */
export function oneWayFromRoundTrip(roundTrip: number) {
  return Math.max(0, Math.round((roundTrip / 2 + 5) * 100) / 100);
}

function money2(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

export function zonesOf(config: {
  zones?: string[];
  hotelsByZone?: Record<string, string[] | undefined>;
}): string[] {
  const named = (config.zones ?? []).map((zone) => zone.trim()).filter(Boolean);
  const source = named.length ? named : Object.keys(config.hotelsByZone ?? {});
  const unique = [...new Set(source)];
  return unique.length ? unique : [...TRANSFER_ZONES];
}

export type TransferFare = {
  /** Base price covering up to `includedPassengers` on the vehicle. */
  oneWay: number;
  roundTrip: number;
  /** Extra charge per passenger above the included base. */
  extraOneWay: number;
  extraRoundTrip: number;
  sharedOneWay: number;
  sharedRoundTrip: number;
};

export type TransferRates = Record<string, TransferFare>;

export function rateKey(vehicleId: string, zone: Zone) {
  return `${vehicleId}::${zone}`;
}

export function defaultFare(
  basePrice: number,
  zoneSurcharge = 0,
  zone?: string,
): TransferFare {
  const catalogRt = zone ? ZONE_ROUND_TRIP[zone] : undefined;
  const roundTrip =
    catalogRt ?? Math.round(Math.max(0, basePrice + zoneSurcharge) * 1.9);
  const oneWay =
    catalogRt != null
      ? oneWayFromRoundTrip(catalogRt)
      : Math.max(0, Math.round(basePrice + zoneSurcharge));
  return {
    oneWay,
    roundTrip,
    extraOneWay: EXTRA_PER_WAY_USD,
    extraRoundTrip: EXTRA_PER_WAY_USD * 2,
    sharedOneWay: Math.round(oneWay * 0.75),
    sharedRoundTrip: Math.round(roundTrip * 0.75),
  };
}

export function normalizeFare(
  fare: Partial<TransferFare> | undefined,
  fallback: TransferFare,
): TransferFare {
  return {
    oneWay: Math.max(0, Number(fare?.oneWay ?? fallback.oneWay) || 0),
    roundTrip: Math.max(0, Number(fare?.roundTrip ?? fallback.roundTrip) || 0),
    extraOneWay: Math.max(0, Number(fare?.extraOneWay ?? fallback.extraOneWay) || 0),
    extraRoundTrip: Math.max(
      0,
      Number(fare?.extraRoundTrip ?? fallback.extraRoundTrip) || 0,
    ),
    sharedOneWay: Math.max(
      0,
      Number(fare?.sharedOneWay ?? fallback.sharedOneWay) || 0,
    ),
    sharedRoundTrip: Math.max(
      0,
      Number(fare?.sharedRoundTrip ?? fallback.sharedRoundTrip) || 0,
    ),
  };
}

export function includedPassengersOf(vehicle: ManagedVehicle | undefined) {
  const max = Math.max(1, vehicle?.maxPassengers ?? 1);
  const included = Math.max(
    1,
    vehicle?.includedPassengers ?? Math.min(BASE_INCLUDED_PASSENGERS, max),
  );
  return Math.min(included, max, BASE_INCLUDED_PASSENGERS);
}

/** Private transfer total for a passenger count. */
export function transferPrice(
  fare: TransferFare,
  vehicle: ManagedVehicle | undefined,
  passengers: number,
  roundTrip: boolean,
) {
  const included = includedPassengersOf(vehicle);
  const pax = Math.max(0, Math.floor(passengers));
  const extras = Math.max(0, pax - included);
  const base = roundTrip ? fare.roundTrip : fare.oneWay;
  // Always charge EXTRA_PER_WAY_USD per extra passenger, per leg.
  const perExtra = roundTrip ? EXTRA_PER_WAY_USD * 2 : EXTRA_PER_WAY_USD;
  return money2(base + extras * perExtra);
}

export function buildTransferRates(
  vehicles: ManagedVehicle[],
  zoneSurcharge: Record<Zone, number>,
  existing?: TransferRates,
  zones: string[] = TRANSFER_ZONES,
): TransferRates {
  const rates: TransferRates = {};
  for (const vehicle of vehicles) {
    for (const zone of zones) {
      const key = rateKey(vehicle.id, zone);
      const fallback = defaultFare(
        vehicle.basePrice,
        zoneSurcharge[zone] ?? 0,
        zone,
      );
      const merged = normalizeFare(existing?.[key], fallback);
      // Keep catalog prices for known destination zones.
      if (ZONE_ROUND_TRIP[zone] != null) {
        merged.roundTrip = ZONE_ROUND_TRIP[zone];
        merged.oneWay = oneWayFromRoundTrip(ZONE_ROUND_TRIP[zone]);
        merged.extraOneWay = EXTRA_PER_WAY_USD;
        merged.extraRoundTrip = EXTRA_PER_WAY_USD * 2;
      }
      rates[key] = merged;
    }
  }
  return rates;
}

export function zoneForHotel(
  hotelsByZone: Record<string, string[] | undefined>,
  hotel: string,
): Zone | null {
  const name = hotel.trim().toLowerCase();
  if (!name) return null;
  for (const [zone, hotels] of Object.entries(hotelsByZone)) {
    if (hotels?.some((item) => item.toLowerCase() === name)) return zone;
  }
  return null;
}

export function fareFor(
  config: AppConfig,
  vehicleId: string,
  zone: Zone,
): TransferFare {
  const vehicle = config.vehicles.find((item) => item.id === vehicleId);
  const fallback = defaultFare(
    vehicle?.basePrice ?? 0,
    config.zoneSurcharge[zone] ?? 0,
  );
  return normalizeFare(config.transferRates[rateKey(vehicleId, zone)], fallback);
}

export function quoteTransfer(
  config: AppConfig,
  vehicleId: string,
  zone: Zone,
  passengers: number,
  roundTrip: boolean,
) {
  const vehicle = config.vehicles.find((item) => item.id === vehicleId);
  return transferPrice(fareFor(config, vehicleId, zone), vehicle, passengers, roundTrip);
}
