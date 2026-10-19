import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  cardnetAuthorizeUrl,
  createCardnetSession,
  getCardnetConfig,
  signCardnetState,
} from "../../server/cardnet";

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
    const reservationId = String(body.reservationId || "").trim();
    const amountUsd = Number(body.amountUsd);
    const origin = String(body.origin || "").replace(/\/$/, "");
    const pageLanguage = body.pageLanguage === "SPA" ? "SPA" : "ENG";
    const mobilePhone = String(body.mobilePhone || "");

    if (!reservationId || !Number.isFinite(amountUsd) || amountUsd <= 0) {
      return res
        .status(400)
        .json({ error: "reservationId and amountUsd required" });
    }
    if (!origin) {
      return res.status(400).json({ error: "origin required" });
    }

    const config = getCardnetConfig();
    const payBase = `${origin}/payment?id=${encodeURIComponent(reservationId)}`;

    // 1) Provisional session to obtain SESSION + sk for signed state
    const provisional = await createCardnetSession(config, {
      amountUsd,
      reservationId,
      returnUrl: `${payBase}&cardnet=return`,
      cancelUrl: `${payBase}&cardnet=cancel`,
      pageLanguage,
      mobilePhone,
    });

    const state = await signCardnetState(config.stateSecret, {
      session: provisional.session,
      sk: provisional.sessionKey,
      reservationId,
      amount: amountUsd,
    });

    const returnUrl = `${payBase}&cardnet=return&state=${encodeURIComponent(state)}`;
    const cancelUrl = `${payBase}&cardnet=cancel&state=${encodeURIComponent(state)}`;

    // 2) Final session with Return/Cancel URLs that include signed state
    let session = provisional.session;
    try {
      const final = await createCardnetSession(config, {
        amountUsd,
        reservationId,
        returnUrl,
        cancelUrl,
        pageLanguage,
        mobilePhone,
      });
      session = final.session;
      // Re-sign with the final SESSION + sk (verification must use matching pair)
      const finalState = await signCardnetState(config.stateSecret, {
        session: final.session,
        sk: final.sessionKey,
        reservationId,
        amount: amountUsd,
      });
      const finalReturn = `${payBase}&cardnet=return&state=${encodeURIComponent(finalState)}`;
      const finalCancel = `${payBase}&cardnet=cancel&state=${encodeURIComponent(finalState)}`;

      return res.status(200).json({
        session: final.session,
        authorizeUrl: cardnetAuthorizeUrl(config.env),
        returnUrl: finalReturn,
        cancelUrl: finalCancel,
        state: finalState,
        env: config.env,
      });
    } catch {
      // Fall back to provisional session; authorize form still posts ReturnUrl with state
      return res.status(200).json({
        session,
        authorizeUrl: cardnetAuthorizeUrl(config.env),
        returnUrl,
        cancelUrl,
        state,
        env: config.env,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cardnet session error";
    console.error("[cardnet/session]", message);
    return res.status(502).json({ error: message });
  }
}
