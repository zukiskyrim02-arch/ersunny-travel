import { databaseUrl } from "./rtdb.js";
import { parseAmountUsd, parseReservationId } from "./paymentGuards.js";

/** Public read of the price the customer was quoted. Fails closed when it is missing. */
export async function readReservationPrice(
  reservationId: string,
): Promise<number | null> {
  const id = parseReservationId(reservationId);
  const base = databaseUrl();
  if (!id || !base) return null;
  const res = await fetch(
    `${base}/reservations/${encodeURIComponent(id)}.json`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { price?: unknown } | null;
  return parseAmountUsd(data?.price);
}
