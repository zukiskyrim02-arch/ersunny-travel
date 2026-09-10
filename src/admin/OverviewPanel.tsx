import {
  defaultConfig,
  resetConfig,
  type AppConfig,
} from "../store/config";
import type { Reservation } from "../reservations";

export function OverviewPanel({
  config,
  reservations,
  onReset,
}: {
  config: AppConfig;
  reservations: Reservation[];
  onReset: () => void;
}) {
  const pending = reservations.filter(
    (r) => (r.status ?? "pending") === "pending",
  ).length;
  const paid = reservations.filter(
    (r) => r.status === "paid" || r.status === "confirmed",
  ).length;
  const transfers = reservations.filter((r) => r.kind !== "excursion").length;
  const excursions = reservations.filter((r) => r.kind === "excursion").length;
  const activeVehicles = config.vehicles.filter((v) => v.active !== false).length;
  const activeExcursions = config.excursions.filter((e) => e.active).length;

  const recent = [...reservations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Resumen</h1>
          <p>Estado del negocio y accesos rápidos.</p>
        </div>
      </header>

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
          <span>Traslados / Excursiones</span>
          <strong>
            {transfers} / {excursions}
          </strong>
        </article>
        <article>
          <span>Vehículos activos</span>
          <strong>{activeVehicles}</strong>
        </article>
        <article>
          <span>Excursiones activas</span>
          <strong>{activeExcursions}</strong>
        </article>
      </div>

      <div className="admin-split">
        <div className="admin-block">
          <h2>Últimas reservas</h2>
          {recent.length === 0 ? (
            <p className="admin-note">Aún no hay reservas guardadas.</p>
          ) : (
            <ul className="admin-recent">
              {recent.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.id}</strong>
                    <span>
                      {r.name} · {r.kind === "excursion" ? "Excursión" : "Traslado"}
                    </span>
                  </div>
                  <small>
                    {new Date(r.createdAt).toLocaleString("es-DO")}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-block">
          <h2>Datos del sitio</h2>
          <dl className="admin-dl">
            <div>
              <dt>Email</dt>
              <dd>{config.contact.email}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{config.contact.whatsapp}</dd>
            </div>
            <div>
              <dt>Banco</dt>
              <dd>
                {config.bank.bank} · {config.bank.accountNumber}
              </dd>
            </div>
            <div>
              <dt>Pago Azul</dt>
              <dd>{config.azul.enabled ? `Activo (${config.azul.env})` : "Inactivo"}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn--ghost"
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
          <p className="admin-note">
            Todo se guarda en este navegador (localStorage). Usa el mismo
            dispositivo para admin y el sitio público.
          </p>
          <button
            type="button"
            className="admin-linkish"
            onClick={() => {
              const json = JSON.stringify(defaultConfig(), null, 2);
              void navigator.clipboard?.writeText(json);
            }}
          >
            Copiar JSON por defecto
          </button>
        </div>
      </div>
    </section>
  );
}
