import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  cardnetStateCookie,
  clearCardnetCookie,
  readCardnetState,
} from "./server/cookies.js";
import {
  cardnetAuthorizeUrl,
  cardnetPaymentUrl,
  cardnetReturnUrl,
  createCardnetSession,
  getCardnetConfig,
  cardnetOutcome,
  signCardnetState,
  verifyCardnetSession,
  verifyCardnetState,
} from "./server/cardnet.js";
import { verifyRecaptcha } from "./server/recaptcha.js";
import { adminDevApi } from "./server/devApi.js";
import { applyEnvFile } from "./server/envFile.js";

/** Local `/api/cardnet/*` for Vite so Cardnet works without `vercel dev`. */
function cardnetDevApi(): Plugin {
  return {
    name: "cardnet-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/cardnet/")) return next();
        applyEnvFile();

        const send = (status: number, body: unknown, cookies?: string[]) => {
          res.statusCode = status;
          if (cookies?.length) res.setHeader("Set-Cookie", cookies);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const requestUrl = new URL(url, "http://localhost");
        const flag = requestUrl.searchParams.get("cardnet");
        if (
          requestUrl.pathname === "/api/cardnet/verify" &&
          (req.method === "GET" || req.method === "POST") &&
          (flag === "return" || flag === "cancel")
        ) {
          const host = String(req.headers.host || "localhost");
          res.statusCode = 303;
          res.setHeader(
            "Location",
            cardnetPaymentUrl(`http://${host}`, requestUrl.searchParams.get("id") || "", flag),
          );
          res.setHeader("Cache-Control", "no-store");
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
            const remoteIp = String(req.socket.remoteAddress || "");
            if (!(await verifyRecaptcha(String(body.captchaToken || ""), remoteIp))) {
              return send(400, { error: "captcha" });
            }
            if (body.intent === "paypal") return send(200, { ok: true });

            const reservationId = String(body.reservationId || "").trim();
            const amountUsd = Number(body.amountUsd);
            const origin = String(body.origin || "").replace(/\/$/, "");
            const pageLanguage = String(body.pageLanguage || "");
            const mobilePhone = String(body.mobilePhone || "");
            const email = String(body.email || "");
            const addressLine = String(body.addressLine || "");
            if (!reservationId || !origin || !(amountUsd > 0)) {
              return send(400, { error: "reservationId, origin, amountUsd required" });
            }

            const config = getCardnetConfig();
            const returnUrl = cardnetReturnUrl(origin, reservationId, "return");
            const cancelUrl = cardnetReturnUrl(origin, reservationId, "cancel");

            const created = await createCardnetSession(config, {
              amountUsd,
              reservationId,
              returnUrl,
              cancelUrl,
              pageLanguage,
              mobilePhone,
              email,
              clientIp: remoteIp,
              addressLine,
            });

            const state = await signCardnetState(config.stateSecret, {
              session: created.session,
              sk: created.sessionKey,
              reservationId,
              amount: amountUsd,
            });
            const session = created.session;

            return send(
              200,
              {
                session,
                authorizeUrl: cardnetAuthorizeUrl(config.env),
                returnUrl,
                cancelUrl,
                state,
                env: config.env,
              },
              [cardnetStateCookie(state, new URL(origin).host)],
            );
          }

          if (url.startsWith("/api/cardnet/verify") && req.method === "POST") {
            const cookie = Array.isArray(req.headers.cookie)
              ? req.headers.cookie.join("; ")
              : req.headers.cookie;
            const state = String(body.state || "").trim() || readCardnetState(cookie);
            if (!state) {
              return send(400, { error: "state required" }, [clearCardnetCookie(req.headers.host)]);
            }
            const config = getCardnetConfig();
            const payload = await verifyCardnetState(config.stateSecret, state);
            const result = await verifyCardnetSession(
              config,
              payload.session,
              payload.sk,
            );
            const outcome = cardnetOutcome(result);
            return send(
              200,
              {
                approved: outcome.approved,
                authorizationCode: outcome.authorizationCode,
                responseCode: outcome.responseCode,
                reservationId: payload.reservationId,
                amount: payload.amount,
                session: payload.session,
              },
              [clearCardnetCookie(req.headers.host)],
            );
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
export default defineConfig(({ mode }) => {
  applyEnvFile();
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return {
    plugins: [react(), cardnetDevApi(), adminDevApi()],
    base: process.env.VITE_BASE || "/",
    appType: "spa",
  };
});
