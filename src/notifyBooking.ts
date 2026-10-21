import {
  customerConfirmPickupUrl,
  getReservationEmail,
  type Reservation,
} from "./reservations";

type Notice = "request" | "paid" | "pickup" | "confirmed";

/** Designed company and customer mail. FormSubmit's gray table is not used. */
async function sendDesignedNotice(
  notice: Notice,
  reservation: Reservation,
  confirmUrl = "",
): Promise<void> {
  const res = await fetch("/api/cardnet/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      intent: "booking-email",
      notice,
      reservationId: reservation.id,
      name: reservation.name,
      contactInfo: reservation.contactInfo,
      email: getReservationEmail(reservation) || "",
      origin: reservation.origin,
      destination: reservation.destination,
      date: reservation.date,
      returnDate: reservation.returnDate || "",
      passengers: reservation.passengers,
      vehicle: reservation.vehicle,
      price: reservation.price,
      kind: reservation.kind,
      hotelPickup: reservation.hotelPickup || "",
      flight: reservation.flight || "",
      notes: reservation.notes || "",
      pickupTime: reservation.pickupTime || "",
      returnTime: reservation.returnTime || "",
      confirmUrl,
    }),
  });
  if (!res.ok) throw new Error("Could not send confirmation email.");
}

/** New transfer request → company inbox and customer. */
export async function sendTransferBookingEmails(
  reservation: Reservation,
  _extras?: unknown,
): Promise<void> {
  await sendDesignedNotice("request", reservation);
}

/**
 * Paid notices are sent by the server when the charge is confirmed.
 * Calling FormSubmit here used to deliver the gray table.
 */
export async function sendPaidBookingEmails(
  _reservation: Reservation,
): Promise<void> {
  return;
}

/** Staff saved times → customer confirm link, with a copy to the company. */
export async function sendPickupTimesToCustomer(
  reservation: Reservation,
): Promise<void> {
  await sendDesignedNotice("pickup", reservation, customerConfirmPickupUrl(reservation));
}

/** Customer confirmed the assigned schedule. */
export async function sendCustomerConfirmedPickup(
  reservation: Reservation,
): Promise<void> {
  await sendDesignedNotice("confirmed", reservation);
}
