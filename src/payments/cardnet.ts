import type { Reservation } from "../reservations";

export type CardnetSessionResponse = {
  session: string;
  authorizeUrl: string;
  returnUrl: string;
  cancelUrl: string;
  state: string;
  env: "lab" | "production";
};

export type CardnetVerifyResponse = {
  approved: boolean;
  reservationId: string;
  amount: number;
  session: string;
  authorizationCode?: string;
  responseCode?: string;
  error?: string;
};

function cardnetStateKey(reservationId: string) {
  return `ersunny-cardnet:${reservationId.trim().toUpperCase()}`;
}

export function rememberCardnetState(reservationId: string, state: string) {
  try {
    sessionStorage.setItem(cardnetStateKey(reservationId), state);
  } catch {
    /* The return cookie is the backup. */
  }
}

export function readCardnetReturnFromUrl(): {
  status: "return" | "cancel";
  state: string;
  reservationId: string;
} | null {
  const params = new URLSearchParams(window.location.search);
  const flag = params.get("cardnet");
  if (flag !== "return" && flag !== "cancel") return null;
  const reservationId = params.get("id") || "";
  let state = params.get("state") || "";
  if (!state && reservationId) {
    try {
      state = sessionStorage.getItem(cardnetStateKey(reservationId)) || "";
    } catch {
      state = "";
    }
  }
  return { status: flag, state, reservationId };
}

export function clearCardnetQueryFromUrl(reservationId?: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete("cardnet");
  url.searchParams.delete("state");
  if (reservationId) {
    url.searchParams.set("id", reservationId);
    try {
      sessionStorage.removeItem(cardnetStateKey(reservationId));
    } catch {
      /* ignore */
    }
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function phoneFromReservation(reservation: Reservation): string {
  const fromContact = reservation.contactInfo.match(/\+?[\d\s()-]{8,}/)?.[0];
  return (fromContact || "").replace(/\D/g, "");
}

export async function startCardnetCheckout(opts: {
  reservation: Reservation;
  amountUsd: number;
  pageLanguage?: "SPA" | "ENG";
}): Promise<CardnetSessionResponse> {
  const origin = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}`;
  const res = await fetch("/api/cardnet/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      reservationId: opts.reservation.id,
      amountUsd: opts.amountUsd,
      origin,
      pageLanguage: opts.pageLanguage || "ENG",
      mobilePhone: phoneFromReservation(opts.reservation),
    }),
  });
  const text = await res.text();
  let data: (CardnetSessionResponse & { error?: string }) | null = null;
  try {
    data = JSON.parse(text) as CardnetSessionResponse & { error?: string };
  } catch {
    throw new Error(
      "Card payment service is unavailable. Please try again.",
    );
  }
  if (!res.ok || !data.session) {
    throw new Error(data.error || "Could not start card payment.");
  }
  return data;
}

/** Redirect browser to Cardnet hosted payment page (3DS). */
export function redirectToCardnetAuthorize(session: CardnetSessionResponse) {
  const reservationId = new URL(session.returnUrl, window.location.origin).searchParams.get(
    "id",
  );
  if (reservationId) rememberCardnetState(reservationId, session.state);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = session.authorizeUrl;
  form.style.display = "none";

  const fields: Record<string, string> = {
    SESSION: session.session,
    ReturnUrl: session.returnUrl,
    CancelUrl: session.cancelUrl,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export async function verifyCardnetPayment(
  state: string,
): Promise<CardnetVerifyResponse> {
  const res = await fetch("/api/cardnet/verify", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ state }),
  });
  const text = await res.text();
  let data: CardnetVerifyResponse | null = null;
  try {
    data = JSON.parse(text) as CardnetVerifyResponse;
  } catch {
    throw new Error("Could not verify card payment.");
  }
  if (!res.ok) {
    throw new Error(data.error || "Could not verify card payment.");
  }
  return data;
}
