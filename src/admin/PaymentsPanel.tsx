import { useEffect, useMemo, useState } from "react";
import { formatDisplayDate } from "../../shared/datetime";
import {
  updateReservation,
  type Reservation,
  type ReservationStatus,
} from "../reservations";
import {
  DEFAULT_USD_DOP_RATE,
  parseUsdDopRate,
  type AppConfig,
} from "../store/config";
import { useReservations } from "../store/hooks";
import { AdminPager } from "./AdminPager";
import { usePagination } from "./pagination";


const PAYMENT_STATUSES = new Set<ReservationStatus>([
  "paid",
  "confirmed",
  "completed",
  "refunded",
]);

const statusLabel: Record<string, string> = {
  paid: "Pagado",
  confirmed: "Confirmado",
  completed: "Completado",
  refunded: "Devuelto",
};

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `US$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function moneyDop(value: number) {
  return `RD$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function paymentMethodOf(item: Reservation) {
  if (item.paymentMethod === "card" || item.cardnetTxToken || item.authorizationCode) {
    return "Tarjeta";
  }
  if (item.paymentMethod === "paypal" || item.paypalCaptureId) {
    return "PayPal";
  }
  return "Pago";
}

function canRefund(item: Reservation) {
  const status = item.status ?? "pending";
  return status === "paid" || status === "confirmed" || status === "completed";
}

function refundReady(item: Reservation) {
  if (paymentMethodOf(item) === "PayPal") return Boolean(item.paypalCaptureId);
  if (paymentMethodOf(item) === "Tarjeta") {
    return Boolean(item.cardnetTxToken && item.cardnetAmountDop);
  }
  return false;
}

type RefundStep = "review" | "working" | "done" | "error";

export function PaymentsPanel({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (patch: Partial<AppConfig>) => void;
}) {
  const reservations = useReservations();
  const rate = config.usdDopRate ?? DEFAULT_USD_DOP_RATE;
  const [rateDraft, setRateDraft] = useState(String(rate));
  const [query, setQuery] = useState("");
  const [refundTarget, setRefundTarget] = useState<Reservation | null>(null);
  const [refundStep, setRefundStep] = useState<RefundStep>("review");
  const [refundError, setRefundError] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const sample = moneyDop(100 * rate);

  useEffect(() => {
    setRateDraft(String(rate));
  }, [rate]);

  const payments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations
      .filter((item) => PAYMENT_STATUSES.has(item.status ?? "pending"))
      .filter((item) => {
        if (!q) return true;
        const hay = [
          item.id,
          item.name,
          item.email,
          item.contactInfo,
          item.destination,
          item.origin,
          item.authorizationCode,
          item.paypalCaptureId,
          item.cardnetTxToken,
          paymentMethodOf(item),
          statusLabel[item.status ?? ""] ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const aTime = new Date(a.refundedAt || a.createdAt).getTime();
        const bTime = new Date(b.refundedAt || b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [reservations, query]);

  const {
    page: safePage,
    setPage,
    pageCount,
    pageSize,
    paged,
    total,
    resetPage,
  } = usePagination(payments);

  function commitRate(raw: string) {
    const next = parseUsdDopRate(raw.replace(",", "."));
    if (next == null) {
      setRateDraft(String(rate));
      return;
    }
    setRateDraft(String(next));
    if (next !== rate) onChange({ usdDopRate: next });
  }

  function openRefund(item: Reservation) {
    setRefundTarget(item);
    setRefundStep("review");
    setRefundError("");
    setRefundReference("");
  }

  function closeRefund() {
    setRefundTarget(null);
    setRefundStep("review");
    setRefundError("");
    setRefundReference("");
  }

  async function runRefund() {
    if (!refundTarget) return;
    setRefundStep("working");
    setRefundError("");
    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ reservationId: refundTarget.id }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        refundReference?: string;
        provider?: string;
      };
      if (!res.ok || !body.ok) {
        setRefundStep("error");
        setRefundError(body.error || "No se pudo completar la devolución.");
        return;
      }
      updateReservation(refundTarget.id, {
        status: "refunded",
        refundedAt: new Date().toISOString(),
        refundReference: body.refundReference || undefined,
      });
      setRefundReference(body.refundReference || "");
      setRefundStep("done");
    } catch {
      setRefundStep("error");
      setRefundError("Error de red al procesar la devolución.");
    }
  }

  const method = refundTarget ? paymentMethodOf(refundTarget) : "";

  return (
    <section className="admin-panel admin-pay">
      <header className="admin-panel__head">
        <div>
          <h1>Pagos</h1>
          <p>Tasa Cardnet, historial de cobros y devoluciones por API.</p>
        </div>
      </header>

      <div className="admin-pay__hero">
        <div className="admin-pay__hero-copy">
          <p className="admin-pay__kicker">Cardnet</p>
          <h2>Tasa USD → DOP</h2>
          <p>
            Los precios del sitio siguen en dólares. Al pagar con tarjeta, el
            cobro se convierte a pesos con esta tasa.
          </p>
        </div>
        <div className="admin-pay__rate-box">
          <label className="admin-pay__rate-label" htmlFor="admin-usd-dop">
            Pesos por 1 USD
          </label>
          <div className="admin-pay__rate-row">
            <span className="admin-pay__rate-prefix">RD$</span>
            <input
              id="admin-usd-dop"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={rateDraft}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d.,]/g, "");
                setRateDraft(raw);
                const next = parseUsdDopRate(raw.replace(",", "."));
                if (next != null && next !== rate) onChange({ usdDopRate: next });
              }}
              onBlur={() => commitRate(rateDraft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRate(rateDraft);
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
          <div className="admin-pay__rate-preview">
            <span>
              US$1 <b>→</b> {moneyDop(rate)}
            </span>
            <span>
              US$100 <b>→</b> {sample}
            </span>
          </div>
        </div>
      </div>

      <article className="admin-pay__history">
        <div className="admin-pay__history-head">
          <div>
            <h2>Historial de pagos</h2>
            <p className="admin-note">
              {payments.length} cobro{payments.length === 1 ? "" : "s"} ·
              devoluciones por PayPal o Cardnet
            </p>
          </div>
          <label className="admin-pay__search">
            <span className="visually-hidden">Buscar pagos</span>
            <input
              type="search"
              value={query}
              placeholder="Buscar pago…"
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
            />
          </label>
        </div>

        {payments.length === 0 ? (
          <p className="admin-note">
            {query.trim()
              ? "Ningún pago coincide con la búsqueda."
              : "Todavía no hay pagos registrados."}
          </p>
        ) : (
          <>
            <div className="admin-pay__table-wrap">
              <table className="admin-pay__table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item) => {
                    const status = item.status ?? "paid";
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.id}</strong>
                          {item.authorizationCode ? (
                            <small>Auth {item.authorizationCode}</small>
                          ) : item.paypalCaptureId ? (
                            <small>Capture {item.paypalCaptureId.slice(0, 12)}…</small>
                          ) : null}
                        </td>
                        <td>
                          <strong>{item.name || "—"}</strong>
                          <small>
                            {item.email ||
                              item.contactInfo?.split("·")[0]?.trim() ||
                              "—"}
                          </small>
                        </td>
                        <td>
                          {item.kind === "excursion" ? "Excursión" : "Traslado"}
                          <small>
                            {item.destination || item.hotelPickup || "—"}
                          </small>
                        </td>
                        <td>{paymentMethodOf(item)}</td>
                        <td>{money(item.price)}</td>
                        <td>
                          <span
                            className={`admin-pill${
                              status === "refunded"
                                ? ""
                                : status === "paid"
                                  ? " admin-pill--paid"
                                  : " admin-pill--ok"
                            }`}
                          >
                            {statusLabel[status] ?? status}
                          </span>
                        </td>
                        <td>
                          {formatDisplayDate(
                            (item.refundedAt || item.createdAt).slice(0, 10),
                          )}
                        </td>
                        <td>
                          {canRefund(item) ? (
                            <button
                              type="button"
                              className="btn btn--primary admin-pay__refund-btn"
                              onClick={() => openRefund(item)}
                            >
                              Devolver
                            </button>
                          ) : (
                            <span className="admin-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
      </article>

      {refundTarget && (
        <div className="admin-pay__modal" role="dialog" aria-modal="true">
          <div className="admin-pay__modal-card">
            <header>
              <p className="admin-pay__kicker">Devolución</p>
              <h2>{refundTarget.id}</h2>
              <p>
                Proceso con {method === "PayPal" ? "PayPal" : "Cardnet"} — no
                solo cambia el estado.
              </p>
            </header>

            <dl className="admin-pay__facts">
              <div>
                <dt>Cliente</dt>
                <dd>{refundTarget.name || "—"}</dd>
              </div>
              <div>
                <dt>Monto</dt>
                <dd>
                  {money(refundTarget.price)}
                  {refundTarget.cardnetAmountDop
                    ? ` · ${moneyDop(refundTarget.cardnetAmountDop)}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Método</dt>
                <dd>{method}</dd>
              </div>
              {method === "PayPal" ? (
                <div>
                  <dt>Capture PayPal</dt>
                  <dd>
                    <code>{refundTarget.paypalCaptureId || "No disponible"}</code>
                  </dd>
                </div>
              ) : (
                <>
                  <div>
                    <dt>Auth Cardnet</dt>
                    <dd>{refundTarget.authorizationCode || "—"}</dd>
                  </div>
                  <div>
                    <dt>TxToken</dt>
                    <dd>
                      <code>{refundTarget.cardnetTxToken || "No disponible"}</code>
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {refundStep === "review" && (
              <>
                {!refundReady(refundTarget) ? (
                  <p className="admin-pay__modal-warn" role="alert">
                    Este cobro no tiene la referencia del proveedor para
                    reembolsar por API
                    {method === "PayPal"
                      ? " (falta paypalCaptureId)."
                      : " (falta TxToken / monto DOP)."}{" "}
                    Solo pagos nuevos guardan esos datos.
                  </p>
                ) : (
                  <ol className="admin-pay__steps">
                    <li>Revisar monto y referencia del proveedor.</li>
                    <li>
                      Enviar el reembolso a{" "}
                      {method === "PayPal" ? "PayPal" : "Cardnet"}.
                    </li>
                    <li>Marcar la reserva como Devuelta si el proveedor aprueba.</li>
                  </ol>
                )}
                <div className="admin-pay__modal-actions">
                  <button type="button" className="admin-danger" onClick={closeRefund}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={!refundReady(refundTarget)}
                    onClick={() => void runRefund()}
                  >
                    Procesar devolución
                  </button>
                </div>
              </>
            )}

            {refundStep === "working" && (
              <p className="admin-note">Contactando a {method}…</p>
            )}

            {refundStep === "done" && (
              <>
                <p className="admin-pay__modal-ok" role="status">
                  Devolución aprobada por {method}.
                  {refundReference ? ` Ref: ${refundReference}` : ""}
                </p>
                <div className="admin-pay__modal-actions">
                  <button type="button" className="btn btn--primary" onClick={closeRefund}>
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {refundStep === "error" && (
              <>
                <p className="admin-pay__modal-warn" role="alert">
                  {refundError}
                </p>
                <div className="admin-pay__modal-actions">
                  <button type="button" className="admin-danger" onClick={closeRefund}>
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => void runRefund()}
                  >
                    Reintentar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
