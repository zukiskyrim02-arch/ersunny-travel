import type { Reservation } from "../reservations";

/** PayPal REST app Client ID (Live / production from developer.paypal.com). */
export const PAYPAL_CLIENT_ID =
  "BAAvVjcWrCLb8eFr8-7CU5x1yqRwToc8NGThSTJbjhSYj745FCj33kmBcJsTjQy8Se9ZPdSJZ6tUE4tiPw";

export const PAYPAL_SDK_SRC = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
  PAYPAL_CLIENT_ID,
)}&components=buttons&enable-funding=paypal&disable-funding=card,credit,paylater,venmo&currency=USD&intent=capture`;

function clip(text: string, max = 127) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

/** Confirmation ticket shown on-site and inside the PayPal order. */
export function buildPayPalTicket(reservation: Reservation): {
  name: string;
  description: string;
  service: string;
} {
  const isExcursion = reservation.kind === "excursion";
  const service = isExcursion
    ? reservation.destination || "Excursion"
    : reservation.wantReturn
      ? "Private transfer (round trip)"
      : "Private transfer (one way)";

  const route = isExcursion
    ? reservation.hotelPickup || reservation.origin
    : `${reservation.origin} → ${reservation.destination}`;

  const when =
    reservation.wantReturn && reservation.returnDate
      ? `${reservation.date} → ${reservation.returnDate}`
      : reservation.date;

  return {
    service,
    name: clip(`${reservation.id} · ${service}`),
    description: clip(
      [
        route,
        when,
        `${reservation.passengers} pax`,
        reservation.name,
        reservation.vehicle && !isExcursion ? reservation.vehicle : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  };
}

type PayPalOrderActions = {
  order: {
    create: (payload: Record<string, unknown>) => Promise<string>;
    capture: () => Promise<Record<string, unknown>>;
  };
};

export type PayPalButtonsApi = {
  Buttons: (opts: {
    style?: Record<string, string | number | boolean>;
    createOrder: (
      data: Record<string, unknown>,
      actions: PayPalOrderActions,
    ) => Promise<string>;
    onApprove: (
      data: { orderID: string },
      actions: PayPalOrderActions,
    ) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
  }) => {
    render: (selector: string) => Promise<void>;
    close?: () => void;
  };
};

declare global {
  interface Window {
    paypal?: PayPalButtonsApi;
  }
}

export function loadPayPalSdk(): Promise<PayPalButtonsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal requires a browser."));
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-paypal-sdk="buttons"]`,
  );
  const srcMatches = existing?.src === PAYPAL_SDK_SRC;

  if (window.paypal?.Buttons && srcMatches) {
    return Promise.resolve(window.paypal);
  }

  // Drop previous SDK so funding options / client-id updates apply.
  document
    .querySelectorAll("script[data-paypal-sdk]")
    .forEach((node) => node.remove());
  if (window.paypal) {
    delete window.paypal;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAYPAL_SDK_SRC;
    script.async = true;
    script.dataset.paypalSdk = "buttons";
    script.onload = () => {
      if (window.paypal?.Buttons) resolve(window.paypal);
      else reject(new Error("PayPal SDK loaded without Buttons."));
    };
    script.onerror = () => reject(new Error("PayPal SDK failed to load."));
    document.body.appendChild(script);
  });
}
