import { useState, type FormEvent } from "react";
import "../admin.css";
import { ADMIN_PASSWORD, setAdminAuthed } from "../store/config";
import { logoSrc } from "../assets";

export function AdminLogin({ onOk }: { onOk: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAdminAuthed(true);
      onOk();
      return;
    }
    setError("Contraseña incorrecta.");
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <img src={logoSrc()} alt="Ersunny Travel" width={160} height={160} />
        <h1>Panel de administración</h1>
        <p>
          Accede para gestionar reservas, traslados, excursiones y el contenido
          del sitio.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="admin-pass">Contraseña</label>
          <input
            id="admin-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            placeholder="••••••••"
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--full">
            Entrar al panel
          </button>
        </form>
        <a href="/">← Volver al sitio público</a>
      </div>
    </div>
  );
}
