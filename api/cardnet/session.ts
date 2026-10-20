import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jsonObject } from "../../server/paymentGuards.js";
import { postCardnetSession } from "../../server/paymentRoute.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const result = await postCardnetSession(parsed.value, remoteIp);
    if (result.cookies?.length) res.setHeader("Set-Cookie", result.cookies);
    return res.status(result.status).json(result.json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cardnet session error";
    console.error("[cardnet/session]", message);
    return res.status(502).json({ error: message });
  }
}
