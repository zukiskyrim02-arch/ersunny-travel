import type { Reservation } from "./reservations";

type ContactBits = {
  email: string;
  whatsapp: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(price: number | null | undefined): string {
  if (price == null) return "To be confirmed";
  return `$${price} USD`;
}

function detailRow(label: string, value: string): string {
  if (!value.trim()) return "";
  return `<tr>
<td style="padding:11px 0;border-bottom:1px solid #e8eef5;color:#64748b;font-size:13px;width:38%;">${esc(label)}</td>
<td style="padding:11px 0;border-bottom:1px solid #e8eef5;color:#0f172a;font-size:14px;font-weight:600;">${esc(value)}</td>
</tr>`;
}

function emailShell(opts: {
  eyebrow: string;
  title: string;
  intro: string;
  rowsHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  contact: ContactBits;
}): string {
  const wa = opts.contact.whatsapp.replace(/\D/g, "");
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<p style="margin:28px 0 0;"><a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:#0b57d0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 22px;border-radius:12px;">${esc(opts.ctaLabel)}</a></p>`
      : "";

  // Inline table email — works in most clients when FormSubmit delivers HTML body.
  return `<div style="margin:0;padding:0;background:#eef3f8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;">
<tr><td style="background:#0b57d0;padding:28px;">
<p style="margin:0 0 8px;color:rgba(255,255,255,0.8);font-size:12px;font-weight:650;letter-spacing:0.08em;text-transform:uppercase;">${esc(opts.eyebrow)}</p>
<p style="margin:0;color:#ffffff;font-size:22px;font-weight:750;letter-spacing:-0.02em;">Ersunny Travel</p>
<p style="margin:10px 0 0;color:#ffffff;font-size:16px;font-weight:650;">${esc(opts.title)}</p>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 22px;color:#475569;font-size:15px;line-height:1.55;">${esc(opts.intro)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${opts.rowsHtml}</table>
${cta}
</td></tr>
<tr><td style="padding:0 28px 28px;">
<div style="border-top:1px solid #e8eef5;padding-top:18px;">
<p style="margin:0 0 6px;color:#0f172a;font-size:13px;font-weight:700;">Need help?</p>
<p style="margin:0;color:#64748b;font-size:13px;line-height:1.55;">WhatsApp <a href="https://wa.me/${esc(wa)}" style="color:#0b57d0;text-decoration:none;font-weight:650;">${esc(opts.contact.whatsapp)}</a><br>Email <a href="mailto:${esc(opts.contact.email)}" style="color:#0b57d0;text-decoration:none;font-weight:650;">${esc(opts.contact.email)}</a></p>
</div>
</td></tr>
</table>
<p style="margin:16px 0 0;color:#94a3b8;font-size:11px;">Punta Cana · Bávaro · Macao</p>
</td></tr>
</table>
</div>`;
}

function reservationRows(reservation: Reservation): string {
  return [
    detailRow("Reservation", reservation.id),
    detailRow("Guest", reservation.name),
    detailRow("Route", `${reservation.origin} → ${reservation.destination}`),
    detailRow(
      "Date",
      reservation.returnDate
        ? `${reservation.date} · Return ${reservation.returnDate}`
        : reservation.date,
    ),
    detailRow("Passengers", String(reservation.passengers)),
    detailRow("Vehicle", reservation.vehicle),
    detailRow("Price", money(reservation.price)),
    detailRow("Flight", reservation.flight ?? ""),
    detailRow("Hotel", reservation.hotelPickup ?? ""),
  ].join("");
}

export function customerBookingReceivedEmail(
  reservation: Reservation,
  contact: ContactBits,
): string {
  return emailShell({
    eyebrow: "Booking request",
    title: "We received your request",
    intro: `Hi ${reservation.name}, thanks for choosing Ersunny Travel. Your transfer request is in — complete payment when ready and we'll arrange your pickup.`,
    rowsHtml: reservationRows(reservation),
    contact,
  });
}

export function customerPaymentConfirmEmail(
  reservation: Reservation,
  contact: ContactBits,
): string {
  return emailShell({
    eyebrow: "Payment confirmed",
    title: "You're all set",
    intro: `Hi ${reservation.name}, we received your payment for reservation ${reservation.id}. Ersunny Travel will confirm your pickup time and email you a link to approve it.`,
    rowsHtml: reservationRows(reservation),
    contact,
  });
}

export function customerPickupReadyEmail(
  reservation: Reservation,
  confirmUrl: string,
  contact: ContactBits,
): string {
  const schedule = [
    reservation.pickupTime
      ? detailRow("Pickup", `${reservation.date} at ${reservation.pickupTime}`)
      : "",
    reservation.wantReturn && reservation.returnDate && reservation.returnTime
      ? detailRow(
          "Return",
          `${reservation.returnDate} at ${reservation.returnTime}`,
        )
      : "",
  ].join("");

  return emailShell({
    eyebrow: "Pickup schedule",
    title: "Please confirm your times",
    intro: `Hi ${reservation.name}, your pickup schedule for ${reservation.id} is ready. Review it and confirm with one click.`,
    rowsHtml: reservationRows(reservation) + schedule,
    ctaLabel: "Confirm pickup time",
    ctaUrl: confirmUrl,
    contact,
  });
}
