import type { ManagedVehicle } from "../store/config";

export function VehiclesPanel({
  vehicles,
  onChange,
}: {
  vehicles: ManagedVehicle[];
  onChange: (v: ManagedVehicle[]) => void;
}) {
  function update(id: string, patch: Partial<ManagedVehicle>) {
    onChange(vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function addVehicle() {
    const id = `veh-${Date.now().toString(36)}`;
    onChange([
      ...vehicles,
      {
        id,
        name: "Nuevo vehículo",
        capacity: "1–4 pasajeros",
        maxPassengers: 4,
        basePrice: 50,
        active: true,
      },
    ]);
  }

  function remove(id: string) {
    if (vehicles.length <= 1) {
      alert("Debe quedar al menos un tipo de vehículo.");
      return;
    }
    if (confirm("¿Eliminar este tipo de transporte?")) {
      onChange(vehicles.filter((v) => v.id !== id));
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Traslados / vehículos</h1>
          <p>Crea y edita tipos de transporte con capacidad y precio base.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={addVehicle}>
          + Agregar vehículo
        </button>
      </header>

      <div className="admin-cards">
        {vehicles.map((v) => (
          <article key={v.id} className="admin-edit-card">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={v.active !== false}
                onChange={(e) => update(v.id, { active: e.target.checked })}
              />
              Activo en el cotizador
            </label>
            <label>
              Nombre
              <input
                value={v.name}
                onChange={(e) => update(v.id, { name: e.target.value })}
              />
            </label>
            <label>
              Capacidad (texto)
              <input
                value={v.capacity}
                onChange={(e) => update(v.id, { capacity: e.target.value })}
              />
            </label>
            <label>
              Máx. pasajeros
              <input
                type="number"
                min={1}
                max={40}
                value={v.maxPassengers}
                onChange={(e) =>
                  update(v.id, { maxPassengers: Number(e.target.value) || 1 })
                }
              />
            </label>
            <label>
              Precio base (USD)
              <input
                type="number"
                min={0}
                value={v.basePrice}
                onChange={(e) =>
                  update(v.id, { basePrice: Number(e.target.value) || 0 })
                }
              />
            </label>
            <p className="admin-muted">ID: {v.id}</p>
            <button
              type="button"
              className="admin-danger"
              onClick={() => remove(v.id)}
            >
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
