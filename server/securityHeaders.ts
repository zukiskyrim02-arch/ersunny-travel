/** Headers applied by vercel.json and the local Vite server. Keep both copies equal. */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' https://www.paypal.com https://www.paypalobjects.com https://www.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.paypalobjects.com https://www.google.com https://www.gstatic.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://firebase.googleapis.com https://www.googleapis.com https://api.cloudinary.com https://formsubmit.co https://www.google.com https://www.gstatic.com https://www.paypal.com https://www.paypalobjects.com https://api-m.paypal.com https://c.paypal.com https://www.sandbox.paypal.com https://api-m.sandbox.paypal.com",
  "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://www.google.com https://www.gstatic.com https://recaptcha.google.com",
  "form-action 'self' https://labservicios.cardnet.com.do https://ecommerce.cardnet.com.do https://www.paypal.com https://www.sandbox.paypal.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export const PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=(self "https://www.paypal.com" "https://www.sandbox.paypal.com")';

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
];

export function securityHeaderRecord(options?: { upgradeInsecure?: boolean }): Record<string, string> {
  const headers = Object.fromEntries(
    SECURITY_HEADERS.map((header) => [header.key, header.value]),
  );
  if (options?.upgradeInsecure === false) {
    headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(
      "; upgrade-insecure-requests",
      "",
    );
  }
  return headers;
}
