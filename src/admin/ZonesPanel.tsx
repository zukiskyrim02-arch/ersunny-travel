import { useMemo, useState } from "react";
import type { AppConfig } from "../store/config";
import { zonesOf } from "../transfers";
import { AdminPager } from "./AdminPager";
import { usePagination } from "./pagination";

function sortHotels(list: string[]) {
  return [...list].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function ZonesPanel({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (patch: Partial<AppConfig>) => void;
}) {
  const zones = zonesOf(config);
  const [name, setName] = useState("");
  const [zone, setZone] = useState<string>(zones[0] ?? "Punta Cana");
  const [query, setQuery] = useState("");

  const activeZone = zones.includes(zone) ? zone : zones[0];
  const hotels = useMemo(
    () => sortHotels(config.hotelsByZone[activeZone] ?? []),
    [config.hotelsByZone, activeZone],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hotels;
    return hotels.filter((hotel) => hotel.toLowerCase().includes(q));
  }, [hotels, query]);

  const {
    page: safePage,
    setPage,
    pageCount,
    pageSize,
    paged,
    total,
    resetPage,
    goToIndex,
  } = usePagination(filtered);

  function selectZone(next: string) {
    setZone(next);
    resetPage();
    setQuery("");
  }

  function addHotel() {
    const hotel = name.replace(/\s+/g, " ").trim();
    if (!hotel || !activeZone) return;
    const list = config.hotelsByZone[activeZone] ?? [];
    if (list.some((item) => item.toLowerCase() === hotel.toLowerCase())) {
      setName("");
      return;
    }
    const next = sortHotels([...list, hotel]);
    onChange({
      hotelsByZone: {
        ...config.hotelsByZone,
        [activeZone]: next,
      },
    });
    setName("");
    setQuery("");
    const index = next.findIndex(
      (item) => item.toLowerCase() === hotel.toLowerCase(),
    );
    goToIndex(Math.max(0, index));
  }

  function removeHotel(hotel: string) {
    if (!activeZone) return;
    onChange({
      hotelsByZone: {
        ...config.hotelsByZone,
        [activeZone]: (config.hotelsByZone[activeZone] ?? []).filter(
          (item) => item !== hotel,
        ),
      },
    });
  }

  return (
    <section className="admin-panel admin-hotels">
      <header className="admin-panel__head">
        <div>
          <h1>Hoteles</h1>
          <p>
            Hoteles del formulario de traslados. La zona decide el precio. Los
            puntos de recogida de excursiones se editan en Excursiones.
          </p>
        </div>
      </header>

      <div className="admin-hotels__hero">
        <form
          className="admin-hotels__add"
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
              onChange={(e) => selectZone(e.target.value)}
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
      </div>

      <div className="admin-hotels__tabs" role="tablist" aria-label="Zonas">
        {zones.map((item) => {
          const count = (config.hotelsByZone[item] ?? []).length;
          const active = item === activeZone;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              className={`admin-hotels__tab${active ? " is-active" : ""}`}
              onClick={() => selectZone(item)}
            >
              <strong>{item}</strong>
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <article className="admin-hotels__panel">
        <div className="admin-hotels__toolbar">
          <div>
            <h2>
              {activeZone}
              <span className="admin-muted"> · {hotels.length}</span>
            </h2>
            <p className="admin-note">Lista A–Z para esa zona de traslado.</p>
          </div>
          <label className="admin-hotels__search">
            <span className="visually-hidden">Buscar hotel</span>
            <input
              type="search"
              value={query}
              placeholder="Buscar hotel…"
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
            />
          </label>
        </div>

        {hotels.length === 0 ? (
          <p className="admin-note">Todavía no hay hoteles en esta zona.</p>
        ) : filtered.length === 0 ? (
          <p className="admin-note">Ningún hotel coincide con la búsqueda.</p>
        ) : (
          <>
            <ul className="admin-hotel-list admin-hotels__list">
              {paged.map((hotel) => (
                <li key={hotel}>
                  <span>{hotel}</span>
                  <button
                    type="button"
                    className="admin-danger"
                    onClick={() => removeHotel(hotel)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
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
    </section>
  );
}
