import { useMemo, useState } from "react";
import {
  generateReservationId,
  saveReservation,
  updateReservation,
  upsertReservation,
  type Reservation,
  type ReservationStatus,
} from "../reservations";
import { sendPickupTimesToCustomer } from "../notifyBooking";
import { sendServiceSurvey } from "../reviews";
import { formatDisplayDate, formatDisplayTime } from "../../shared/datetime";
import { reviewsEnabled } from "../../shared/features";
import { useReservations } from "../store/hooks";
import { AdminPager } from "./AdminPager";
import { usePagination } from "./pagination";



const statusLabel: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  refunded: "Devuelta",
};

function money(price: number | null | undefined) {
  if (price == null || !Number.isFinite(price)) return "A confirmar";
  return `US$${price.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function whatsappDigits(contactInfo: string) {
  return contactInfo.replace(/\D/g, "");
}

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState("");

  const filtered = useMemo(() => {
    return items
      .filter((r) => {
        if (filter !== "all" && (r.status ?? "pending") !== filter) return false;
        if (kind !== "all" && (r.kind ?? "transfer") !== kind) return false;
        if (!q.trim()) return true;
        const hay =
          `${r.id} ${r.name} ${r.contactInfo} ${r.email ?? ""} ${r.origin} ${r.destination}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [items, filter, kind, q]);

  const {
    page: safePage,
    setPage,
    pageCount,
    pageSize,
    paged,
    total,
    resetPage,
  } = usePagination(filtered);

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
    if (reviewsEnabled && saved.status === "completed" && !saved.surveySentAt) {
      void requestSurvey(saved.id);
    }
  }

  async function confirmPickupTime(reservation: Reservation) {
    const pickupTime = (reservation.pickupTime || "").trim();
    if (!pickupTime || /por confirmar|to be confirmed/i.test(pickupTime)) {
      setConfirmNote("Escribe la hora de pickup antes de confirmar.");
      return;
    }
    setConfirmingId(reservation.id);
    setConfirmNote("");
    const updated = {
      ...reservation,
      pickupTime,
      time: pickupTime,
      pickupConfirmedAt: new Date().toISOString(),
      customerConfirmed: false,
    };
    updateReservation(reservation.id, {
      pickupTime,
      time: pickupTime,
      pickupConfirmedAt: updated.pickupConfirmedAt,
      customerConfirmed: false,
    });
    try {
      await sendPickupTimesToCustomer(updated);
      setConfirmNote(`Hora confirmada y enviada al cliente · ${reservation.id}`);
    } catch {
      setConfirmNote(
        `Hora guardada en ${reservation.id}, pero no se pudo enviar el correo. Avísale por WhatsApp.`,
      );
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <section className="admin-panel admin-res">
      <header className="admin-panel__head">
        <div>
          <h1>Reservas</h1>
          <p>
            {reviewsEnabled
              ? "Traslados y excursiones. Al completar una reserva se envía la encuesta al cliente."
              : "Traslados y excursiones en un solo lugar."}
          </p>
          {surveyNote && <p className="admin-ok">{surveyNote}</p>}
          {confirmNote && <p className="admin-ok">{confirmNote}</p>}
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Nueva reserva
        </button>
      </header>

      <div className="admin-res__toolbar">
        <label className="admin-res__search">
          <span className="visually-hidden">Buscar reservas</span>
          <input
            type="search"
            placeholder="Buscar ID, nombre, email, destino…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
          />
        </label>
        <select
          value={filter}
          aria-label="Filtrar por estado"
          onChange={(e) => {
            setFilter(e.target.value as typeof filter);
            resetPage();
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagadas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="refunded">Devueltas</option>
        </select>
        <select
          value={kind}
          aria-label="Filtrar por tipo"
          onChange={(e) => {
            setKind(e.target.value as typeof kind);
            resetPage();
          }}
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
        <>
          <div className="admin-res-list">
            {paged.map((r) => {
              const wa = whatsappDigits(r.contactInfo);
              const route =
                r.kind === "excursion"
                  ? r.destination
                  : `${r.origin} → ${r.destination}`;
              return (
                <article key={r.id} className="admin-res-card">
                  <div className="admin-res-card__top">
                    <div className="admin-res-card__id">
                      <strong>{r.id}</strong>
                      <div className="admin-res-card__tags">
                        <span
                          className={`admin-pill admin-pill--${r.status ?? "pending"}`}
                        >
                          {statusLabel[r.status ?? "pending"]}
                        </span>
                        <span className="admin-pill admin-pill--kind">
                          {r.kind === "excursion" ? "Excursión" : "Traslado"}
                        </span>
                        {r.pickupConfirmedAt && (
                          <span className="admin-pill admin-pill--pickup">
                            Hora confirmada
                          </span>
                        )}
                        {r.customerConfirmed && (
                          <span className="admin-pill admin-pill--ok">
                            Cliente OK
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="admin-res-card__price">
                      <b>{money(r.price)}</b>
                      <small>
                        {new Date(r.createdAt).toLocaleString("es-DO", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                    </div>
                  </div>

                  <div className="admin-res-card__body">
                    <div className="admin-res-card__guest">
                      <strong>{r.name || "Sin nombre"}</strong>
                      <span>{r.contactInfo || "Sin contacto"}</span>
                      {r.email ? <span>{r.email}</span> : null}
                    </div>

                    <div className="admin-res-card__facts">
                      <div>
                        <span>Ruta</span>
                        <strong>{route}</strong>
                        {r.kind === "excursion" && (r.hotelPickup || r.origin) ? (
                          <small>Pickup {r.hotelPickup || r.origin}</small>
                        ) : null}
                      </div>
                      <div>
                        <span>Fecha</span>
                        <strong>
                          {formatDisplayDate(r.date)}
                          {r.wantReturn && r.returnDate
                            ? ` – ${formatDisplayDate(r.returnDate)}`
                            : ""}
                        </strong>
                      </div>
                      <div>
                        <span>Pickup</span>
                        <strong>
                          {formatDisplayTime(r.pickupTime || r.time)}
                        </strong>
                        {r.returnTime ? (
                          <small>Retorno {formatDisplayTime(r.returnTime)}</small>
                        ) : null}
                      </div>
                      <div>
                        <span>Detalle</span>
                        <strong>
                          {r.passengers} pax · {r.vehicle}
                        </strong>
                        {r.flight ? <small>Vuelo {r.flight}</small> : null}
                      </div>
                    </div>

                    {r.notes ? (
                      <p className="admin-res-card__notes">{r.notes}</p>
                    ) : null}
                  </div>

                  {(r.status === "paid" || wa) && (
                    <div className="admin-res-card__actions">
                      {r.status === "paid" ? (
                        <div className="admin-res-card__pickup">
                          <label>
                            Hora pickup
                            <input
                              type="text"
                              placeholder="02:30 PM"
                              value={r.pickupTime ?? ""}
                              onChange={(e) =>
                                updateReservation(r.id, {
                                  pickupTime: e.target.value,
                                  time: e.target.value || "Por confirmar",
                                  pickupConfirmedAt: undefined,
                                  customerConfirmed: false,
                                })
                              }
                            />
                          </label>
                          {r.pickupConfirmedAt ? (
                            <p className="admin-res-card__pickup-ok">
                              Confirmada{" "}
                              {new Date(r.pickupConfirmedAt).toLocaleString(
                                "es-DO",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )}
                              {r.customerConfirmed
                                ? " · el cliente también OK"
                                : " · esperando al cliente"}
                            </p>
                          ) : (
                            <p className="admin-res-card__pickup-wait">
                              Aún no la has confirmado al cliente
                            </p>
                          )}
                        </div>
                      ) : null}
                      <div className="admin-res-card__buttons">
                        {r.status === "paid" ? (
                          <button
                            type="button"
                            className={`btn ${r.pickupConfirmedAt ? "btn--ghost" : "btn--primary"}`}
                            disabled={confirmingId === r.id}
                            onClick={() => void confirmPickupTime(r)}
                          >
                            {confirmingId === r.id
                              ? "Confirmando…"
                              : r.pickupConfirmedAt
                                ? "Reconfirmar hora"
                                : "Confirmar hora"}
                          </button>
                        ) : null}
                        {wa ? (
                          <a
                            className="btn btn--primary"
                            href={`https://wa.me/${wa}?text=${encodeURIComponent(
                              r.pickupTime
                                ? `Hola ${r.name}, tu pickup para ${r.id} es a las ${formatDisplayTime(r.pickupTime)}.`
                                : `Hola ${r.name}, sobre tu reserva ${r.id}:`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <AdminPager
            total={total}
            page={safePage}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </>
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
            <option value="refunded">Devuelta</option>
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
