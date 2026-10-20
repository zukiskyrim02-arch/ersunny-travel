import { useMemo, useState } from "react";
import {
  deleteReservation,
  generateReservationId,
  saveReservation,
  updateReservation,
  upsertReservation,
  type Reservation,
  type ReservationStatus,
} from "../reservations";
import { sendServiceSurvey } from "../reviews";
import { useReservations } from "../store/hooks";

const statusLabel: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

function surveyMessage(error: string | undefined, already: boolean) {
  if (already) return "La encuesta ya se había enviado.";
  if (!error) return "Encuesta enviada al correo del cliente.";
  if (error === "no_email") return "No hay correo del cliente para enviar la encuesta.";
  if (error === "not_found") return "La reserva aún no está en la base. Espera un momento y márcala otra vez.";
  if (error === "not_configured") return "Falta Resend o la clave de sesión para enviar la encuesta.";
  return "No se pudo enviar la encuesta. Revisa el correo e inténtalo de nuevo.";
}

const emptyForm = (): Reservation => ({
  id: "",
  kind: "transfer",
  name: "",
  contactInfo: "",
  email: "",
  origin: "Punta Cana Airport (PUJ)",
  destination: "",
  date: "",
  time: "Por confirmar",
  passengers: 2,
  vehicle: "SUV",
  wantReturn: false,
  price: null,
  createdAt: new Date().toISOString(),
  status: "pending",
});

export function ReservationsPanel({
  query,
  onQuery,
}: {
  query?: string;
  onQuery?: (value: string) => void;
} = {}) {
  const items = useReservations();
  const [filter, setFilter] = useState<"all" | ReservationStatus>("all");
  const [kind, setKind] = useState<"all" | "transfer" | "excursion">("all");
  const [localQuery, setLocalQuery] = useState("");
  const q = query ?? localQuery;
  const setQ = onQuery ?? setLocalQuery;
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [surveyNote, setSurveyNote] = useState("");

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (filter !== "all" && (r.status ?? "pending") !== filter) return false;
      if (kind !== "all" && (r.kind ?? "transfer") !== kind) return false;
      if (!q.trim()) return true;
      const hay =
        `${r.id} ${r.name} ${r.contactInfo} ${r.email ?? ""} ${r.origin} ${r.destination}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [items, filter, kind, q]);

  function openCreate() {
    setCreating(true);
    setEditing({
      ...emptyForm(),
      id: generateReservationId("transfer"),
    });
  }

  async function requestSurvey(id: string) {
    const result = await sendServiceSurvey(id);
    if (result.ok) {
      updateReservation(id, { surveySentAt: new Date().toISOString() });
    }
    setSurveyNote(surveyMessage(result.ok ? undefined : result.error, result.ok && result.already));
  }

  function saveEdit(res: Reservation) {
    const saved = {
      ...res,
      id: res.id || generateReservationId(res.kind),
      createdAt: res.createdAt || new Date().toISOString(),
    };
    if (creating) saveReservation(saved);
    else upsertReservation(saved);
    setEditing(null);
    setCreating(false);
    if (saved.status === "completed" && !saved.surveySentAt) {
      void requestSurvey(saved.id);
    }
  }

  function changeStatus(reservation: Reservation, status: ReservationStatus) {
    updateReservation(reservation.id, { status });
    if (status === "completed" && !reservation.surveySentAt) {
      void requestSurvey(reservation.id);
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Reservas</h1>
          <p>
            Consulta, edita y crea traslados y excursiones. Al marcar una reserva
            como completada se envía la encuesta al correo del cliente.
          </p>
          {surveyNote && <p className="admin-ok">{surveyNote}</p>}
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Nueva reserva
        </button>
      </header>

      <div className="admin-filters">
        <input
          type="search"
          placeholder="Buscar ID, nombre, email, destino…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagadas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="all">Todos los tipos</option>
          <option value="transfer">Traslados</option>
          <option value="excursion">Excursiones</option>
        </select>
      </div>

      {editing && (
        <ReservationEditor
          value={editing}
          isNew={creating}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={saveEdit}
        />
      )}

      {filtered.length === 0 ? (
        <p className="admin-note">No hay reservas con ese filtro.</p>
      ) : (
        <div className="admin-res-list">
          {filtered.map((r) => (
            <article key={r.id} className="admin-res-card">
              <div className="admin-res-card__top">
                <div>
                  <strong>{r.id}</strong>
                  <span
                    className={`admin-pill admin-pill--${r.status ?? "pending"}`}
                  >
                    {statusLabel[r.status ?? "pending"]}
                  </span>
                  <span className="admin-pill admin-pill--kind">
                    {r.kind === "excursion" ? "Excursión" : "Traslado"}
                  </span>
                  {r.customerConfirmed && (
                    <span className="admin-pill admin-pill--ok">Cliente OK</span>
                  )}
                </div>
                <small>{new Date(r.createdAt).toLocaleString("es-DO")}</small>
              </div>
              <p>
                <strong>{r.name}</strong> · {r.contactInfo}
                {r.email ? ` · ${r.email}` : ""}
              </p>
              <p>
                {r.kind === "excursion"
                  ? `${r.destination} · pickup ${r.hotelPickup || r.origin}`
                  : `${r.origin} → ${r.destination}`}
              </p>
              <p>
                Fecha {r.date}
                {r.wantReturn && r.returnDate ? ` – ${r.returnDate}` : ""} ·{" "}
                {r.passengers} pax · {r.vehicle}
                {r.price != null
                  ? ` · US$${r.price}`
                  : " · precio a confirmar"}
              </p>
              {(r.pickupTime || r.time) && (
                <p className="admin-muted">
                  Pickup: {r.pickupTime || r.time}
                  {r.returnTime ? ` · Retorno: ${r.returnTime}` : ""}
                </p>
              )}
              {r.flight && <p className="admin-muted">Vuelo: {r.flight}</p>}
              {r.notes && <p className="admin-muted">Notas: {r.notes}</p>}

              <div className="admin-res-card__actions">
                <label>
                  Estado
                  <select
                    value={r.status ?? "pending"}
                    onChange={(e) =>
                      changeStatus(r, e.target.value as ReservationStatus)
                    }
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </label>
                <label>
                  Hora pickup
                  <input
                    type="text"
                    placeholder="14:30"
                    value={r.pickupTime ?? ""}
                    onChange={(e) =>
                      updateReservation(r.id, {
                        pickupTime: e.target.value,
                        time: e.target.value || "Por confirmar",
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setCreating(false);
                    setEditing({ ...r });
                  }}
                >
                  Editar
                </button>
                <a
                  className="btn btn--primary"
                  href={`https://wa.me/${r.contactInfo.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${r.name}, sobre tu reserva ${r.id}:`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
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

function ReservationEditor({
  value,
  isNew,
  onSave,
  onCancel,
}: {
  value: Reservation;
  isNew: boolean;
  onSave: (r: Reservation) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(value);

  function patch(p: Partial<Reservation>) {
    setForm((f) => ({ ...f, ...p }));
  }

  return (
    <form
      className="admin-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <h2>{isNew ? "Nueva reserva" : `Editar ${form.id}`}</h2>
      <div className="admin-edit-card__row">
        <label>
          ID
          <input
            value={form.id}
            onChange={(e) => patch({ id: e.target.value })}
            required
            disabled={!isNew}
          />
        </label>
        <label>
          Tipo
          <select
            value={form.kind}
            onChange={(e) => {
              const nextKind = e.target.value as Reservation["kind"];
              patch({
                kind: nextKind,
                id: isNew ? generateReservationId(nextKind) : form.id,
              });
            }}
          >
            <option value="transfer">Traslado</option>
            <option value="excursion">Excursión</option>
          </select>
        </label>
        <label>
          Estado
          <select
            value={form.status ?? "pending"}
            onChange={(e) =>
              patch({ status: e.target.value as ReservationStatus })
            }
          >
            <option value="pending">Pendiente</option>
            <option value="paid">Pagada</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </label>
      </div>
      <div className="admin-edit-card__row">
        <label>
          Nombre
          <input
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            required
          />
        </label>
        <label>
          WhatsApp / contacto
          <input
            value={form.contactInfo}
            onChange={(e) => patch({ contactInfo: e.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => patch({ email: e.target.value })}
          />
        </label>
      </div>
      <div className="admin-edit-card__row">
        <label>
          Origen
          <input
            value={form.origin}
            onChange={(e) => patch({ origin: e.target.value })}
          />
        </label>
        <label>
          Destino / excursión
          <input
            value={form.destination}
            onChange={(e) => patch({ destination: e.target.value })}
          />
        </label>
        <label>
          Hotel pickup
          <input
            value={form.hotelPickup ?? ""}
            onChange={(e) => patch({ hotelPickup: e.target.value })}
          />
        </label>
      </div>
      <div className="admin-edit-card__row">
        <label>
          Fecha
          <input
            type="date"
            value={form.date}
            onChange={(e) => patch({ date: e.target.value })}
            required
          />
        </label>
        <label>
          Hora / pickup
          <input
            value={form.pickupTime ?? form.time}
            onChange={(e) =>
              patch({ pickupTime: e.target.value, time: e.target.value })
            }
          />
        </label>
        <label>
          Pasajeros
          <input
            type="number"
            min={1}
            value={form.passengers}
            onChange={(e) =>
              patch({ passengers: Number(e.target.value) || 1 })
            }
          />
        </label>
        <label>
          Vehículo
          <input
            value={form.vehicle}
            onChange={(e) => patch({ vehicle: e.target.value })}
          />
        </label>
        <label>
          Precio US$
          <input
            type="number"
            min={0}
            value={form.price ?? ""}
            onChange={(e) =>
              patch({
                price:
                  e.target.value === "" ? null : Number(e.target.value) || 0,
              })
            }
          />
        </label>
      </div>
      <div className="admin-edit-card__row">
        <label>
          Vuelo
          <input
            value={form.flight ?? ""}
            onChange={(e) => patch({ flight: e.target.value })}
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.wantReturn}
            onChange={(e) => patch({ wantReturn: e.target.checked })}
          />
          Ida y vuelta
        </label>
        <label>
          Fecha retorno
          <input
            type="date"
            value={form.returnDate ?? ""}
            onChange={(e) => patch({ returnDate: e.target.value })}
          />
        </label>
        <label>
          Hora retorno
          <input
            value={form.returnTime ?? ""}
            onChange={(e) => patch({ returnTime: e.target.value })}
          />
        </label>
      </div>
      <label>
        Notas
        <textarea
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>
      <div className="admin-editor__actions">
        <button type="submit" className="btn btn--primary">
          Guardar
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
