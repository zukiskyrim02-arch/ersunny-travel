import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  cardnetAuthorizeUrl,
  createCardnetSession,
  getCardnetConfig,
  isCardnetApproved,
  signCardnetState,
  verifyCardnetSession,
  verifyCardnetState,
} from "./server/cardnet.js";

/** Local `/api/cardnet/*` for Vite so Cardnet works without `vercel dev`. */
function cardnetDevApi(): Plugin {
  return {
    name: "cardnet-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/cardnet/")) return next();

        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
          }
          const raw = Buffer.concat(chunks).toString("utf8");
          const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

          if (url.startsWith("/api/cardnet/session") && req.method === "POST") {
            const reservationId = String(body.reservationId || "").trim();
            const amountUsd = Number(body.amountUsd);
            const origin = String(body.origin || "").replace(/\/$/, "");
            const pageLanguage = body.pageLanguage === "SPA" ? "SPA" : "ENG";
            const mobilePhone = String(body.mobilePhone || "");
            if (!reservationId || !origin || !(amountUsd > 0)) {
              return send(400, { error: "reservationId, origin, amountUsd required" });
            }

            const config = getCardnetConfig();
            const payBase = `${origin}/payment?id=${encodeURIComponent(reservationId)}`;

            const provisional = await createCardnetSession(config, {
              amountUsd,
              reservationId,
              returnUrl: `${payBase}&cardnet=return`,
              cancelUrl: `${payBase}&cardnet=cancel`,
              pageLanguage,
              mobilePhone,
            });

            let session = provisional.session;
            let sk = provisional.sessionKey;
            try {
              const final = await createCardnetSession(config, {
                amountUsd,
                reservationId,
                returnUrl: `${payBase}&cardnet=return`,
                cancelUrl: `${payBase}&cardnet=cancel`,
                pageLanguage,
                mobilePhone,
              });
              session = final.session;
              sk = final.sessionKey;
            } catch {
              /* keep provisional */
            }

            const state = await signCardnetState(config.stateSecret, {
              session,
              sk,
              reservationId,
              amount: amountUsd,
            });
            const returnUrl = `${payBase}&cardnet=return&state=${encodeURIComponent(state)}`;
            const cancelUrl = `${payBase}&cardnet=cancel&state=${encodeURIComponent(state)}`;

            return send(200, {
              session,
              authorizeUrl: cardnetAuthorizeUrl(config.env),
              returnUrl,
              cancelUrl,
              state,
              env: config.env,
            });
          }

          if (url.startsWith("/api/cardnet/verify") && req.method === "POST") {
            const state = String(body.state || "").trim();
            if (!state) return send(400, { error: "state required" });
            const config = getCardnetConfig();
            const payload = await verifyCardnetState(config.stateSecret, state);
            const result = await verifyCardnetSession(
              config,
              payload.session,
              payload.sk,
            );
            return send(200, {
              approved: isCardnetApproved(result),
              reservationId: payload.reservationId,
              amount: payload.amount,
              session: payload.session,
              result,
            });
          }

          return send(404, { error: "Not found" });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Cardnet API error";
          console.error("[vite cardnet api]", message);
          return send(502, { error: message });
        }
      });
    },
  };
}

// Root base for custom domain (www.ersunnytravel.com / Vercel).
// Override with VITE_BASE=/ersunny-travel/ only if you still need GitHub Pages project path.
export default defineConfig({
  plugins: [react(), cardnetDevApi()],
  base: process.env.VITE_BASE || "/",
  appType: "spa",
});
