import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jsonObject, validatePresentFields } from "./paymentGuards.js";
import { dispatchAdminApi } from "./adminApi.js";

function asBody(body: unknown): Record<string, unknown> | null {
  const parsed = jsonObject(body);
  return parsed.ok ? parsed.value : null;
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
      const method = (req.method || "GET").toUpperCase();
      const parsed = asBody(req.body);
      if ((method === "POST" || method === "PUT" || method === "PATCH") && !parsed) {
        res.status(400).json({ error: "invalid_json" });
        return;
      }
      const body = parsed ?? {};
      const fieldError = validatePresentFields(body);
      if (fieldError) {
        res.status(400).json({ error: fieldError });
        return;
      }
      const result = await dispatchAdminApi({
        method,
        path,
        body,
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
