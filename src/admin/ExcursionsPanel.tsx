import { useMemo, useState } from "react";
import { uploadPhoto } from "../photos/uploadPhoto";
import type { ManagedExcursion } from "../store/config";
import { slugify } from "./types";

function durationLabel(duration: string) {
  return duration === "Half day" || duration === "Medio día"
    ? "Medio día"
    : "Día completo";
}

function money(price: number | null) {
  if (price == null) return "A consultar";
  return `US$${price.toLocaleString("en-US")}`;
}

export function ExcursionsPanel({
  excursions,
  pickups,
  onChange,
  onPickupsChange,
}: {
  excursions: ManagedExcursion[];
  pickups: string[];
  onChange: (e: ManagedExcursion[]) => void;
  onPickupsChange: (pickups: string[]) => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"order" | "name" | "price">("order");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pickupDraft, setPickupDraft] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = excursions.filter((item) => {
      if (!q) return true;
      return `${item.title} ${item.blurb} ${item.highlights.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
    if (sort === "name") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title, "es"));
    }
    if (sort === "price") {
      return [...list].sort(
        (a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER),
      );
    }
    return list;
  }, [excursions, query, sort]);

  const selected = excursions.find((item) => item.id === selectedId) ?? null;
  const featured = visible[0];
  const popular = visible.slice(1, 5);

  function update(id: string, patch: Partial<ManagedExcursion>) {
    onChange(excursions.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function onPhotoFile(id: string, file: File | undefined) {
    if (!file) return;
    setUploadError("");
    setUploadingId(id);
    try {
      const url = await uploadPhoto(file);
      update(id, { image: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploadingId(null);
    }
  }

  function addExcursion() {
    const title = "Nueva excursión";
    const id = `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
    onChange([
      {
        id,
        title,
        duration: "Full day",
        blurb: "Descripción de la experiencia.",
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70",
        highlights: ["Incluye transporte", "Guía"],
        price: null,
        active: true,
      },
      ...excursions,
    ]);
    setSelectedId(id);
    setEditing(true);
  }

  function remove(id: string) {
    if (!confirm("¿Eliminar esta excursión?")) return;
    onChange(excursions.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
    }
  }

  function duplicate(item: ManagedExcursion) {
    const id = `${slugify(item.title)}-${Date.now().toString(36).slice(-4)}`;
    onChange([
      {
        ...item,
        id,
        title: `${item.title} (copia)`,
        active: false,
      },
      ...excursions,
    ]);
    setSelectedId(id);
    setEditing(true);
  }

  function open(id: string, edit = false) {
    setSelectedId(id);
    setEditing(edit);
    setUploadError("");
  }

  function addPickup() {
    const name = pickupDraft.replace(/\s+/g, " ").trim();
    if (!name) return;
    if (pickups.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setPickupDraft("");
      return;
    }
    onPickupsChange([...pickups, name]);
    setPickupDraft("");
  }

  function removePickup(name: string) {
    onPickupsChange(pickups.filter((item) => item !== name));
  }

  if (selected) {
    return (
      <ExcursionDetail
        item={selected}
        editing={editing}
        uploading={uploadingId === selected.id}
        uploadError={uploadError}
        onBack={() => {
          setSelectedId(null);
          setEditing(false);
        }}
        onEdit={() => setEditing((value) => !value)}
        onChange={(patch) => update(selected.id, patch)}
        onPhoto={(file) => void onPhotoFile(selected.id, file)}
        onDuplicate={() => duplicate(selected)}
        onRemove={() => remove(selected.id)}
      />
    );
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Excursiones</h1>
          <p>El catálogo que ve el cliente en el sitio y en la reserva.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={addExcursion}>
          + Nueva excursión
        </button>
      </header>

      <article className="admin-edit-card admin-edit-card--wide">
        <h3>
          Puntos de recogida
          <span className="admin-muted"> · {pickups.length}</span>
        </h3>
        <p className="admin-note">
          Estos hoteles o puntos aparecen en el formulario de excursiones del
          sitio. Guarda los cambios del admin para publicarlos.
        </p>
        <form
          className="admin-hotel-add"
          onSubmit={(e) => {
            e.preventDefault();
            addPickup();
          }}
        >
          <label>
            Punto nuevo
            <input
              value={pickupDraft}
              placeholder="Hotel, lobby o punto de encuentro"
              onChange={(e) => setPickupDraft(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--primary">
            Agregar
          </button>
        </form>
        {pickups.length === 0 ? (
          <p className="admin-note">Todavía no hay puntos de recogida.</p>
        ) : (
          <ul className="admin-hotel-list">
            {[...pickups]
              .sort((a, b) =>
                a.localeCompare(b, undefined, { sensitivity: "base" }),
              )
              .map((point) => (
              <li key={point}>
                <span>{point}</span>
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() => removePickup(point)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

      <div className="admin-pkg-toolbar">
        <label className="admin-pkg-search">
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar excursión…"
          />
        </label>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
          aria-label="Ordenar excursiones"
        >
          <option value="order">Orden del sitio</option>
          <option value="name">Nombre</option>
          <option value="price">Precio</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="admin-note">No hay excursiones con esa búsqueda.</p>
      ) : (
        <>
          <div className="admin-pkg-layout">
            {featured && (
              <article className="admin-pkg-feature">
                <img src={featured.image} alt="" />
                <div className="admin-pkg-feature__body">
                  <div className="admin-pkg-kicker">
                    <span>{durationLabel(featured.duration)}</span>
                    {!featured.active && <span className="is-hidden">Oculta</span>}
                  </div>
                  <h2>{featured.title}</h2>
                  <p>{featured.blurb}</p>
                  <div className="admin-pkg-feature__foot">
                    <div>
                      <strong>{money(featured.price)}</strong>
                      <small>{featured.price == null ? "sin tarifa fija" : "por persona"}</small>
                    </div>
                    <button type="button" className="btn btn--primary" onClick={() => open(featured.id, true)}>
                      Editar detalle
                    </button>
                  </div>
                </div>
              </article>
            )}

            <aside className="admin-card admin-pkg-popular">
              <div className="admin-card__head">
                <h2>Populares</h2>
              </div>
              {popular.length === 0 ? (
                <p className="admin-note">Agrega otra excursión para verla aquí.</p>
              ) : (
                <ul>
                  {popular.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => open(item.id)}>
                        <img src={item.image} alt="" />
                        <span>
                          <strong>{item.title}</strong>
                          <small>
                            {durationLabel(item.duration)}
                            {!item.active ? " · Oculta" : ""}
                          </small>
                        </span>
                        <b>{money(item.price)}</b>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>

          <div className="admin-card__head admin-pkg-section">
            <h2>Catálogo</h2>
            <span>{visible.length} en total</span>
          </div>
          <div className="admin-pkg-grid">
            {visible.map((item) => (
              <article key={item.id} className="admin-pkg-card">
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {durationLabel(item.duration)}
                    {!item.active ? " · Oculta" : ""}
                  </small>
                  <b>{money(item.price)}</b>
                  <button type="button" className="btn btn--primary" onClick={() => open(item.id)}>
                    Ver detalle
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ExcursionDetail({
  item,
  editing,
  uploading,
  uploadError,
  onBack,
  onEdit,
  onChange,
  onPhoto,
  onDuplicate,
  onRemove,
}: {
  item: ManagedExcursion;
  editing: boolean;
  uploading: boolean;
  uploadError: string;
  onBack: () => void;
  onEdit: () => void;
  onChange: (patch: Partial<ManagedExcursion>) => void;
  onPhoto: (file: File | undefined) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [points, setPoints] = useState(item.highlights.join("\n"));
  const [pointsFor, setPointsFor] = useState(item.id);
  if (pointsFor !== item.id) {
    setPointsFor(item.id);
    setPoints(item.highlights.join("\n"));
  }

  return (
    <section className="admin-panel">
      <div className="admin-pkg-detailbar">
        <button type="button" className="admin-linkish" onClick={onBack}>
          ← Volver a excursiones
        </button>
        <button type="button" className="btn btn--primary" onClick={onEdit}>
          {editing ? "Cerrar edición" : "Editar detalle"}
        </button>
      </div>

      <div className="admin-pkg-detail">
        <div className="admin-pkg-detail__photo">
          <img src={item.image} alt="" />
          <label className="admin-pkg-photo-btn">
            {uploading ? "Subiendo…" : "Cambiar foto"}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(event) => {
                onPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="admin-card admin-pkg-detail__copy">
          <div className="admin-pkg-detail__title">
            <div>
              <p className="admin-pkg-kicker">
                <span>{durationLabel(item.duration)}</span>
                <span className={item.active ? "is-live" : "is-hidden"}>
                  {item.active ? "Visible en el sitio" : "Oculta"}
                </span>
              </p>
              <h1>{item.title}</h1>
            </div>
            <div className="admin-pkg-detail__price">
              <strong>{money(item.price)}</strong>
              <small>{item.price == null ? "sin tarifa fija" : "por persona"}</small>
            </div>
          </div>
          <p className="admin-pkg-detail__blurb">{item.blurb}</p>
          <h2>Incluye</h2>
          {item.highlights.length === 0 ? (
            <p className="admin-note">Todavía no hay puntos. Agrégalos en la edición.</p>
          ) : (
            <ul className="admin-pkg-checks">
              {item.highlights.map((point, index) => (
                <li key={`${index}-${point}`}>
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12.2 2.4 2.4L16.2 9" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          )}
          <div className="admin-editor__actions">
            <button type="button" className="btn btn--ghost" onClick={onDuplicate}>
              Duplicar
            </button>
            <button type="button" className="admin-danger" onClick={onRemove}>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <form
          className="admin-card admin-pkg-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="admin-card__head">
            <h2>Editar excursión</h2>
          </div>
          <div className="admin-edit-card__row">
            <label>
              Título
              <input
                value={item.title}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            </label>
            <label>
              Duración
              <select
                value={
                  item.duration === "Half day" || item.duration === "Medio día"
                    ? "Half day"
                    : "Full day"
                }
                onChange={(event) => onChange({ duration: event.target.value })}
              >
                <option value="Full day">Día completo</option>
                <option value="Half day">Medio día</option>
              </select>
            </label>
            <label>
              Precio US$ / persona
              <input
                type="number"
                min={0}
                placeholder="Pendiente"
                value={item.price ?? ""}
                onChange={(event) =>
                  onChange({
                    price: event.target.value === "" ? null : Number(event.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(event) => onChange({ active: event.target.checked })}
              />
              Visible en el sitio
            </label>
          </div>
          <label>
            Descripción
            <textarea
              rows={3}
              value={item.blurb}
              onChange={(event) => onChange({ blurb: event.target.value })}
            />
          </label>
          <label>
            Incluye (uno por línea)
            <textarea
              rows={4}
              value={points}
              onChange={(event) => {
                const next = event.target.value;
                setPoints(next);
                onChange({
                  highlights: next
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                });
              }}
            />
          </label>
          <label>
            URL de la foto
            <input
              value={item.image}
              onChange={(event) => onChange({ image: event.target.value })}
            />
          </label>
          {uploadError && <p className="admin-error">{uploadError}</p>}
          <p className="admin-muted">ID: {item.id}</p>
        </form>
      )}
    </section>
  );
}
