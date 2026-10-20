import type { Zone } from "./data";
import type { AppConfig, ManagedVehicle } from "./store/config";

export const TRANSFER_ZONES: Zone[] = ["Punta Cana", "Bávaro", "Macao"];

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
  oneWay: number;
  roundTrip: number;
  sharedOneWay: number;
  sharedRoundTrip: number;
};

export type TransferRates = Record<string, TransferFare>;

export function rateKey(vehicleId: string, zone: Zone) {
  return `${vehicleId}::${zone}`;
}

export function defaultFare(basePrice: number, zoneSurcharge = 0): TransferFare {
  const oneWay = Math.max(0, Math.round(basePrice + zoneSurcharge));
  const roundTrip = Math.round(oneWay * 1.9);
  return {
    oneWay,
    roundTrip,
    sharedOneWay: Math.round(oneWay * 0.75),
    sharedRoundTrip: Math.round(roundTrip * 0.75),
  };
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
      rates[key] =
        existing?.[key] ??
        defaultFare(vehicle.basePrice, zoneSurcharge[zone] ?? 0);
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
  const stored = config.transferRates[rateKey(vehicleId, zone)];
  return (
    stored ??
    defaultFare(vehicle?.basePrice ?? 0, config.zoneSurcharge[zone] ?? 0)
  );
}
