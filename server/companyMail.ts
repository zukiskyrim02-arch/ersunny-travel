import { Resend } from "resend";
import { parseReservationId } from "./paymentGuards.js";
import { databaseUrl } from "./rtdb.js";

type ReservationMail = {
  name?: string;
  contactInfo?: string;
  email?: string;
  origin?: string;
  destination?: string;
  date?: string;
  passengers?: number;
  vehicle?: string;
  price?: number;
  kind?: string;
  hotelPickup?: string;
  flight?: string;
};

function companyRecipients(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

/** Tell the company inbox that a reservation was paid. Failures stay out of the payment result. */
export async function notifyCompanyOfPayment(reservationId: string): Promise<void> {
  const id = parseReservationId(reservationId);
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.RESEND_FROM || "";
  const to = companyRecipients();
  const base = databaseUrl();
  if (!id || !key || !from || to.length === 0 || !base) return;

  const res = await fetch(`${base}/reservations/${encodeURIComponent(id)}.json`);
  if (!res.ok) return;
  const data = (await res.json()) as ReservationMail | null;
  if (!data) return;

  const result = await new Resend(key).emails.send({
    from,
    to,
    subject: `Pago recibido · ${id}`,
    text: [
      `Se recibió el pago de la reserva ${id}.`,
      "",
      `Cliente: ${data.name || "—"}`,
      `Contacto: ${data.contactInfo || "—"}`,
      `Correo: ${data.email || "—"}`,
      `Servicio: ${data.kind || "—"}`,
      `Ruta: ${data.origin || "—"} → ${data.destination || "—"}`,
      `Hotel: ${data.hotelPickup || "—"}`,
      `Fecha: ${data.date || "—"}`,
      `Pasajeros: ${data.passengers ?? "—"}`,
      `Vehículo: ${data.vehicle || "—"}`,
      `Precio: US$${data.price ?? "—"}`,
      `Vuelo: ${data.flight || "—"}`,
      "",
      `https://www.ersunnytravel.com/payment?id=${encodeURIComponent(id)}`,
    ].join("\n"),
  });
  if (result.error) throw new Error(result.error.message);
}
