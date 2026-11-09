import type { VercelRequest, VercelResponse } from "@vercel/node";
import { vercelHandler } from "../../server/vercelHandler.js";

const ALLOWED = new Set(["request", "verify", "session", "logout"]);

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.action;
  const action = Array.isArray(raw) ? raw[0] : raw;
  if (!action || !ALLOWED.has(action)) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  return vercelHandler(`/api/auth/${action}`)(req, res);
}
