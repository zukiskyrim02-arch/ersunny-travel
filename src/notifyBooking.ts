import { contact } from "./data";
import {
  customerConfirmPickupUrl,
  getReservationEmail,
  staffPickupFormUrl,
  type Reservation,
} from "./reservations";

/** Notify company inbox with booking details (FormSubmit, no backend required). */
export async function sendBookingNotification(
  payload: Record<string, string>,
): Promise<void> {
  const res = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(contact.email)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: payload._subject || "New Ersunny Travel booking",
        _template: "table",
        _captcha: "false",
        ...payload,
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Could not send confirmation email.");
  }
}

/** After payment: company gets all data + link/button to set pickup times. */
export async function sendPaidBookingEmails(
  reservation: Reservation,
): Promise<void> {
  const customerEmail = getReservationEmail(reservation);
  const setPickupLink = staffPickupFormUrl(reservation);

  await sendBookingNotification({
    _subject: `Paid booking ${reservation.id} — SET PICKUP TIMES`,
    reservation_id: reservation.id,
    status: "paid",
    customer_name: reservation.name,
    customer_email: customerEmail ?? "not provided",
    contact: reservation.contactInfo,
    service: reservation.notes ?? reservation.kind,
    date: reservation.date,
    return_date: reservation.returnDate ?? "N/A",
    route: `${reservation.origin} → ${reservation.destination}`,
    passengers: String(reservation.passengers),
    vehicle: reservation.vehicle,
    price_usd: reservation.price != null ? String(reservation.price) : "N/A",
    flight: reservation.flight ?? "N/A",
    round_trip: reservation.wantReturn ? "yes" : "no",
    SET_PICKUP_TIMES_LINK: setPickupLink,
    ...(customerEmail
      ? {
          email: customerEmail,
          replyto: customerEmail,
          _autoresponse: [
            `Hi ${reservation.name},`,
            ``,
            `Your payment for reservation ${reservation.id} was received. Thank you!`,
            ``,
            `Route: ${reservation.origin} → ${reservation.destination}`,
            `Date: ${reservation.date}${reservation.returnDate ? ` · Return: ${reservation.returnDate}` : ""}`,
            ``,
            `Ersunny Travel will confirm your pickup time and email you a link to confirm it.`,
            ``,
            `Ersunny Travel`,
            contact.email,
            contact.whatsapp,
          ].join("\n"),
        }
      : {}),
  });
}

/** Staff saved times → email customer a confirm link; copy to company. */
export async function sendPickupTimesToCustomer(
  reservation: Reservation,
): Promise<void> {
  const customerEmail = getReservationEmail(reservation);
  const confirmLink = customerConfirmPickupUrl(reservation);
  const schedule = [
    `Pickup: ${reservation.date} at ${reservation.pickupTime}`,
    reservation.wantReturn && reservation.returnDate
      ? `Return: ${reservation.returnDate} at ${reservation.returnTime}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendBookingNotification({
    _subject: `Pickup times set — ${reservation.id}`,
    reservation_id: reservation.id,
    customer_name: reservation.name,
    customer_email: customerEmail ?? "not provided",
    schedule,
    customer_confirm_link: confirmLink,
    ...(customerEmail
      ? {
          email: customerEmail,
          replyto: customerEmail,
          _autoresponse: [
            `Hi ${reservation.name},`,
            ``,
            `Your pickup schedule for reservation ${reservation.id} is ready:`,
            ``,
            schedule,
            ``,
            `Please confirm here:`,
            confirmLink,
            ``,
            `Ersunny Travel`,
            contact.email,
            contact.whatsapp,
          ].join("\n"),
        }
      : {}),
  });
}

/** Customer clicked confirm on the assigned schedule. */
export async function sendCustomerConfirmedPickup(
  reservation: Reservation,
): Promise<void> {
  const customerEmail = getReservationEmail(reservation);
  await sendBookingNotification({
    _subject: `Customer confirmed pickup — ${reservation.id}`,
    reservation_id: reservation.id,
    customer_name: reservation.name,
    customer_email: customerEmail ?? "not provided",
    contact: reservation.contactInfo,
    pickup: `${reservation.date} · ${reservation.pickupTime}`,
    return_pickup:
      reservation.wantReturn && reservation.returnDate
        ? `${reservation.returnDate} · ${reservation.returnTime}`
        : "N/A",
    ...(customerEmail ? { email: customerEmail, replyto: customerEmail } : {}),
  });
}
