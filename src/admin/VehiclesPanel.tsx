import { useState } from "react";
import type { Zone } from "../data";
import type { AppConfig, ManagedVehicle } from "../store/config";
import {
  defaultFare,
  fareFor,
  rateKey,
  zonesOf,
  type TransferFare,
} from "../transfers";

export function VehiclesPanel({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (patch: Partial<AppConfig>) => void;
}) {
  const zones = zonesOf(config);
  const [activeZone, setActiveZone] = useState(zones[0] ?? "");
  const [zoneName, setZoneName] = useState("");
  const zone = zones.includes(activeZone) ? activeZone : zones[0];

  function updateVehicle(id: string, patch: Partial<ManagedVehicle>) {
    onChange({
      vehicles: config.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  }

  function addVehicle() {
    const id = `veh-${Date.now().toString(36)}`;
    const vehicle: ManagedVehicle = {
      id,
      name: "Nuevo vehículo",
      capacity: "1–4 pasajeros",
      maxPassengers: 4,
      basePrice: 50,
      active: true,
    };
    const transferRates = { ...config.transferRates };
    for (const item of zones) {
      transferRates[rateKey(id, item)] = defaultFare(vehicle.basePrice, 0);
    }
    onChange({ vehicles: [...config.vehicles, vehicle], transferRates });
  }

  function removeVehicle(id: string) {
    if (config.vehicles.length <= 1) {
      window.alert("Debe quedar al menos un vehículo.");
      return;
    }
    if (!window.confirm("¿Eliminar este vehículo y sus precios?")) return;
    const transferRates = { ...config.transferRates };
    for (const item of zones) delete transferRates[rateKey(id, item)];
    onChange({
      vehicles: config.vehicles.filter((v) => v.id !== id),
      transferRates,
    });
  }

  function addZone() {
    const name = zoneName.trim();
    if (!name) return;
    if (zones.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setZoneName("");
      setActiveZone(zones.find((item) => item.toLowerCase() === name.toLowerCase()) ?? name);
      return;
    }
    const transferRates = { ...config.transferRates };
    for (const vehicle of config.vehicles) {
      transferRates[rateKey(vehicle.id, name)] = defaultFare(vehicle.basePrice, 0);
    }
    onChange({
      zones: [...zones, name],
      hotelsByZone: { ...config.hotelsByZone, [name]: [] },
      zoneSurcharge: { ...config.zoneSurcharge, [name]: 0 },
      transferRates,
    });
    setZoneName("");
    setActiveZone(name);
  }

  function removeZone(target: string) {
    if (zones.length <= 1) {
      window.alert("Debe quedar al menos una zona.");
      return;
    }
    const hotels = config.hotelsByZone[target]?.length ?? 0;
    const warning = hotels
      ? `¿Quitar ${target}? También se borran ${hotels} hoteles de esa zona.`
      : `¿Quitar la zona ${target} y sus precios?`;
    if (!window.confirm(warning)) return;
    const transferRates = { ...config.transferRates };
    for (const vehicle of config.vehicles) delete transferRates[rateKey(vehicle.id, target)];
    const hotelsByZone = { ...config.hotelsByZone };
    const zoneSurcharge = { ...config.zoneSurcharge };
    delete hotelsByZone[target];
    delete zoneSurcharge[target];
    onChange({
      zones: zones.filter((item) => item !== target),
      hotelsByZone,
      zoneSurcharge,
      transferRates,
    });
  }

  function setFare(
    vehicleId: string,
    zone: Zone,
    field: keyof TransferFare,
    value: number,
  ) {
    const current = fareFor(config, vehicleId, zone);
    onChange({
      transferRates: {
        ...config.transferRates,
        [rateKey(vehicleId, zone)]: { ...current, [field]: value },
      },
    });
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Traslados</h1>
          <p>
            Cada vehículo tiene su precio fijo por zona. El cliente paga esa
            cifra, sin recargos automáticos.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={addVehicle}>
          + Vehículo
        </button>
      </header>

      <div className="admin-zonebar">
        {zones.map((item) => (
          <button
            key={item}
            type="button"
            className={item === zone ? "is-on" : ""}
            onClick={() => setActiveZone(item)}
          >
            {item}
            {zones.length > 1 && (
              <span
                role="presentation"
                onClick={(event) => {
                  event.stopPropagation();
                  removeZone(item);
                }}
              >
                ×
              </span>
            )}
          </button>
        ))}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addZone();
          }}
        >
          <input
            value={zoneName}
            placeholder="Nueva zona"
            aria-label="Nueva zona"
            onChange={(event) => setZoneName(event.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            Agregar
          </button>
        </form>
      </div>

      <div className="admin-ride-list">
        {config.vehicles.map((vehicle) => (
          <article key={vehicle.id} className="admin-ride">
            <div className="admin-ride__top">
              <label>
                Vehículo
                <input
                  value={vehicle.name}
                  onChange={(event) =>
                    updateVehicle(vehicle.id, { name: event.target.value })
                  }
                />
              </label>
              <label>
                Capacidad
                <input
                  value={vehicle.capacity}
                  onChange={(event) =>
                    updateVehicle(vehicle.id, { capacity: event.target.value })
                  }
                />
              </label>
              <label>
                Máx. pasajeros
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={vehicle.maxPassengers}
                  onChange={(event) =>
                    updateVehicle(vehicle.id, {
                      maxPassengers: Number(event.target.value) || 1,
                    })
                  }
                />
              </label>
              <div className="admin-ride__tools">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={vehicle.active !== false}
                    onChange={(event) =>
                      updateVehicle(vehicle.id, { active: event.target.checked })
                    }
                  />
                  Visible
                </label>
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() => removeVehicle(vehicle.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="admin-ride__fares">
              <FareGroup
                title="Privado"
                oneWay={fareFor(config, vehicle.id, zone).oneWay}
                roundTrip={fareFor(config, vehicle.id, zone).roundTrip}
                onOneWay={(value) => setFare(vehicle.id, zone, "oneWay", value)}
                onRoundTrip={(value) => setFare(vehicle.id, zone, "roundTrip", value)}
              />
              <FareGroup
                title="Compartido"
                oneWay={fareFor(config, vehicle.id, zone).sharedOneWay}
                roundTrip={fareFor(config, vehicle.id, zone).sharedRoundTrip}
                onOneWay={(value) => setFare(vehicle.id, zone, "sharedOneWay", value)}
                onRoundTrip={(value) =>
                  setFare(vehicle.id, zone, "sharedRoundTrip", value)
                }
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FareGroup({
  title,
  oneWay,
  roundTrip,
  onOneWay,
  onRoundTrip,
}: {
  title: string;
  oneWay: number;
  roundTrip: number;
  onOneWay: (value: number) => void;
  onRoundTrip: (value: number) => void;
}) {
  return (
    <div className="admin-ride__kind">
      <p>{title}</p>
      <label>
        Ida
        <span>
          <b>US$</b>
          <input
            type="number"
            min={0}
            value={oneWay}
            onChange={(event) => onOneWay(Number(event.target.value) || 0)}
          />
        </span>
      </label>
      <label>
        Ida y vuelta
        <span>
          <b>US$</b>
          <input
            type="number"
            min={0}
            value={roundTrip}
            onChange={(event) => onRoundTrip(Number(event.target.value) || 0)}
          />
        </span>
      </label>
    </div>
  );
}
