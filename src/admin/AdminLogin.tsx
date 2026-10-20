import { useState, type FormEvent } from "react";
import { LanguageSwitch } from "../LanguageSwitch";
import { useI18n } from "../i18n/I18nProvider";
import { useLogoSrc } from "../media/library";
import { adminCopy, adminError } from "./copy";

export function AdminLogin({ onOk }: { onOk: () => void }) {
  const { locale } = useI18n();
  const copy = adminCopy(locale);
  const logo = useLogoSrc();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    const next = email.trim();
    if (!next) {
      setError(copy.emailRequired);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(adminError(copy, data.error || "generic"));
        return;
      }
      setStep("code");
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const next = code.replace(/\D/g, "");
    if (next.length !== 6) {
      setError(copy.codeRequired);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(adminError(copy, data.error || "invalid_code"));
        return;
      }
      onOk();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__top">
          <img src={logo} alt="Ersunny Travel" width={160} height={160} />
          <LanguageSwitch compact />
        </div>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
        {step === "email" ? (
          <form onSubmit={(e) => void requestCode(e)}>
            <label htmlFor="admin-email">{copy.email}</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              autoFocus
              required
              placeholder="admin@ersunnytravel.com"
            />
            {error && <p className="admin-error">{error}</p>}
            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={busy}
            >
              {busy ? copy.sending : copy.sendCode}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => void verify(e)}>
            <p>{copy.sent}</p>
            <label htmlFor="admin-code">{copy.code}</label>
            <input
              id="admin-code"
              className="admin-login__code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              required
              placeholder="000000"
            />
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-login__actions">
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={busy}
              >
                {busy ? copy.checking : copy.enter}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--full"
                disabled={busy}
                onClick={() => void requestCode()}
              >
                {copy.resend}
              </button>
              <button
                type="button"
                className="admin-linkish"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
              >
                {copy.changeEmail}
              </button>
            </div>
          </form>
        )}
        <a href="/">{copy.back}</a>
      </div>
    </div>
  );
}
