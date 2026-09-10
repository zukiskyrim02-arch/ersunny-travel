import type { Zone } from "../data";
import type { AppConfig } from "../store/config";

export function ZonesPanel({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (patch: Partial<AppConfig>) => void;
}) {
  const zones = Object.keys(config.zoneSurcharge) as Zone[];

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Zonas y hoteles</h1>
          <p>
            Recargos por zona y listados de hoteles del cotizador / excursiones.
          </p>
        </div>
      </header>

      <div className="admin-block">
        <h2>Recargo por zona (USD)</h2>
        <p className="admin-lead">
          Se suma al precio base del vehículo. Ida y vuelta ≈ ×2.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Recargo USD</th>
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
                      value={config.zoneSurcharge[zone]}
                      onChange={(e) =>
                        onChange({
                          zoneSurcharge: {
                            ...config.zoneSurcharge,
                            [zone]: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-cards admin-cards--stack">
        {zones.map((zone) => (
          <article key={zone} className="admin-edit-card admin-edit-card--wide">
            <h3>Hoteles · {zone}</h3>
            <label>
              Un hotel por línea
              <textarea
                rows={8}
                value={config.hotelsByZone[zone].join("\n")}
                onChange={(e) =>
                  onChange({
                    hotelsByZone: {
                      ...config.hotelsByZone,
                      [zone]: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
