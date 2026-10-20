import { Resend } from "resend";
import { downloadRawJson, uploadRawJson } from "./cloudinary.js";
import { openSeal, seal, sessionSecret } from "./cookies.js";
import type { ApiResult } from "./authFlow.js";
import { databaseUrl } from "./rtdb.js";

const BOOK_ID = "ersunny/reviews";
const SURVEY_MS = 45 * 24 * 60 * 60 * 1000;

type Guest = {
  id?: string;
  kind?: string;
  name?: string;
  email?: string;
  contactInfo?: string;
  origin?: string;
  destination?: string;
};

type StoredReview = {
  id: string;
  name: string;
  service: string;
  rating: number;
  comment: string;
  createdAt: string;
  published: boolean;
};

type Book = {
  reviews: Record<string, StoredReview>;
  sent: Record<string, string>;
};

let chain: Promise<void> = Promise.resolve();

function emptyBook(): Book {
  return { reviews: {}, sent: {} };
}

async function readBook(): Promise<Book> {
  const text = await downloadRawJson(BOOK_ID);
  if (!text) return emptyBook();
  try {
    const parsed = JSON.parse(text) as Partial<Book>;
    return {
      reviews: parsed.reviews && typeof parsed.reviews === "object" ? parsed.reviews : {},
      sent: parsed.sent && typeof parsed.sent === "object" ? parsed.sent : {},
    };
  } catch {
    return emptyBook();
  }
}

async function updateBook(mutate: (book: Book) => void) {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = chain;
  chain = gate;
  await previous;
  try {
    const book = await readBook();
    mutate(book);
    await uploadRawJson(BOOK_ID, JSON.stringify(book));
  } finally {
    release();
  }
}

function siteOrigin(origin: string | undefined) {
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return origin;
  }
  if (origin && /^https:\/\/([a-z0-9-]+\.)?ersunnytravel\.com$/i.test(origin)) {
    return origin;
  }
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";
  if (vercel) return `https://${vercel.replace(/^https:\/\//, "")}`;
  return "https://www.ersunnytravel.com";
}

function guestEmail(guest: Guest) {
  const direct = String(guest.email || "").trim();
  if (direct.includes("@")) return direct;
  const match = String(guest.contactInfo || "").match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  return match?.[0] || "";
}

function publicName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Viajero";
  if (parts.length === 1) return parts[0].slice(0, 40);
  return `${parts[0].slice(0, 40)} ${parts[1][0]}.`;
}

function serviceLabel(guest: Guest) {
  if (guest.kind === "excursion") return (guest.destination || "Excursión").slice(0, 120);
  const origin = guest.origin || "Punta Cana";
  const destination = guest.destination || "Hotel";
  return `${origin} → ${destination}`.slice(0, 160);
}

function cleanComment(value: unknown) {
  return String(value || "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

async function readGuest(id: string): Promise<Guest | null> {
  const key = id.trim().toUpperCase();
  if (!key) return null;
  const url = `${databaseUrl()}/reservations/${encodeURIComponent(key)}.json`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = (await res.json()) as Guest | null;
        if (data?.id) return data;
      }
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return null;
}

async function markSurveySent(id: string) {
  const key = id.trim().toUpperCase();
  const url = `${databaseUrl()}/reservations/${encodeURIComponent(key)}.json`;
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "completed",
      surveySentAt: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function surveyMail(name: string, service: string, link: string) {
  const safeName = esc(name);
  const safeService = esc(service);
  const safeLink = esc(link);
  return `<div style="margin:0;padding:24px 12px;background:#eef3f8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;">
<tr><td style="background:#0b57d0;padding:28px;color:#fff;">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">Ersunny Travel</p>
<p style="margin:0;font-size:22px;font-weight:750;">¿Cómo estuvo tu viaje?</p>
</td></tr>
<tr><td style="padding:28px;color:#334155;font-size:15px;line-height:1.55;">
<p style="margin:0 0 12px;">Hola ${safeName},</p>
<p style="margin:0 0 18px;">Tu servicio ya se completó: <strong>${safeService}</strong>. Cuéntanos en un minuto cómo te fue. Tu comentario se publica al pie de la página.</p>
<p style="margin:0;"><a href="${safeLink}" style="display:inline-block;background:#0b57d0;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">Dejar mi comentario</a></p>
</td></tr>
</table></div>`;
}

export async function publicReviews(): Promise<ApiResult> {
  try {
    const book = await readBook();
    const reviews = Object.values(book.reviews)
      .filter((item) => item.published && item.comment)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        name: item.name,
        service: item.service,
        rating: item.rating,
        comment: item.comment,
        createdAt: item.createdAt,
      }));
    return { status: 200, body: { reviews } };
  } catch {
    return { status: 200, body: { reviews: [] } };
  }
}

export async function inviteReview(
  body: Record<string, unknown>,
  origin: string | undefined,
): Promise<ApiResult> {
  const secret = sessionSecret();
  const from = process.env.RESEND_FROM || "";
  const key = process.env.RESEND_API_KEY || "";
  if (!secret || !from || !key) {
    return { status: 503, body: { error: "not_configured" } };
  }
  const id = String(body.id || "").trim().toUpperCase();
  if (!id) return { status: 400, body: { error: "not_found" } };

  const guest = await readGuest(id);
  if (!guest) return { status: 404, body: { error: "not_found" } };
  const email = guestEmail(guest);
  if (!email) return { status: 400, body: { error: "no_email" } };

  const book = await readBook();
  if (book.sent[id] || book.reviews[id]) {
    return { status: 200, body: { ok: true, already: true } };
  }

  const token = seal({ id, exp: Date.now() + SURVEY_MS }, secret);
  const link = `${siteOrigin(origin)}/review?t=${encodeURIComponent(token)}`;
  const name = publicName(String(guest.name || ""));
  const service = serviceLabel(guest);
  try {
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from,
      to: email,
      subject: "Ersunny Travel — ¿cómo estuvo tu viaje?",
      html: surveyMail(name, service, link),
    });
    if (result.error) {
      return { status: 502, body: { error: "email_failed" } };
    }
  } catch {
    return { status: 502, body: { error: "email_failed" } };
  }

  await updateBook((next) => {
    next.sent[id] = new Date().toISOString();
  });
  await markSurveySent(id);
  return { status: 200, body: { ok: true } };
}

export async function openReview(body: Record<string, unknown>): Promise<ApiResult> {
  const secret = sessionSecret();
  if (!secret) return { status: 503, body: { error: "not_configured" } };
  const token = openSeal<{ id?: string; exp: number }>(String(body.token || ""), secret);
  if (!token?.id) return { status: 400, body: { error: "invalid" } };
  const id = token.id.trim().toUpperCase();
  const book = await readBook();
  if (book.reviews[id]) return { status: 200, body: { already: true } };
  const guest = await readGuest(id);
  return {
    status: 200,
    body: {
      already: false,
      name: publicName(String(guest?.name || "")),
      service: guest ? serviceLabel(guest) : "Ersunny Travel",
    },
  };
}

export async function submitReview(body: Record<string, unknown>): Promise<ApiResult> {
  const secret = sessionSecret();
  if (!secret) return { status: 503, body: { error: "not_configured" } };
  const token = openSeal<{ id?: string; exp: number }>(String(body.token || ""), secret);
  if (!token?.id) return { status: 400, body: { error: "invalid" } };
  const rating = Number(body.rating);
  const comment = cleanComment(body.comment);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: 400, body: { error: "rating" } };
  }
  if (comment.length < 8) return { status: 400, body: { error: "short" } };

  const id = token.id.trim().toUpperCase();
  const guest = await readGuest(id);
  if (!guest) return { status: 404, body: { error: "invalid" } };

  let already = false;
  await updateBook((book) => {
    if (book.reviews[id]) {
      already = true;
      return;
    }
    book.reviews[id] = {
      id,
      name: publicName(String(guest.name || "")),
      service: serviceLabel(guest),
      rating,
      comment,
      createdAt: new Date().toISOString(),
      published: true,
    };
    book.sent[id] = book.sent[id] || new Date().toISOString();
  });
  if (already) return { status: 200, body: { ok: true, already: true } };
  return { status: 200, body: { ok: true } };
}
