import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cardnetPaymentUrl, cardnetPublicOrigin } from "../../server/cardnet.js";
import { jsonObject } from "../../server/paymentGuards.js";
import { postCardnetVerify } from "../../server/paymentRoute.js";

function requestOrigin(req: VercelRequest): string {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = String(
    (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ||
      req.headers.host ||
      "www.ersunnytravel.com",
  )
    .split(",")[0]
    .trim();
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = String(
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || "https",
  )
    .split(",")[0]
    .trim();
  return cardnetPublicOrigin(`${proto}://${host}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const flag = String(req.query.cardnet || "");
  if (
    (req.method === "GET" || req.method === "POST") &&
    (flag === "return" || flag === "cancel")
  ) {
    const id = String(req.query.id || "");
    res.statusCode = 303;
    res.setHeader("Location", cardnetPaymentUrl(requestOrigin(req), id, flag));
    res.setHeader("Cache-Control", "no-store");
    return res.end();
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = jsonObject(req.body);
  if (!parsed.ok) return res.status(400).json({ error: "invalid_json" });

  try {
    const forwarded = req.headers["x-forwarded-for"];
    const remoteIp = String(
      (Array.isArray(forwarded) ? forwarded[0] : forwarded) || "",
    )
      .split(",")[0]
      .trim();
    const header = Array.isArray(req.headers.cookie)
      ? req.headers.cookie.join("; ")
      : req.headers.cookie;
    const result = await postCardnetVerify(
      parsed.value,
      remoteIp,
      header,
      new URL(requestOrigin(req)).host,
    );
    if (result.cookies?.length) res.setHeader("Set-Cookie", result.cookies);
    return res.status(result.status).json(result.json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cardnet verify error";
    console.error("[cardnet/verify]", message);
    return res.status(502).json({ error: message });
  }
}
