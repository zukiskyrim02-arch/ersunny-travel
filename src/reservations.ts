export type ReservationKind = "transfer" | "excursion";

export type ReservationStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "cancelled";

export type Reservation = {
  id: string;
  kind: ReservationKind;
  name: string;
  contactInfo: string;
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
};

const STORAGE_KEY = "ersunny-reservations";

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
  return all[idx];
}

export function deleteReservation(id: string) {
  const all = listReservations().filter(
    (r) => r.id.toUpperCase() !== id.trim().toUpperCase(),
  );
  writeAll(all);
}
