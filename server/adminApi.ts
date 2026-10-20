import { clearCookie, readSessionEmail, SESSION_COOKIE } from "./cookies.js";
import { requestAdminCode, verifyAdminCode, type ApiResult } from "./authFlow.js";
import { lookupFlights } from "./flights.js";
import {
  adminMediaList,
  assignMedia,
  deleteMedia,
  publicMedia,
  registerMedia,
  signMediaUpload,
} from "./mediaFlow.js";
import {
  inviteReview,
  openReview,
  publicReviews,
  submitReview,
} from "./reviews.js";

export type { ApiResult };

type DispatchInput = {
  method: string;
  path: string;
  body: Record<string, unknown>;
  cookie?: string;
  ip: string;
  origin?: string;
};

function unauthorized(): ApiResult {
  return { status: 401, body: { error: "unauthorized" } };
}

export async function dispatchAdminApi(input: DispatchInput): Promise<ApiResult> {
  const method = input.method.toUpperCase();
  const path = input.path.replace(/\/$/, "") || "/";

  if (method === "POST" && path === "/api/auth/request") {
    return requestAdminCode(input.body, input.cookie, input.ip);
  }
  if (method === "POST" && path === "/api/auth/verify") {
    return verifyAdminCode(input.body, input.cookie, input.ip);
  }
  if (method === "GET" && path === "/api/auth/session") {
    const email = readSessionEmail(input.cookie);
    return email
      ? { status: 200, body: { ok: true, email } }
      : { status: 200, body: { ok: false } };
  }
  if (method === "POST" && path === "/api/auth/logout") {
    return {
      status: 200,
      body: { ok: true },
      cookies: [clearCookie(SESSION_COOKIE)],
    };
  }
  if (method === "GET" && path === "/api/media/public") {
    return publicMedia();
  }
  if (method === "GET" && path === "/api/reviews/public") {
    return publicReviews();
  }
  if (method === "POST" && path === "/api/reviews/open") {
    return openReview(input.body);
  }
  if (method === "POST" && path === "/api/reviews") {
    return submitReview(input.body);
  }

  const session = readSessionEmail(input.cookie);
  if (method === "GET" && path === "/api/media") {
    if (!session) return unauthorized();
    return adminMediaList();
  }
  if (method === "POST" && path === "/api/media/sign") {
    if (!session) return unauthorized();
    return signMediaUpload(input.body);
  }
  if (method === "POST" && path === "/api/media/register") {
    if (!session) return unauthorized();
    return registerMedia(input.body);
  }
  if (method === "POST" && path === "/api/media/assign") {
    if (!session) return unauthorized();
    return assignMedia(input.body);
  }
  if (method === "POST" && path === "/api/media/delete") {
    if (!session) return unauthorized();
    return deleteMedia(input.body);
  }
  if (method === "POST" && path === "/api/flights") {
    if (!session) return unauthorized();
    return lookupFlights(input.body);
  }
  if (method === "POST" && path === "/api/reviews/invite") {
    if (!session) return unauthorized();
    return inviteReview(input.body, input.origin);
  }

  return { status: 404, body: { error: "not_found" } };
}
