import { useEffect, useState, type FormEvent } from "react";
import { useLogoSrc } from "./media/library";
import { useI18n } from "./i18n/I18nProvider";

type OpenState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "already" }
  | { kind: "ready"; name: string; service: string }
  | { kind: "thanks" };

function tokenFromUrl() {
  return new URLSearchParams(window.location.search).get("t") || "";
}

export function ReviewPage() {
  const { t } = useI18n();
  const logo = useLogoSrc();
  const token = tokenFromUrl();
  const [state, setState] = useState<OpenState>({ kind: "loading" });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/reviews/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          already?: boolean;
          name?: string;
          service?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "invalid" });
          return;
        }
        if (body.already) {
          setState({ kind: "already" });
          return;
        }
        setState({
          kind: "ready",
          name: body.name || "",
          service: body.service || "Ersunny Travel",
        });
      } catch {
        if (!cancelled) setState({ kind: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.kind !== "ready") return;
    if (rating < 1) {
      setError(t("survey.rating"));
      return;
    }
    if (comment.trim().length < 8) {
      setError(t("survey.short"));
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment }),
      });
      const body = (await res.json().catch(() => ({}))) as { already?: boolean };
      if (!res.ok) {
        setError(body.already ? t("survey.already") : t("survey.error"));
        return;
      }
      setState(body.already ? { kind: "already" } : { kind: "thanks" });
    } catch {
      setError(t("survey.error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="staff-pickup">
      <div className="staff-pickup__card survey-card">
        <a href="/">
          <img src={logo} alt="Ersunny Travel" width={96} height={96} />
        </a>
        {state.kind === "loading" && <p>{t("survey.sending")}</p>}
        {state.kind === "invalid" && (
          <>
            <h1>{t("survey.title")}</h1>
            <p>{t("survey.invalid")}</p>
          </>
        )}
        {state.kind === "already" && (
          <>
            <h1>{t("survey.thanks")}</h1>
            <p>{t("survey.already")}</p>
          </>
        )}
        {state.kind === "thanks" && (
          <>
            <h1>{t("survey.thanks")}</h1>
            <p>{t("survey.thanksLead")}</p>
            <a className="btn btn--primary" href="/">
              Ersunny Travel
            </a>
          </>
        )}
        {state.kind === "ready" && (
          <>
            <h1>{t("survey.title")}</h1>
            <p>{t("survey.lead", { service: state.service })}</p>
            <form className="staff-pickup__form" onSubmit={onSubmit}>
              <div>
                <span>{t("survey.rating")}</span>
                <div className="survey-stars" role="radiogroup" aria-label={t("survey.rating")}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      className={value <= rating ? "is-on" : ""}
                      onClick={() => setRating(value)}
                    >
                      <svg viewBox="0 0 20 20" width="28" height="28" aria-hidden>
                        <path
                          fill="currentColor"
                          d="M10 1.6 12.7 7l5.9.5-4.5 3.9 1.4 5.7L10 14.8 4.5 17.1l1.4-5.7L1.4 7.5 7.3 7 10 1.6Z"
                        />
                      </svg>
                      <span className="sr-only">{value}</span>
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span>{t("survey.comment")}</span>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={comment}
                  placeholder={t("survey.commentPh")}
                  onChange={(event) => setComment(event.target.value)}
                  required
                />
              </label>
              {error && <p className="staff-pickup__hint">{error}</p>}
              <button className="btn btn--primary" type="submit" disabled={sending}>
                {sending ? t("survey.sending") : t("survey.send")}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
