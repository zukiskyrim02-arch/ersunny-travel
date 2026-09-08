import type { Reservation } from "../reservations";

export type AzulEnv = "test" | "production";

export type AzulConfig = {
  enabled: boolean;
  env: AzulEnv;
  merchantId: string;
  merchantName: string;
  merchantType: string;
  currencyCode: string;
  authKey: string;
  /** ITBIS in Azul fixed format, e.g. "000" = 0.00 */
  itbis: string;
};

export const defaultAzulConfig = (): AzulConfig => ({
  enabled: true,
  env: "test",
  merchantId: import.meta.env.VITE_AZUL_MERCHANT_ID ?? "",
  merchantName: import.meta.env.VITE_AZUL_MERCHANT_NAME ?? "ERSUNNY TRAVEL",
  merchantType: import.meta.env.VITE_AZUL_MERCHANT_TYPE ?? "ECommerce",
  currencyCode: import.meta.env.VITE_AZUL_CURRENCY ?? "$",
  authKey: import.meta.env.VITE_AZUL_AUTH_KEY ?? "",
  itbis: import.meta.env.VITE_AZUL_ITBIS ?? "000",
});

export function azulPaymentUrl(env: AzulEnv) {
  return env === "production"
    ? "https://pagos.azul.com.do/PaymentPage/Default.aspx"
    : "https://pruebas.azul.com.do/PaymentPage/Default.aspx";
}

/** Azul amount: last two digits are decimals (6500 = 65.00). */
export function toAzulAmount(usd: number) {
  return Math.round(usd * 100).toString();
}

function utf16LeBytes(text: string): ArrayBuffer {
  const buf = new ArrayBuffer(text.length * 2);
  const view = new Uint16Array(buf);
  for (let i = 0; i < text.length; i++) view[i] = text.charCodeAt(i);
  return buf;
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * AuthHash HMAC-SHA512 over UTF-16LE (Unicode) string, as required by AZUL Página de Pagos.
 */
export async function computeAzulAuthHash(
  message: string,
  authKey: string,
): Promise<string> {
  const keyBytes = utf16LeBytes(authKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, utf16LeBytes(message));
  return toHex(sig);
}

export function buildAzulReturnUrls() {
  const origin = window.location.origin;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const root = `${origin}${base}/`;
  return {
    approved: `${root}?azul=approved`,
    declined: `${root}?azul=declined`,
    cancel: `${root}?azul=cancel`,
  };
}

export type AzulSaleFields = Record<string, string>;

export async function buildAzulSaleFields(
  azul: AzulConfig,
  reservation: Reservation,
): Promise<AzulSaleFields | { error: string }> {
  if (!azul.merchantId.trim() || !azul.authKey.trim()) {
    return {
      error:
        "Faltan credenciales de Pago Azul (Merchant ID y AuthKey). Configúralas en Admin → Pago Azul.",
    };
  }
  if (reservation.price == null || reservation.price <= 0) {
    return {
      error:
        "Esta reserva no tiene monto definido. Confirma el precio en Admin antes de cobrar con Azul.",
    };
  }

  const urls = buildAzulReturnUrls();
  const amount = toAzulAmount(reservation.price);
  const itbis = azul.itbis || "000";
  const use1 = "1";
  const label1 = "Reserva";
  const value1 = reservation.id;
  const use2 = "1";
  const label2 = reservation.kind === "excursion" ? "Excursion" : "Traslado";
  const value2 =
    reservation.kind === "excursion"
      ? reservation.destination
      : `${reservation.origin} -> ${reservation.destination}`;

  const message =
    azul.merchantId +
    azul.merchantName +
    azul.merchantType +
    azul.currencyCode +
    reservation.id +
    amount +
    itbis +
    urls.approved +
    urls.declined +
    urls.cancel +
    use1 +
    label1 +
    value1 +
    use2 +
    label2 +
    value2 +
    azul.authKey;

  const authHash = await computeAzulAuthHash(message, azul.authKey);

  return {
    MerchantId: azul.merchantId,
    MerchantName: azul.merchantName,
    MerchantType: azul.merchantType,
    CurrencyCode: azul.currencyCode,
    OrderNumber: reservation.id,
    Amount: amount,
    ITBIS: itbis,
    ApprovedUrl: urls.approved,
    DeclinedUrl: urls.declined,
    CancelUrl: urls.cancel,
    UseCustomField1: use1,
    CustomField1Label: label1,
    CustomField1Value: value1,
    UseCustomField2: use2,
    CustomField2Label: label2,
    CustomField2Value: value2,
    Locale: "ES",
    ShowTransactionResult: "1",
    AuthHash: authHash,
  };
}

export async function redirectToAzul(
  azul: AzulConfig,
  reservation: Reservation,
): Promise<string | null> {
  const fields = await buildAzulSaleFields(azul, reservation);
  if ("error" in fields) return fields.error;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = azulPaymentUrl(azul.env);
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  return null;
}

export type AzulReturnResult = {
  status: "approved" | "declined" | "cancel";
  orderNumber?: string;
  responseMessage?: string;
  isoCode?: string;
  authorizationCode?: string;
  amount?: string;
};

export function readAzulReturnFromUrl(): AzulReturnResult | null {
  const params = new URLSearchParams(window.location.search);
  const azul = params.get("azul");
  if (!azul) return null;

  if (azul === "cancel") return { status: "cancel" };

  return {
    status: azul === "approved" ? "approved" : "declined",
    orderNumber: params.get("OrderNumber") ?? undefined,
    responseMessage: params.get("ResponseMessage") ?? undefined,
    isoCode: params.get("IsoCode") ?? undefined,
    authorizationCode: params.get("AuthorizationCode") ?? undefined,
    amount: params.get("Amount") ?? undefined,
  };
}

export function clearAzulQueryFromUrl() {
  const url = new URL(window.location.href);
  if (![...url.searchParams.keys()].length) return;
  url.search = "";
  window.history.replaceState({}, "", url.pathname + url.hash);
}
