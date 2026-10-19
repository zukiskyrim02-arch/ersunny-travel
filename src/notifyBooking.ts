import {
  customerBookingReceivedEmail,
  customerPaymentConfirmEmail,
  customerPickupReadyEmail,
} from "./emailTemplates";
import { getSiteContact } from "./store/config";
import {
  customerConfirmPickupUrl,
  getReservationEmail,
  staffPickupFormUrl,
  type Reservation,
} from "./reservations";

type NotifyPayload = Record<string, string>;

/** Notify company inbox with booking details (FormSubmit, no backend required). */
export async function sendBookingNotification(
  payload: NotifyPayload,
): Promise<void> {
  const contact = getSiteContact();
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
        _template: "box",
        _captcha: "false",
        ...payload,
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Could not send confirmation email.");
  }
}

function withCustomerEmail(
  reservation: Reservation,
  autoresponseHtml: string,
): NotifyPayload {
  const customerEmail = getReservationEmail(reservation);
  if (!customerEmail) return {};
  return {
    email: customerEmail,
    replyto: customerEmail,
    _autoresponse: autoresponseHtml,
  };
}

/** New transfer request → staff inbox + styled customer confirmation. */
export async function sendTransferBookingEmails(
  reservation: Reservation,
  extras: {
    service: string;
    transferType: string;
    adults: string;
    children: string;
    whatsapp: string;
    arrivalAirline: string;
    arrivalFlight: string;
    departureAirline?: string;
    departureFlight?: string;
  },
): Promise<void> {
  const contact = getSiteContact();
  const customerEmail = getReservationEmail(reservation) ?? "";

  await sendBookingNotification({
    _subject: `New transfer booking · ${reservation.id}`,
    Guest: reservation.name,
    Email: customerEmail || "not provided",
    WhatsApp: extras.whatsapp,
    "Reservation ID": reservation.id,
    Service: extras.service,
    "Transfer type": extras.transferType,
    Route: `${reservation.origin} → ${reservation.destination}`,
    Date: reservation.date,
    "Return date": reservation.returnDate ?? "—",
    Adults: extras.adults,
    Children: extras.children,
    Passengers: String(reservation.passengers),
    Hotel: reservation.hotelPickup ?? "—",
    Vehicle: reservation.vehicle,
    "Price (USD)":
      reservation.price != null ? String(reservation.price) : "TBC",
    "Arrival airline": extras.arrivalAirline,
    "Arrival flight": extras.arrivalFlight,
    "Departure airline": extras.departureAirline ?? "—",
    "Departure flight": extras.departureFlight ?? "—",
    ...withCustomerEmail(
      reservation,
      customerBookingReceivedEmail(reservation, contact),
    ),
  });
}

/** After payment: company gets all data + link/button to set pickup times. */
export async function sendPaidBookingEmails(
  reservation: Reservation,
): Promise<void> {
  const contact = getSiteContact();
  const customerEmail = getReservationEmail(reservation);
  const setPickupLink = staffPickupFormUrl(reservation);

  await sendBookingNotification({
    _subject: `Paid booking ${reservation.id} — set pickup times`,
    Status: "Paid",
    Guest: reservation.name,
    Email: customerEmail ?? "not provided",
    Contact: reservation.contactInfo,
    "Reservation ID": reservation.id,
    Service: reservation.notes ?? reservation.kind,
    Route: `${reservation.origin} → ${reservation.destination}`,
    Date: reservation.date,
    "Return date": reservation.returnDate ?? "—",
    Passengers: String(reservation.passengers),
    Vehicle: reservation.vehicle,
    "Price (USD)":
      reservation.price != null ? String(reservation.price) : "—",
    Flight: reservation.flight ?? "—",
    "Round trip": reservation.wantReturn ? "Yes" : "No",
    "Set pickup times": setPickupLink,
    ...withCustomerEmail(
      reservation,
      customerPaymentConfirmEmail(reservation, contact),
    ),
  });
}

/** Staff saved times → email customer a confirm link; copy to company. */
export async function sendPickupTimesToCustomer(
  reservation: Reservation,
): Promise<void> {
  const contact = getSiteContact();
  const customerEmail = getReservationEmail(reservation);
  const confirmLink = customerConfirmPickupUrl(reservation);
  const pickup = `${reservation.date} at ${reservation.pickupTime}`;
  const returnPickup =
    reservation.wantReturn && reservation.returnDate
      ? `${reservation.returnDate} at ${reservation.returnTime}`
      : "—";

  await sendBookingNotification({
    _subject: `Pickup times set · ${reservation.id}`,
    Guest: reservation.name,
    Email: customerEmail ?? "not provided",
    "Reservation ID": reservation.id,
    Pickup: pickup,
    Return: returnPickup,
    "Customer confirm link": confirmLink,
    ...withCustomerEmail(
      reservation,
      customerPickupReadyEmail(reservation, confirmLink, contact),
    ),
  });
}

/** Customer clicked confirm on the assigned schedule. */
export async function sendCustomerConfirmedPickup(
  reservation: Reservation,
): Promise<void> {
  const customerEmail = getReservationEmail(reservation);
  await sendBookingNotification({
    _subject: `Customer confirmed pickup · ${reservation.id}`,
    Guest: reservation.name,
    Email: customerEmail ?? "not provided",
    Contact: reservation.contactInfo,
    "Reservation ID": reservation.id,
    Pickup: `${reservation.date} · ${reservation.pickupTime}`,
    Return:
      reservation.wantReturn && reservation.returnDate
        ? `${reservation.returnDate} · ${reservation.returnTime}`
        : "—",
    ...(customerEmail ? { email: customerEmail, replyto: customerEmail } : {}),
  });
}
