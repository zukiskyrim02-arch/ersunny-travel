import type { ManagedExcursion } from "../store/config";
import { slugify } from "./types";

export function ExcursionsPanel({
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
        id: `${slugify(title)}-${Date.now().toString(36).slice(-4)}`,
        title,
        duration: "Full day",
        blurb: "Descripción de la experiencia.",
        image:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&q=65&fm=webp",
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

  function duplicate(e: ManagedExcursion) {
    onChange([
      {
        ...e,
        id: `${slugify(e.title)}-${Date.now().toString(36).slice(-4)}`,
        title: `${e.title} (copia)`,
        active: false,
      },
      ...excursions,
    ]);
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Excursiones</h1>
          <p>Crea, edita y publica tours del sitio y del booking.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={addExcursion}
        >
          + Nueva excursión
        </button>
      </header>

      <div className="admin-cards">
        {excursions.map((e) => (
          <article
            key={e.id}
            className="admin-edit-card admin-edit-card--wide admin-exc-card"
          >
            {e.image && (
              <img src={e.image} alt="" className="admin-exc-card__img" />
            )}
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
                <select
                  value={
                    e.duration === "Half day" || e.duration === "Medio día"
                      ? "Half day"
                      : "Full day"
                  }
                  onChange={(ev) =>
                    update(e.id, { duration: ev.target.value })
                  }
                >
                  <option value="Full day">Día completo (Full day)</option>
                  <option value="Half day">Medio día (Half day)</option>
                </select>
              </label>
              <label>
                Precio USD / persona
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
                  onChange={(ev) =>
                    update(e.id, { active: ev.target.checked })
                  }
                />
                Visible en el sitio
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
            <p className="admin-muted">ID: {e.id}</p>
            <div className="admin-editor__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => duplicate(e)}
              >
                Duplicar
              </button>
              <button
                type="button"
                className="admin-danger"
                onClick={() => remove(e.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
