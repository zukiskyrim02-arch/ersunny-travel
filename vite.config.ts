import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { cardnetPaymentUrl } from "./server/cardnet.js";
import { adminDevApi } from "./server/devApi.js";
import { applyEnvFile } from "./server/envFile.js";
import { readJsonObject } from "./server/paymentGuards.js";
import { postCardnetSession, postCardnetVerify } from "./server/paymentRoute.js";
import { securityHeaderRecord } from "./server/securityHeaders.js";

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
          const parsed = readJsonObject(raw);
          if (!parsed.ok) return send(400, { error: "invalid_json" });
          const body = parsed.value;
          const remoteIp = String(req.socket.remoteAddress || "");

          if (url.startsWith("/api/cardnet/session") && req.method === "POST") {
            const result = await postCardnetSession(body, remoteIp);
            return send(result.status, result.json, result.cookies);
          }

          if (url.startsWith("/api/cardnet/verify") && req.method === "POST") {
            const cookie = Array.isArray(req.headers.cookie)
              ? req.headers.cookie.join("; ")
              : req.headers.cookie;
            const result = await postCardnetVerify(
              body,
              remoteIp,
              cookie,
              req.headers.host,
            );
            return send(result.status, result.json, result.cookies);
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
    server: {
      headers: securityHeaderRecord({ upgradeInsecure: false }),
    },
  };
});
