import { useState } from "react";
import type { Zone } from "../data";
import type { AppConfig } from "../store/config";
import { zonesOf } from "../transfers";

export function ZonesPanel({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (patch: Partial<AppConfig>) => void;
}) {
  const zones = zonesOf(config);
  const [name, setName] = useState("");
  const [zone, setZone] = useState<Zone>(zones[0] ?? "Punta Cana");
  const activeZone = zones.includes(zone) ? zone : zones[0];

  function addHotel() {
    const hotel = name.trim();
    if (!hotel) return;
    const list = config.hotelsByZone[activeZone] ?? [];
    if (list.some((item) => item.toLowerCase() === hotel.toLowerCase())) {
      setName("");
      return;
    }
    onChange({
      hotelsByZone: {
        ...config.hotelsByZone,
        [activeZone]: [...list, hotel],
      },
    });
    setName("");
  }

  function removeHotel(target: Zone, hotel: string) {
    onChange({
      hotelsByZone: {
        ...config.hotelsByZone,
        [target]: (config.hotelsByZone[target] ?? []).filter((item) => item !== hotel),
      },
    });
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Hoteles</h1>
          <p>
            Hoteles del formulario de traslados. La zona decide el precio. Los
            puntos de recogida de excursiones se editan en Excursiones.
          </p>
        </div>
      </header>

      <form
        className="admin-hotel-add"
        onSubmit={(e) => {
          e.preventDefault();
          addHotel();
        }}
      >
        <label>
          Hotel nuevo
          <input
            value={name}
            placeholder="Nombre del hotel"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Zona
          <select
            value={activeZone}
            onChange={(e) => setZone(e.target.value)}
          >
            {zones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn--primary">
          Agregar
        </button>
      </form>

      <div className="admin-cards admin-cards--stack">
        {zones.map((item) => (
          <article key={item} className="admin-edit-card admin-edit-card--wide">
            <h3>
              {item}
              <span className="admin-muted">
                {" "}
                · {(config.hotelsByZone[item] ?? []).length}
              </span>
            </h3>
            {(config.hotelsByZone[item] ?? []).length === 0 ? (
              <p className="admin-note">Todavía no hay hoteles en esta zona.</p>
            ) : (
              <ul className="admin-hotel-list">
                {[...(config.hotelsByZone[item] ?? [])]
                  .sort((a, b) =>
                    a.localeCompare(b, undefined, { sensitivity: "base" }),
                  )
                  .map((hotel) => (
                  <li key={hotel}>
                    <span>{hotel}</span>
                    <button
                      type="button"
                      className="admin-danger"
                      onClick={() => removeHotel(item, hotel)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
