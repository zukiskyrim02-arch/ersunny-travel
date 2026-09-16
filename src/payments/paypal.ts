import type { Reservation } from "../reservations";

/** PayPal Hosted Buttons client id (from your PayPal button builder). */
export const PAYPAL_CLIENT_ID =
  "BAA_YFfnUewFCjH4209ZCebD5dAeBmiGlWHCiBYxQry9HGzNNk3LC4zprj65FhjFlG_fi1e_td3LS89nQ0";

export const PAYPAL_HOSTED_BUTTON_ID = "YCBRL25F7V8ES";

export const PAYPAL_SDK_SRC = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
  PAYPAL_CLIENT_ID,
)}&components=hosted-buttons&disable-funding=venmo&currency=USD`;

export type PayPalHostedButtonsApi = {
  HostedButtons: (opts: { hostedButtonId: string }) => {
    render: (selector: string) => Promise<void> | void;
  };
};

declare global {
  interface Window {
    paypal?: PayPalHostedButtonsApi;
  }
}

function clip(text: string, max = 127) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

/** Confirmation ticket summary shown above the PayPal button. */
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

export function loadPayPalSdk(): Promise<PayPalHostedButtonsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal requires a browser."));
  }
  if (window.paypal?.HostedButtons) {
    return Promise.resolve(window.paypal);
  }

  // Remove incompatible SDK scripts from earlier Buttons attempts.
  document
    .querySelectorAll("script[data-paypal-sdk]")
    .forEach((node) => node.remove());
  // PayPal attaches to window; clear stale instance without HostedButtons.
  if (window.paypal && !window.paypal.HostedButtons) {
    delete window.paypal;
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-paypal-sdk="hosted-buttons"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.paypal?.HostedButtons) {
        resolve(window.paypal);
        return;
      }
      existing.addEventListener("load", () => {
        if (window.paypal?.HostedButtons) resolve(window.paypal);
        else reject(new Error("PayPal SDK loaded without HostedButtons."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("PayPal SDK failed to load.")),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAYPAL_SDK_SRC;
    script.async = true;
    script.dataset.paypalSdk = "hosted-buttons";
    script.onload = () => {
      if (window.paypal?.HostedButtons) resolve(window.paypal);
      else reject(new Error("PayPal SDK loaded without HostedButtons."));
    };
    script.onerror = () => reject(new Error("PayPal SDK failed to load."));
    document.body.appendChild(script);
  });
}

/** Prefill hosted-button amount and hide the price field. */
export function lockHostedButtonAmount(root: HTMLElement, amount: number) {
  const value = Number.isFinite(amount) ? amount.toFixed(2) : "";
  if (!value) return;

  const inputs = root.querySelectorAll<HTMLInputElement>(
    'input[type="text"], input[type="number"], input:not([type])',
  );

  for (const input of inputs) {
    const name = (input.name || input.id || "").toLowerCase();
    const aria = (input.getAttribute("aria-label") || "").toLowerCase();
    const placeholder = (input.placeholder || "").toLowerCase();
    const looksLikeAmount =
      name.includes("amount") ||
      name.includes("price") ||
      aria.includes("price") ||
      aria.includes("amount") ||
      placeholder.includes("price") ||
      placeholder.includes("amount") ||
      placeholder.includes("usd");

    const onlyVisibleField =
      inputs.length <= 2 &&
      input.type !== "hidden" &&
      input.offsetParent !== null;

    if (!looksLikeAmount && !onlyVisibleField) continue;

    input.value = value;
    input.setAttribute("value", value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.readOnly = true;
    input.tabIndex = -1;

    const row =
      input.closest(
        "[class*='field'], [class*='Form'], label, .paypal-button-row",
      ) || input.parentElement;
    if (row instanceof HTMLElement) {
      row.classList.add("paypal-hosted__amount-row");
      row.setAttribute("data-paypal-amount-locked", "1");
    }
  }

  root.querySelectorAll("label, span, p, div, legend").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.querySelector("[data-paypal-amount-locked]")) return;
    const text = (node.textContent || "").trim().toLowerCase();
    if (
      text.includes("original price") ||
      text.includes("write the") ||
      text.includes("enter the price") ||
      text.includes("escribe el precio") ||
      text.includes("precio original")
    ) {
      const row =
        node.closest("[class*='field'], [class*='Form'], label") || node;
      if (row instanceof HTMLElement) {
        row.classList.add("paypal-hosted__amount-row");
        row.setAttribute("data-paypal-amount-locked", "1");
      }
    }
  });
}
