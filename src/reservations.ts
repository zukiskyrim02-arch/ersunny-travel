export type ReservationKind = "transfer" | "excursion";

export type ReservationStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled";

export type Reservation = {
  id: string;
  kind: ReservationKind;
  name: string;
  contactInfo: string;
  /** Customer email when captured at booking (preferred over parsing contactInfo). */
  email?: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  vehicle: string;
  wantReturn: boolean;
  price: number | null;
  flight?: string;
  notes?: string;
  hotelPickup?: string;
  createdAt: string;
  status?: ReservationStatus;
  pickupTime?: string;
  /** Customer acknowledged the staff-confirmed pickup time. */
  customerConfirmed?: boolean;
  /** When the post-service survey email was sent. */
  surveySentAt?: string;
  /** Cardnet AuthorizationCode from the consulta GET. The card number is never stored. */
  authorizationCode?: string;
};

import { dbGet, dbRemove, dbSet, dbSetAsync, dbSubscribe } from "./firebase";

const STORAGE_KEY = "ersunny-reservations";

function reservationKey(id: string): string {
  return id.trim().toUpperCase();
}

function pushReservation(reservation: Reservation) {
  dbSet(`reservations/${reservationKey(reservation.id)}`, reservation);
}

/** Write the reservation and wait, so a payment can read the same price. */
export async function ensureReservationSaved(reservation: Reservation): Promise<void> {
  await dbSetAsync(`reservations/${reservationKey(reservation.id)}`, reservation);
}

export function getReservationEmail(reservation: Reservation): string | undefined {
  const direct = reservation.email?.trim();
  if (direct && direct.includes("@")) return direct;
  const match = reservation.contactInfo.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  return match?.[0];
}

/** Compact reservation for staff email links (survives opening on another device). */
export type StaffReservationPayload = Pick<
  Reservation,
  | "id"
  | "kind"
  | "name"
  | "contactInfo"
  | "email"
  | "origin"
  | "destination"
  | "date"
  | "time"
  | "returnDate"
  | "returnTime"
  | "passengers"
  | "vehicle"
  | "wantReturn"
  | "price"
  | "flight"
  | "notes"
  | "hotelPickup"
  | "createdAt"
  | "status"
  | "pickupTime"
>;

export function encodeStaffPayload(reservation: Reservation): string {
  const slim: StaffReservationPayload = {
    id: reservation.id,
    kind: reservation.kind,
    name: reservation.name,
    contactInfo: reservation.contactInfo,
    email: reservation.email,
    origin: reservation.origin,
    destination: reservation.destination,
    date: reservation.date,
    time: reservation.time,
    returnDate: reservation.returnDate,
    returnTime: reservation.returnTime,
    passengers: reservation.passengers,
    vehicle: reservation.vehicle,
    wantReturn: reservation.wantReturn,
    price: reservation.price,
    flight: reservation.flight,
    notes: reservation.notes,
    hotelPickup: reservation.hotelPickup,
    createdAt: reservation.createdAt,
    status: reservation.status,
    pickupTime: reservation.pickupTime,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
}

export function decodeStaffPayload(encoded: string): StaffReservationPayload | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json) as StaffReservationPayload;
    if (!data?.id || !data?.name) return null;
    return data;
  } catch {
    return null;
  }
}

export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "https://www.ersunnytravel.com";
}

/** Link in the company payment email → staff sets pickup times. */
export function staffPickupFormUrl(reservation: Reservation): string {
  const payload = encodeStaffPayload(reservation);
  return `${siteOrigin()}/admin/pickup?id=${encodeURIComponent(reservation.id)}&r=${encodeURIComponent(payload)}`;
}

/** Link emailed to the customer after staff sets times → they confirm. */
export function customerConfirmPickupUrl(reservation: Reservation): string {
  const payload = encodeStaffPayload(reservation);
  return `${siteOrigin()}/confirm-pickup?id=${encodeURIComponent(reservation.id)}&r=${encodeURIComponent(payload)}`;
}

export function upsertReservation(reservation: Reservation): Reservation {
  const all = listReservations();
  const idx = all.findIndex(
    (r) => r.id.toUpperCase() === reservation.id.trim().toUpperCase(),
  );
  const next: Reservation = {
    status: "pending",
    ...reservation,
  };
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...next, id: all[idx].id };
    writeAll(all);
    pushReservation(all[idx]);
    return all[idx];
  }
  all.unshift(next);
  writeAll(all);
  pushReservation(next);
  return next;
}

export function generateReservationId(kind: ReservationKind = "transfer") {
  const prefix = kind === "excursion" ? "EXC" : "EST";
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp.slice(-4)}${rand}`;
}

function writeAll(all: Reservation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 200)));
  window.dispatchEvent(new Event("ersunny-reservations"));
}

export function saveReservation(reservation: Reservation) {
  const all = listReservations();
  const withStatus: Reservation = {
    status: "pending",
    ...reservation,
  };
  all.unshift(withStatus);
  writeAll(all);
  pushReservation(withStatus);
}

export function listReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Reservation[]).map((r) => ({
      ...r,
      kind: r.kind ?? "transfer",
      status: r.status ?? "pending",
    }));
  } catch {
    return [];
  }
}

export function findReservation(id: string): Reservation | undefined {
  const normalized = id.trim().toUpperCase();
  return listReservations().find((r) => r.id.toUpperCase() === normalized);
}

export function updateReservation(
  id: string,
  patch: Partial<Reservation>,
): Reservation | undefined {
  const all = listReservations();
  const idx = all.findIndex((r) => r.id.toUpperCase() === id.trim().toUpperCase());
  if (idx < 0) return undefined;
  all[idx] = { ...all[idx], ...patch, id: all[idx].id };
  writeAll(all);
  pushReservation(all[idx]);
  return all[idx];
}

export function deleteReservation(id: string) {
  const all = listReservations().filter(
    (r) => r.id.toUpperCase() !== id.trim().toUpperCase(),
  );
  writeAll(all);
  dbRemove(`reservations/${reservationKey(id)}`);
}

/* ── Firebase Realtime Database sync ────────────────────────────── */

let reservationsSyncStarted = false;

/** Fetch one reservation from Firebase and cache it locally. */
export async function fetchReservationFromFirebase(
  id: string,
): Promise<Reservation | undefined> {
  const remote = await dbGet<Reservation>(
    `reservations/${reservationKey(id)}`,
  );
  if (!remote?.id) return undefined;
  const normalized: Reservation = {
    ...remote,
    kind: remote.kind ?? "transfer",
    status: remote.status ?? "pending",
  };
  const all = listReservations();
  const idx = all.findIndex(
    (r) => reservationKey(r.id) === reservationKey(normalized.id),
  );
  if (idx >= 0) all[idx] = { ...all[idx], ...normalized, id: all[idx].id };
  else all.unshift(normalized);
  writeAll(all);
  return normalized;
}

/**
 * Live sync: Firebase → local cache. If Firebase is empty and this
 * device has local reservations, they are uploaded (first migration).
 */
export function startReservationsSync(): () => void {
  if (reservationsSyncStarted) return () => undefined;
  reservationsSyncStarted = true;
  const stop = dbSubscribe("reservations", (value) => {
    if (!value || typeof value !== "object") {
      for (const r of listReservations()) pushReservation(r);
      return;
    }
    const remote = Object.values(value as Record<string, Reservation>)
      .filter((r) => r?.id)
      .map((r) => ({
        ...r,
        kind: r.kind ?? ("transfer" as const),
        status: r.status ?? ("pending" as const),
      }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (remote.length) writeAll(remote);
  });
  return () => {
    stop();
    reservationsSyncStarted = false;
  };
}
