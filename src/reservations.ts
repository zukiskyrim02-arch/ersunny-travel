export type ReservationKind = "transfer" | "excursion";

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
};

const STORAGE_KEY = "ersunny-reservations";

export function generateReservationId(kind: ReservationKind = "transfer") {
  const prefix = kind === "excursion" ? "EXC" : "EST";
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp.slice(-4)}${rand}`;
}

export function saveReservation(reservation: Reservation) {
  const all = listReservations();
  all.unshift(reservation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 40)));
}

export function listReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Reservation[]).map((r) => ({
      ...r,
      kind: r.kind ?? "transfer",
    }));
  } catch {
    return [];
  }
}

export function findReservation(id: string): Reservation | undefined {
  const normalized = id.trim().toUpperCase();
  return listReservations().find((r) => r.id.toUpperCase() === normalized);
}
