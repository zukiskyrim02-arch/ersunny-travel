import { Resend } from "resend";
import { formatDisplayDate, formatDisplayTime } from "../shared/datetime.js";
import { parseAmountUsd, parseEmail, parseReservationId } from "./paymentGuards.js";
import { databaseUrl } from "./rtdb.js";

export type BookingNotice = "request" | "paid" | "pickup" | "confirmed";

type ReservationMail = {
  id?: string;
  name?: string;
  contactInfo?: string;
  email?: string;
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  passengers?: number;
  vehicle?: string;
  price?: number | null;
  kind?: string;
  hotelPickup?: string;
  flight?: string;
  notes?: string;
  pickupTime?: string;
  returnTime?: string;
};

function companyRecipients(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function clip(value: unknown, max = 180): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  if (!value.trim()) return "";
  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #e7eef6;color:#64748b;font-size:13px;width:34%;vertical-align:top;">${esc(label)}</td>
<td style="padding:10px 0;border-bottom:1px solid #e7eef6;color:#0f172a;font-size:14px;font-weight:650;vertical-align:top;">${esc(value)}</td>
</tr>`;
}

function shell(opts: {
  eyebrow: string;
  title: string;
  intro: string;
  rows: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<p style="margin:26px 0 0;"><a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:#0b57d0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:12px;">${esc(opts.ctaLabel)}</a></p>`
      : "";
  return `<div style="margin:0;padding:0;background:#f3f6fb;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6edf5;">
<tr><td style="background:#0b1f3a;padding:26px 28px;">
<p style="margin:0 0 8px;color:#f5c542;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${esc(opts.eyebrow)}</p>
<p style="margin:0;color:#ffffff;font-size:22px;font-weight:750;letter-spacing:-0.03em;">Ersunny Travel</p>
<p style="margin:8px 0 0;color:#dbe7f5;font-size:16px;line-height:1.4;">${esc(opts.title)}</p>
</td></tr>
<tr><td style="padding:26px 28px 8px;">
<p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.55;">${esc(opts.intro)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${opts.rows}</table>
${cta}
</td></tr>
<tr><td style="padding:8px 28px 26px;">
<p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e7eef6;color:#94a3b8;font-size:12px;line-height:1.5;">Punta Cana · Bávaro · Macao<br>contact@ersunnytravel.com</p>
</td></tr>
</table>
</td></tr>
</table>
</div>`;
}

function money(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return "";
  return `US$${price}`;
}

function detailRows(data: ReservationMail, id: string): string {
  const route = [data.origin, data.destination].filter(Boolean).join(" → ");
  const date = formatDisplayDate(data.date);
  const returnDate = formatDisplayDate(data.returnDate);
  return [
    row("Booking reference", id),
    row("Guest", clip(data.name, 80)),
    row("Contact", clip(data.contactInfo, 120)),
    row("Email", clip(data.email, 120)),
    row(
      "Service",
      clip(
        data.kind === "excursion"
          ? "Excursion"
          : data.kind === "transfer"
            ? "Transfer"
            : data.notes || data.kind,
        160,
      ),
    ),
    row("Route", clip(route, 180)),
    row("Hotel", clip(data.hotelPickup, 120)),
    row("Date", clip(returnDate ? `${date} · Return ${returnDate}` : date, 80)),
    row("Pickup", clip(formatDisplayTime(data.pickupTime), 40)),
    row("Return", clip(formatDisplayTime(data.returnTime), 40)),
    row("Passengers", data.passengers != null ? String(data.passengers) : ""),
    row("Vehicle", clip(data.vehicle, 80)),
    row("Price", money(data.price)),
    row("Flight", clip(data.flight, 80)),
  ].join("");
}

function safeSiteUrl(value: unknown): string {
  try {
    const url = new URL(String(value || ""));
    const host = url.hostname;
    const allowed =
      host === "www.ersunnytravel.com" ||
      host === "ersunnytravel.com" ||
      host === "localhost";
    if (!allowed || (url.protocol !== "https:" && url.protocol !== "http:")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function copyFor(notice: BookingNotice, id: string, name: string): {
  subject: string;
  eyebrow: string;
  title: string;
  intro: string;
  customerSubject: string;
  customerIntro: string;
} {
  const guest = name || "guest";
  if (notice === "paid") {
    return {
      subject: `Payment received · ${id}`,
      eyebrow: "Payment received",
      title: "This booking is paid",
      intro: `Payment for booking reference ${id} is confirmed. Review the details and coordinate the pickup time.`,
      customerSubject: `Payment received · ${id}`,
      customerIntro: `Hi ${guest}, we received your payment for booking reference ${id}. Ersunny Travel will confirm your pickup time next.`,
    };
  }
  if (notice === "pickup") {
    return {
      subject: `Pickup time ready · ${id}`,
      eyebrow: "Pickup",
      title: "Pickup time is ready",
      intro: `Pickup time is set for booking reference ${id}. The guest received the link to confirm it.`,
      customerSubject: `Confirm your pickup · ${id}`,
      customerIntro: `Hi ${guest}, your pickup time for booking reference ${id} is ready. Open the button below to confirm it.`,
    };
  }
  if (notice === "confirmed") {
    return {
      subject: `Guest confirmed pickup · ${id}`,
      eyebrow: "Confirmed",
      title: "Guest accepted the pickup time",
      intro: `${guest} confirmed the pickup time for booking reference ${id}.`,
      customerSubject: `Pickup confirmed · ${id}`,
      customerIntro: `Hi ${guest}, your pickup time for booking reference ${id} is confirmed. We'll see you then.`,
    };
  }
  return {
    subject: `New booking · ${id}`,
    eyebrow: "New booking",
    title: "A new request came in",
    intro: `There is a new booking, reference ${id}. Payment may still be pending.`,
    customerSubject: `We received your request · ${id}`,
    customerIntro: `Hi ${guest}, thanks for choosing Ersunny Travel. We have your request with booking reference ${id} and will follow up by email or WhatsApp.`,
  };
}

async function deliver(opts: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.RESEND_FROM || "";
  if (!key || !from || opts.to.length === 0) return;
  const result = await new Resend(key).emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (result.error) throw new Error(result.error.message);
}

export async function sendDesignedBookingEmails(input: {
  notice: BookingNotice;
  reservation: ReservationMail;
  confirmUrl?: string;
}): Promise<void> {
  const id = parseReservationId(input.reservation.id || "");
  if (!id) return;
  const data = { ...input.reservation, id };
  const name = clip(data.name, 80);
  const copy = copyFor(input.notice, id, name);
  const page = `https://www.ersunnytravel.com/payment?id=${encodeURIComponent(id)}`;
  const confirmUrl = safeSiteUrl(input.confirmUrl);
  const rows = detailRows(data, id);
  await deliver({
    to: companyRecipients(),
    subject: copy.subject,
    html: shell({
      eyebrow: copy.eyebrow,
      title: copy.title,
      intro: copy.intro,
      rows,
      ctaLabel: "Open booking",
      ctaUrl: page,
    }),
  });
  const customer = parseEmail(data.email);
  if (!customer) return;
  await deliver({
    to: [customer],
    subject: copy.customerSubject,
    html: shell({
      eyebrow: "Ersunny Travel",
      title: copy.customerSubject,
      intro: copy.customerIntro,
      rows,
      ctaLabel:
        input.notice === "pickup" && confirmUrl
          ? "Confirm pickup time"
          : "View booking",
      ctaUrl: input.notice === "pickup" && confirmUrl ? confirmUrl : page,
    }),
  });
}

export function mailFromBody(body: Record<string, unknown>): ReservationMail {
  const passengers = Number(body.passengers);
  return {
    id: clip(body.reservationId, 20),
    name: clip(body.name, 80),
    contactInfo: clip(body.contactInfo, 160),
    email: clip(body.email, 160),
    origin: clip(body.origin, 120),
    destination: clip(body.destination, 120),
    date: clip(body.date, 40),
    returnDate: clip(body.returnDate, 40),
    passengers: Number.isFinite(passengers) ? Math.min(30, Math.max(0, passengers)) : undefined,
    vehicle: clip(body.vehicle, 80),
    price: parseAmountUsd(body.price),
    kind: clip(body.kind, 20),
    hotelPickup: clip(body.hotelPickup, 120),
    flight: clip(body.flight, 80),
    notes: clip(body.notes, 180),
    pickupTime: clip(body.pickupTime, 40),
    returnTime: clip(body.returnTime, 40),
  };
}

/** Tell the company inbox that a reservation was paid. Failures stay out of the payment result. */
export async function notifyCompanyOfPayment(reservationId: string): Promise<void> {
  const id = parseReservationId(reservationId);
  const base = databaseUrl();
  if (!id || !base) return;
  const res = await fetch(`${base}/reservations/${encodeURIComponent(id)}.json`);
  if (!res.ok) return;
  const data = (await res.json()) as ReservationMail | null;
  if (!data) return;
  await sendDesignedBookingEmails({ notice: "paid", reservation: { ...data, id } });
}
