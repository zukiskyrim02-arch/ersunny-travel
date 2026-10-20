import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CARDNET_COOKIE, clearCookie, readCardnetState } from "../../server/cookies.js";
import {
  cardnetOutcome,
  getCardnetConfig,
  verifyCardnetSession,
  verifyCardnetState,
} from "../../server/cardnet.js";

function readJson(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body as Record<string, unknown>);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJson(req);
    const header = Array.isArray(req.headers.cookie)
      ? req.headers.cookie.join("; ")
      : req.headers.cookie;
    const state = String(body.state || "").trim() || readCardnetState(header);
    if (!state) {
      res.setHeader("Set-Cookie", clearCookie(CARDNET_COOKIE));
      return res.status(400).json({ error: "state required" });
    }

    const config = getCardnetConfig();
    const payload = await verifyCardnetState(config.stateSecret, state);
    const result = await verifyCardnetSession(
      config,
      payload.session,
      payload.sk,
    );
    const outcome = cardnetOutcome(result);

    res.setHeader("Set-Cookie", clearCookie(CARDNET_COOKIE));
    return res.status(200).json({
      approved: outcome.approved,
      authorizationCode: outcome.authorizationCode,
      responseCode: outcome.responseCode,
      reservationId: payload.reservationId,
      amount: payload.amount,
      session: payload.session,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cardnet verify error";
    console.error("[cardnet/verify]", message);
    return res.status(502).json({ error: message });
  }
}
