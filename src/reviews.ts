import { useEffect, useState } from "react";
import { reviewsEnabled } from "../shared/features";

export type PublicReview = {
  id: string;
  name: string;
  service: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export function useReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!reviewsEnabled) {
      setReady(true);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/reviews/public", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { reviews?: PublicReview[] };
        if (!cancelled) setReviews(Array.isArray(body.reviews) ? body.reviews : []);
      } catch {
        /* The section stays empty until the next try. */
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 30000);
    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  return { reviews, ready };
}

export async function sendServiceSurvey(id: string) {
  const res = await fetch("/api/reviews/invite", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    already?: boolean;
    error?: string;
  };
  if (!res.ok) return { ok: false as const, error: body.error || "email_failed" };
  return { ok: true as const, already: Boolean(body.already) };
}
