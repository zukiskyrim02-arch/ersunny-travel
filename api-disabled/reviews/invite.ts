import type { VercelRequest, VercelResponse } from "@vercel/node";
import { vercelHandler } from "../../server/vercelHandler.js";

const handle = vercelHandler("/api/reviews/invite");

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handle(req, res);
}
