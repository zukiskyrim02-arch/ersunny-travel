import { useEffect, useState, type FormEvent } from "react";
import {
  ADMIN_PASSWORD,
  defaultConfig,
  getConfig,
  isAdminAuthed,
  resetConfig,
  saveConfig,
  setAdminAuthed,
  type AppConfig,
  type ManagedExcursion,
  type ManagedVehicle,
} from "../store/config";
import { useAppConfig, useReservations } from "../store/hooks";
import {
  deleteReservation,
  updateReservation,
  type ReservationStatus,
} from "../reservations";
import type { Zone } from "../data";
import { asset } from "../assets";

type Tab = "overview" | "prices" | "vehicles" | "excursions" | "reservations";

const statusLabel: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function Login({ onOk }: { onOk: () => void }) {
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
        <img src={asset("ersunny-logo.png")} alt="Ersunny Travel" width={180} height={100} />
        <h1>Panel admin</h1>
        <p>Gestiona precios, vehículos, excursiones y reservas.</p>
        <form onSubmit={submit}>
          <label htmlFor="admin-pass">Contraseña</label>
          <input
            id="admin-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--full">
            Entrar
          </button>
        </form>
        <a href="#/">← Volver al sitio</a>
      </div>
    </div>
  );
}

export function AdminApp() {
  const [authed, setAuthed] = useState(() => isAdminAuthed());
  const [tab, setTab] = useState<Tab>("overview");
  const liveConfig = useAppConfig();
  const reservations = useReservations();
  const [draft, setDraft] = useState<AppConfig>(() => getConfig());
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    setDraft(liveConfig);
  }, [liveConfig]);

  function persist(next: AppConfig) {
    setDraft(next);
    saveConfig(next);
    setSavedMsg("Cambios guardados");
    window.setTimeout(() => setSavedMsg(""), 2000);
  }

  if (!authed) {
    return <Login onOk={() => setAuthed(true)} />;
  }

  const pending = reservations.filter((r) => (r.status ?? "pending") === "pending").length;
  const paid = reservations.filter((r) => r.status === "paid" || r.status === "confirmed").length;

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <img src={asset("ersunny-logo.png")} alt="" width={140} height={78} />
        <p className="admin__brand">Admin</p>
        <nav>
          {(
            [
              ["overview", "Resumen"],
              ["prices", "Precios zonas"],
              ["vehicles", "Vehículos / tipos"],
              ["excursions", "Excursiones"],
              ["reservations", "Reservas"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "is-active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="admin__sidebar-foot">
          {savedMsg && <p className="admin-ok">{savedMsg}</p>}
          <a href="#/">Ver sitio</a>
          <button
            type="button"
            onClick={() => {
              setAdminAuthed(false);
              setAuthed(false);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin__main">
        {tab === "overview" && (
          <section>
            <h1>Resumen</h1>
            <div className="admin-stats">
              <article>
                <span>Reservas totales</span>
                <strong>{reservations.length}</strong>
              </article>
              <article>
                <span>Pendientes</span>
                <strong>{pending}</strong>
              </article>
              <article>
                <span>Pagadas / confirmadas</span>
                <strong>{paid}</strong>
              </article>
              <article>
                <span>Excursiones activas</span>
                <strong>{draft.excursions.filter((e) => e.active).length}</strong>
              </article>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  if (confirm("¿Restablecer precios, vehículos y excursiones a los valores por defecto?")) {
                    resetConfig();
                    setDraft(defaultConfig());
                    setSavedMsg("Configuración restablecida");
                  }
                }}
              >
                Restablecer catálogo
              </button>
            </div>
            <p className="admin-note">
              Los datos se guardan en este navegador (localStorage). Usa el mismo
              dispositivo/navegador para admin y pruebas del sitio.
            </p>
          </section>
        )}

        {tab === "prices" && (
          <PricesTab
            draft={draft}
            onChange={(zoneSurcharge) =>
              persist({ ...draft, zoneSurcharge })
            }
          />
        )}

        {tab === "vehicles" && (
          <VehiclesTab
            vehicles={draft.vehicles}
            onChange={(vehicles) => persist({ ...draft, vehicles })}
          />
        )}

        {tab === "excursions" && (
          <ExcursionsTab
            excursions={draft.excursions}
            onChange={(excursions) => persist({ ...draft, excursions })}
          />
        )}

        {tab === "reservations" && <ReservationsTab />}
      </main>
    </div>
  );
}

function PricesTab({
  draft,
  onChange,
}: {
  draft: AppConfig;
  onChange: (s: Record<Zone, number>) => void;
}) {
  const zones = Object.keys(draft.zoneSurcharge) as Zone[];
  return (
    <section>
      <h1>Precios por zona</h1>
      <p className="admin-lead">
        Recargo USD sumado al precio base del vehículo según la zona del hotel.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Zona</th>
              <th>Recargo (USD)</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone}>
                <td>{zone}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.zoneSurcharge[zone]}
                    onChange={(e) =>
                      onChange({
                        ...draft.zoneSurcharge,
                        [zone]: Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-note">
        Precio traslado ≈ precio base del vehículo + recargo de zona
        {` · ida y vuelta = ×2`}
      </p>
    </section>
  );
}

function VehiclesTab({
  vehicles,
  onChange,
}: {
  vehicles: ManagedVehicle[];
  onChange: (v: ManagedVehicle[]) => void;
}) {
  function update(id: string, patch: Partial<ManagedVehicle>) {
    onChange(vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function addVehicle() {
    const id = `veh-${Date.now().toString(36)}`;
    onChange([
      ...vehicles,
      {
        id,
        name: "Nuevo vehículo",
        capacity: "1–4 pasajeros",
        maxPassengers: 4,
        basePrice: 50,
      },
    ]);
  }

  function remove(id: string) {
    if (vehicles.length <= 1) {
      alert("Debe quedar al menos un tipo de vehículo.");
      return;
    }
    if (confirm("¿Eliminar este tipo de vehículo?")) {
      onChange(vehicles.filter((v) => v.id !== id));
    }
  }

  return (
    <section>
      <div className="admin-head-row">
        <h1>Vehículos / tipos</h1>
        <button type="button" className="btn btn--primary" onClick={addVehicle}>
          + Agregar
        </button>
      </div>
      <div className="admin-cards">
        {vehicles.map((v) => (
          <article key={v.id} className="admin-edit-card">
            <label>
              Nombre
              <input
                value={v.name}
                onChange={(e) => update(v.id, { name: e.target.value })}
              />
            </label>
            <label>
              Capacidad (texto)
              <input
                value={v.capacity}
                onChange={(e) => update(v.id, { capacity: e.target.value })}
              />
            </label>
            <label>
              Máx. pasajeros
              <input
                type="number"
                min={1}
                max={30}
                value={v.maxPassengers}
                onChange={(e) =>
                  update(v.id, { maxPassengers: Number(e.target.value) || 1 })
                }
              />
            </label>
            <label>
              Precio base (USD)
              <input
                type="number"
                min={0}
                value={v.basePrice}
                onChange={(e) =>
                  update(v.id, { basePrice: Number(e.target.value) || 0 })
                }
              />
            </label>
            <button type="button" className="admin-danger" onClick={() => remove(v.id)}>
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExcursionsTab({
  excursions,
  onChange,
}: {
  excursions: ManagedExcursion[];
  onChange: (e: ManagedExcursion[]) => void;
}) {
  function update(id: string, patch: Partial<ManagedExcursion>) {
    onChange(excursions.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addExcursion() {
    const title = "Nueva excursión";
    onChange([
      {
        id: slugify(title) + "-" + Date.now().toString(36).slice(-4),
        title,
        duration: "Día completo",
        blurb: "Descripción de la experiencia.",
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Incluye transporte", "Guía"],
        price: null,
        active: true,
      },
      ...excursions,
    ]);
  }

  function remove(id: string) {
    if (confirm("¿Eliminar esta excursión?")) {
      onChange(excursions.filter((e) => e.id !== id));
    }
  }

  return (
    <section>
      <div className="admin-head-row">
        <h1>Excursiones</h1>
        <button type="button" className="btn btn--primary" onClick={addExcursion}>
          + Agregar
        </button>
      </div>
      <div className="admin-cards">
        {excursions.map((e) => (
          <article key={e.id} className="admin-edit-card admin-edit-card--wide">
            <div className="admin-edit-card__row">
              <label>
                Título
                <input
                  value={e.title}
                  onChange={(ev) => update(e.id, { title: ev.target.value })}
                />
              </label>
              <label>
                Duración
                <input
                  value={e.duration}
                  onChange={(ev) => update(e.id, { duration: ev.target.value })}
                />
              </label>
              <label>
                Precio USD
                <input
                  type="number"
                  min={0}
                  placeholder="Pendiente"
                  value={e.price ?? ""}
                  onChange={(ev) =>
                    update(e.id, {
                      price:
                        ev.target.value === ""
                          ? null
                          : Number(ev.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={e.active}
                  onChange={(ev) => update(e.id, { active: ev.target.checked })}
                />
                Activa en el sitio
              </label>
            </div>
            <label>
              Descripción
              <textarea
                value={e.blurb}
                onChange={(ev) => update(e.id, { blurb: ev.target.value })}
                rows={2}
              />
            </label>
            <label>
              URL de imagen
              <input
                value={e.image}
                onChange={(ev) => update(e.id, { image: ev.target.value })}
              />
            </label>
            <label>
              Destacados (separados por coma)
              <input
                value={e.highlights.join(", ")}
                onChange={(ev) =>
                  update(e.id, {
                    highlights: ev.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <button type="button" className="admin-danger" onClick={() => remove(e.id)}>
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReservationsTab() {
  const items = useReservations();
  const [filter, setFilter] = useState<"all" | ReservationStatus>("all");
  const [q, setQ] = useState("");

  const filtered = items.filter((r) => {
    if (filter !== "all" && (r.status ?? "pending") !== filter) return false;
    if (!q.trim()) return true;
    const hay = `${r.id} ${r.name} ${r.contactInfo} ${r.origin} ${r.destination}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <section>
      <h1>Reservas</h1>
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Buscar ID, nombre, contacto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagadas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="admin-note">No hay reservas con ese filtro.</p>
      ) : (
        <div className="admin-res-list">
          {filtered.map((r) => (
            <article key={r.id} className="admin-res-card">
              <div className="admin-res-card__top">
                <div>
                  <strong>{r.id}</strong>
                  <span className={`admin-pill admin-pill--${r.status ?? "pending"}`}>
                    {statusLabel[r.status ?? "pending"]}
                  </span>
                  <span className="admin-pill admin-pill--kind">
                    {r.kind === "excursion" ? "Excursión" : "Traslado"}
                  </span>
                </div>
                <small>{new Date(r.createdAt).toLocaleString("es-DO")}</small>
              </div>
              <p>
                <strong>{r.name}</strong> · {r.contactInfo}
              </p>
              <p>
                {r.kind === "excursion"
                  ? `${r.destination} · pickup ${r.hotelPickup || r.origin}`
                  : `${r.origin} → ${r.destination}`}
              </p>
              <p>
                Fecha {r.date}
                {r.wantReturn && r.returnDate ? ` – ${r.returnDate}` : ""} ·{" "}
                {r.passengers} pax
                {r.price != null ? ` · ~$${r.price} USD` : " · precio a confirmar"}
              </p>
              {r.notes && <p className="admin-muted">Notas: {r.notes}</p>}
              <div className="admin-res-card__actions">
                <label>
                  Estado
                  <select
                    value={r.status ?? "pending"}
                    onChange={(e) =>
                      updateReservation(r.id, {
                        status: e.target.value as ReservationStatus,
                      })
                    }
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </label>
                <label>
                  Hora pickup
                  <input
                    type="text"
                    placeholder="Ej. 14:30"
                    value={r.pickupTime ?? ""}
                    onChange={(e) =>
                      updateReservation(r.id, {
                        pickupTime: e.target.value,
                        time: e.target.value || "Por confirmar",
                      })
                    }
                  />
                </label>
                <a
                  className="btn btn--primary"
                  href={`https://wa.me/${r.contactInfo.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${r.name}, sobre tu reserva ${r.id}:`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp cliente
                </a>
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() => {
                    if (confirm(`¿Eliminar reserva ${r.id}?`)) {
                      deleteReservation(r.id);
                    }
                  }}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
