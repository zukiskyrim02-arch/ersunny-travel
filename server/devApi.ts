import type { Plugin } from "vite";
import { dispatchAdminApi } from "./adminApi.js";
import { applyEnvFile } from "./envFile.js";

function isAdminApi(url: string) {
  return (
    url.startsWith("/api/auth/") ||
    url === "/api/media" ||
    url.startsWith("/api/media/") ||
    url === "/api/flights" ||
    url === "/api/reviews" ||
    url.startsWith("/api/reviews/")
  );
}

/** Local admin, media, flight, and review APIs so they work without `vercel dev`. */
export function adminDevApi(): Plugin {
  return {
    name: "admin-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || "").split("?")[0] || "";
        if (!isAdminApi(url)) return next();
        applyEnvFile();

        const send = (
          status: number,
          body: unknown,
          cookies?: string[],
        ) => {
          res.statusCode = status;
          if (cookies?.length) res.setHeader("Set-Cookie", cookies);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(body));
        };

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const raw = Buffer.concat(chunks).toString("utf8");
          if (raw.length > 1_000_000) {
            return send(413, { error: "too_large" });
          }
          let body: Record<string, unknown> = {};
          if (raw) {
            try {
              body = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              return send(400, { error: "generic" });
            }
          }
          const forwarded = req.headers["x-forwarded-for"];
          const headerIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
          const ip =
            headerIp?.split(",")[0]?.trim() ||
            req.socket.remoteAddress ||
            "local";
          const cookie = Array.isArray(req.headers.cookie)
            ? req.headers.cookie.join("; ")
            : req.headers.cookie;
          const origin = Array.isArray(req.headers.origin)
            ? req.headers.origin[0]
            : req.headers.origin;
          const result = await dispatchAdminApi({
            method: req.method || "GET",
            path: url,
            body,
            cookie,
            ip,
            origin,
          });
          return send(result.status, result.body, result.cookies);
        } catch (err) {
          console.error(
            "[admin dev api]",
            err instanceof Error ? err.message : err,
          );
          return send(500, { error: "server_error" });
        }
      });
    },
  };
}
