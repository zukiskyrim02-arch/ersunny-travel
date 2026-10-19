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
  result: Record<string, unknown>;
  error?: string;
};

export function readCardnetReturnFromUrl(): {
  status: "return" | "cancel";
  state: string;
  reservationId: string;
} | null {
  const params = new URLSearchParams(window.location.search);
  const flag = params.get("cardnet");
  if (flag !== "return" && flag !== "cancel") return null;
  return {
    status: flag,
    state: params.get("state") || "",
    reservationId: params.get("id") || "",
  };
}

export function clearCardnetQueryFromUrl(reservationId?: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete("cardnet");
  url.searchParams.delete("state");
  if (reservationId) {
    url.searchParams.set("id", reservationId);
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
  const data = (await res.json()) as CardnetSessionResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not start Cardnet payment.");
  }
  return data;
}

/** Redirect browser to Cardnet hosted payment page (3DS). */
export function redirectToCardnetAuthorize(session: CardnetSessionResponse) {
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
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ state }),
  });
  const data = (await res.json()) as CardnetVerifyResponse;
  if (!res.ok) {
    throw new Error(data.error || "Could not verify Cardnet payment.");
  }
  return data;
}
