import { useMemo, useState } from "react";
import {
  resetConfig,
  type AppConfig,
} from "../store/config";
import type { Reservation, ReservationStatus } from "../reservations";
import type { AdminTab } from "./types";
import { formatDisplayDate } from "../../shared/datetime";

const STATUS_META: { id: ReservationStatus; label: string; color: string }[] = [
  { id: "pending", label: "Pendientes", color: "#f5b400" },
  { id: "paid", label: "Pagadas", color: "#3b82f6" },
  { id: "confirmed", label: "Confirmadas", color: "#22a06b" },
  { id: "completed", label: "Completadas", color: "#0f766e" },
  { id: "cancelled", label: "Canceladas", color: "#d5deea" },
];

function money(value: number) {
  return `US$${value.toLocaleString("en-US")}`;
}

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function statusOf(reservation: Reservation): ReservationStatus {
  return reservation.status ?? "pending";
}

export function OverviewPanel({
  config,
  reservations,
  onReset,
  onOpen,
}: {
  config: AppConfig;
  reservations: Reservation[];
  onReset: () => void;
  onOpen: (tab: AdminTab) => void;
}) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const stats = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const inRange = (from: number, to: number) =>
      reservations.filter((item) => {
        const time = new Date(item.createdAt).getTime();
        return time >= from && time < to;
      }).length;
    const thisWeek = inRange(now - week, now + 1);
    const lastWeek = inRange(now - week * 2, now - week);
    const delta =
      lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 1000) / 10 : null;
    const earned = reservations
      .filter((item) => item.status === "paid" || item.status === "confirmed")
      .reduce((sum, item) => sum + (item.price ?? 0), 0);
    const counts = Object.fromEntries(
      STATUS_META.map((item) => [
        item.id,
        reservations.filter((row) => statusOf(row) === item.id).length,
      ]),
    ) as Record<ReservationStatus, number>;
    return { thisWeek, delta, earned, counts };
  }, [reservations]);

  const weekSeries = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      const key = dayKey(day);
      const count = reservations.filter(
        (item) => dayKey(new Date(item.createdAt)) === key,
      ).length;
      return {
        key,
        count,
        label: day.toLocaleDateString("es-DO", { weekday: "short" }).replace(".", ""),
      };
    });
  }, [reservations]);

  const upcoming = useMemo(() => {
    const today = dayKey(new Date());
    return [...reservations]
      .filter((item) => item.date >= today && statusOf(item) !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
      .slice(0, 4);
  }, [reservations]);

  const recent = useMemo(() => {
    return [...reservations]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [reservations]);

  const tours = config.excursions.filter((item) => item.active).slice(0, 3);
  const total = reservations.length;
  const done = stats.counts.paid + stats.counts.confirmed;

  return (
    <section className="admin-panel admin-dash">
      <header className="admin-panel__head">
        <div>
          <h1>Resumen</h1>
          <p>Reservas, excursiones y el estado del sitio en un solo lugar.</p>
        </div>
      </header>

      <div className="admin-dash__top">
        <div className="admin-dash__stats">
          <StatCard
            label="Reservas totales"
            value={String(total)}
            note={
              stats.delta == null
                ? "Esta semana"
                : `${stats.delta > 0 ? "+" : ""}${stats.delta}% vs. la semana pasada`
            }
            tone={stats.delta != null && stats.delta < 0 ? "down" : "up"}
            icon="calendar"
          />
          <StatCard
            label="Por confirmar"
            value={String(stats.counts.pending)}
            note={total === 0 ? "Sin reservas nuevas" : `${stats.thisWeek} esta semana`}
            tone="down"
            icon="clock"
          />
          <StatCard
            label="Cobrado"
            value={money(stats.earned)}
            note="Pagadas y confirmadas"
            tone="up"
            icon="card"
          />
        </div>

        <MonthCalendar
          cursor={monthCursor}
          onShift={(delta) =>
            setMonthCursor(
              (current) =>
                new Date(current.getFullYear(), current.getMonth() + delta, 1),
            )
          }
          marked={new Set(reservations.map((item) => item.date).filter(Boolean))}
        />
      </div>

      <div className="admin-dash__mid">
        <article className="admin-card">
          <div className="admin-card__head">
            <h2>Reservas de la semana</h2>
            <span>{stats.thisWeek} nuevas</span>
          </div>
          <WeekChart series={weekSeries} />
        </article>

        <article className="admin-card">
          <div className="admin-card__head">
            <h2>Por estado</h2>
          </div>
          <StatusDonut counts={stats.counts} total={total} />
        </article>

        <article className="admin-card">
          <div className="admin-card__head">
            <h2>Avance</h2>
            <strong>{total}</strong>
          </div>
          <div className="admin-meter">
            <span style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
            <span
              style={{
                width: total ? `${(stats.counts.pending / total) * 100}%` : "0%",
              }}
            />
            <span
              style={{
                width: total
                  ? `${(stats.counts.cancelled / total) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <ul className="admin-meter__legend">
            <li><i className="is-done" /> Pagadas o confirmadas {done}</li>
            <li><i className="is-wait" /> Pendientes {stats.counts.pending}</li>
            <li><i className="is-off" /> Canceladas {stats.counts.cancelled}</li>
          </ul>
        </article>
      </div>

      <div className="admin-dash__lower">
        <article className="admin-card">
          <div className="admin-card__head">
            <h2>Excursiones</h2>
            <button type="button" className="admin-linkish" onClick={() => onOpen("excursions")}>
              Ver todas
            </button>
          </div>
          {tours.length === 0 ? (
            <p className="admin-note">No hay excursiones activas.</p>
          ) : (
            <div className="admin-pack-grid">
              {tours.map((tour) => (
                <button
                  key={tour.id}
                  type="button"
                  className="admin-pack"
                  onClick={() => onOpen("excursions")}
                >
                  <img src={tour.image} alt="" />
                  <div>
                    <strong>{tour.title}</strong>
                    <small>{tour.duration === "Half day" ? "Medio día" : "Día completo"}</small>
                    <b>{tour.price == null ? "A consultar" : `${money(tour.price)} / persona`}</b>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card__head">
            <h2>Próximos servicios</h2>
            <button type="button" className="admin-linkish" onClick={() => onOpen("reservations")}>
              Ver todas
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="admin-note">No hay servicios próximos.</p>
          ) : (
            <ul className="admin-upcoming">
              {upcoming.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.kind === "excursion" ? item.destination : item.name}</strong>
                    <small>
                      {item.kind === "excursion" ? "Excursión" : "Traslado"} · {item.destination}
                    </small>
                  </span>
                  <time dateTime={item.date}>
                    {formatDisplayDate(item.date)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="admin-card">
        <div className="admin-card__head">
          <h2>Reservas recientes</h2>
          <button type="button" className="admin-linkish" onClick={() => onOpen("reservations")}>
            Ver todas
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="admin-note">Aún no hay reservas guardadas.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Fecha</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name || "Sin nombre"}</strong>
                      <small className="admin-table__sub">{item.id}</small>
                    </td>
                    <td>{item.kind === "excursion" ? item.destination : `${item.origin} → ${item.destination}`}</td>
                    <td>{item.date ? formatDisplayDate(item.date) : "—"}</td>
                    <td>{item.price == null ? "—" : money(item.price)}</td>
                    <td>
                      <span className={`admin-pill admin-pill--${statusOf(item)}`}>
                        {STATUS_META.find((row) => row.id === statusOf(item))?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-dash__tools">
          <button
            type="button"
            className="admin-linkish"
            onClick={() => {
              if (
                confirm(
                  "¿Restablecer vehículos, excursiones, hoteles, contacto y precios a los valores por defecto? Las reservas no se borran.",
                )
              ) {
                resetConfig();
                onReset();
              }
            }}
          >
            Restablecer catálogo y sitio
          </button>
        </div>
      </article>
    </section>
  );
}

function StatCard({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  tone: "up" | "down";
  icon: "calendar" | "clock" | "card";
}) {
  return (
    <article className="admin-stat">
      <span className={`admin-stat__icon admin-stat__icon--${icon}`} aria-hidden>
        {icon === "calendar" && (
          <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
        )}
        {icon === "clock" && (
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 1.5" /></svg>
        )}
        {icon === "card" && (
          <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
        )}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={tone === "down" ? "is-down" : "is-up"}>{note}</small>
    </article>
  );
}

function WeekChart({ series }: { series: { label: string; count: number }[] }) {
  const width = 560;
  const height = 168;
  const padX = 16;
  const padY = 18;
  const max = Math.max(1, ...series.map((item) => item.count));
  const points = series.map((item, index) => {
    const x = padX + (index * (width - padX * 2)) / Math.max(1, series.length - 1);
    const y = height - padY - (item.count / max) * (height - padY * 2);
    return { x, y, ...item };
  });
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1]?.x ?? 0},${height - padY} L${points[0]?.x ?? 0},${height - padY} Z`;
  const peak = points.reduce((best, point) => (point.count > best.count ? point : best), points[0]);

  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Reservas de los últimos 7 días">
        <path d={area} className="admin-chart__area" />
        <path d={line} className="admin-chart__line" />
        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="3.5" className="admin-chart__dot" />
        ))}
        {peak && peak.count > 0 && (
          <g className="admin-chart__tag">
            <rect x={peak.x - 28} y={Math.max(2, peak.y - 34)} width="56" height="22" rx="8" />
            <text x={peak.x} y={Math.max(17, peak.y - 19)} textAnchor="middle">
              {peak.count}
            </text>
          </g>
        )}
      </svg>
      <div className="admin-chart__labels">
        {series.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function StatusDonut({
  counts,
  total,
}: {
  counts: Record<ReservationStatus, number>;
  total: number;
}) {
  const radius = 46;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const slices = STATUS_META.filter((item) => counts[item.id] > 0);

  return (
    <div className="admin-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label="Reservas por estado">
        <circle cx="70" cy="70" r={radius} className="admin-donut__track" />
        {total > 0 &&
          slices.map((item) => {
            const length = (counts[item.id] / total) * circ;
            const dash = `${length} ${circ - length}`;
            const node = (
              <circle
                key={item.id}
                cx="70"
                cy="70"
                r={radius}
                stroke={item.color}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return node;
          })}
        <text x="70" y="66" textAnchor="middle" className="admin-donut__value">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="admin-donut__label">
          reservas
        </text>
      </svg>
      <ul>
        {STATUS_META.map((item) => (
          <li key={item.id}>
            <i style={{ background: item.color }} />
            <span>{item.label}</span>
            <b>{total ? Math.round((counts[item.id] / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonthCalendar({
  cursor,
  onShift,
  marked,
}: {
  cursor: Date;
  onShift: (delta: number) => void;
  marked: Set<string>;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = dayKey(new Date());
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];

  return (
    <article className="admin-card admin-cal">
      <div className="admin-card__head">
        <h2>
          {cursor.toLocaleDateString("es-DO", { month: "long", year: "numeric" })}
        </h2>
        <div className="admin-cal__nav">
          <button type="button" onClick={() => onShift(-1)} aria-label="Mes anterior">
            ‹
          </button>
          <button type="button" onClick={() => onShift(1)} aria-label="Mes siguiente">
            ›
          </button>
        </div>
      </div>
      <div className="admin-cal__grid">
        {["D", "L", "M", "X", "J", "V", "S"].map((label, index) => (
          <span key={`${label}-${index}`} className="admin-cal__dow">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const key = dayKey(new Date(year, month, day));
          return (
            <span
              key={key}
              className={`admin-cal__day${key === today ? " is-today" : ""}${marked.has(key) ? " has-event" : ""}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </article>
  );
}
