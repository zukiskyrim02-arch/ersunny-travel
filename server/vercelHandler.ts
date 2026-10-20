import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dispatchAdminApi } from "./adminApi.js";

function asBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") return body as Record<string, unknown>;
  return {};
}

export function vercelHandler(path: string) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    try {
      const forwarded = req.headers["x-forwarded-for"];
      const headerIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const ip = (headerIp || "").split(",")[0]?.trim() || "unknown";
      const origin = Array.isArray(req.headers.origin)
        ? req.headers.origin[0]
        : req.headers.origin;
      const result = await dispatchAdminApi({
        method: req.method || "GET",
        path,
        body: asBody(req.body),
        cookie: req.headers.cookie,
        ip,
        origin,
      });
      res.setHeader("Cache-Control", "no-store");
      if (result.cookies?.length) res.setHeader("Set-Cookie", result.cookies);
      res.status(result.status).json(result.body);
    } catch (err) {
      console.error("[admin api]", err instanceof Error ? err.message : err);
      res.status(500).json({ error: "server_error" });
    }
  };
}
