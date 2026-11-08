import { useState } from "react";
import type { Zone } from "../data";
import type { AppConfig, ManagedVehicle } from "../store/config";
import {
  defaultFare,
  fareFor,
  includedPassengersOf,
  rateKey,
  transferPrice,
  zonesOf,
  type TransferFare,
} from "../transfers";
import { AdminPager } from "./AdminPager";
import { usePagination } from "./pagination";

function capacityLabel(included: number, max: number) {
  if (included >= max) return `1–${max} pasajeros`;
  return `1–${included} incluidos · máx. ${max}`;
}

function money(value: number) {
  return `US$${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

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
  const vehiclePager = usePagination(config.vehicles);

  function updateVehicle(id: string, patch: Partial<ManagedVehicle>) {
    onChange({
      vehicles: config.vehicles.map((v) => {
        if (v.id !== id) return v;
        const next = { ...v, ...patch };
        const maxPassengers = Math.max(1, Number(next.maxPassengers) || 1);
        const includedPassengers = Math.min(
          maxPassengers,
          Math.max(1, Number(next.includedPassengers) || 1),
        );
        return {
          ...next,
          maxPassengers,
          includedPassengers,
          capacity: capacityLabel(includedPassengers, maxPassengers),
        };
      }),
    });
  }

  function addVehicle() {
    const id = `veh-${Date.now().toString(36)}`;
    const vehicle: ManagedVehicle = {
      id,
      name: "Nuevo vehículo",
      capacity: capacityLabel(4, 10),
      maxPassengers: 10,
      includedPassengers: 4,
      basePrice: 40,
      active: true,
    };
    const transferRates = { ...config.transferRates };
    for (const item of zones) {
      transferRates[rateKey(id, item)] = {
        ...defaultFare(vehicle.basePrice, 0),
        extraOneWay: 5,
        extraRoundTrip: 10,
      };
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
      setActiveZone(
        zones.find((item) => item.toLowerCase() === name.toLowerCase()) ?? name,
      );
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
    for (const vehicle of config.vehicles) {
      delete transferRates[rateKey(vehicle.id, target)];
    }
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
    zoneName: Zone,
    field: keyof TransferFare,
    value: number,
  ) {
    const current = fareFor(config, vehicleId, zoneName);
    onChange({
      transferRates: {
        ...config.transferRates,
        [rateKey(vehicleId, zoneName)]: { ...current, [field]: value },
      },
    });
  }

  return (
    <section className="admin-panel admin-xfer">
      <header className="admin-panel__head">
        <div>
          <h1>Traslados</h1>
          <p>
            Precio base por zona para los pasajeros incluidos; cada persona
            extra hasta el máximo suma un cargo adicional.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={addVehicle}>
          + Vehículo
        </button>
      </header>

      <div className="admin-xfer__hero">
        <form
          className="admin-xfer__add-zone"
          onSubmit={(event) => {
            event.preventDefault();
            addZone();
          }}
        >
          <label>
            Nueva zona
            <input
              value={zoneName}
              placeholder="Ej. Cap Cana"
              aria-label="Nueva zona"
              onChange={(event) => setZoneName(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--primary">
            Agregar zona
          </button>
        </form>
        <p className="admin-xfer__hero-note">
          Los precios que editas abajo aplican a{" "}
          <strong>{zone || "la zona activa"}</strong>.
        </p>
      </div>

      <div className="admin-xfer__tabs" role="tablist" aria-label="Zonas">
        {zones.map((item) => {
          const active = item === zone;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              className={`admin-xfer__tab${active ? " is-active" : ""}`}
              onClick={() => setActiveZone(item)}
            >
              <strong>{item}</strong>
              {zones.length > 1 && (
                <span
                  className="admin-xfer__tab-x"
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
          );
        })}
      </div>

      <div className="admin-xfer__list">
        {vehiclePager.paged.map((vehicle) => {
          const fare = fareFor(config, vehicle.id, zone);
          const included = includedPassengersOf(vehicle);
          const samplePax = Math.min(
            vehicle.maxPassengers,
            Math.max(included + 2, included),
          );
          const samplePrice = transferPrice(fare, vehicle, samplePax, false);
          const extras = Math.max(0, samplePax - included);
          const visible = vehicle.active !== false;

          return (
            <article
              key={vehicle.id}
              className={`admin-xfer-card${visible ? "" : " is-hidden"}`}
            >
              <header className="admin-xfer-card__head">
                <div className="admin-xfer-card__title">
                  <label>
                    <span className="visually-hidden">Vehículo</span>
                    <input
                      value={vehicle.name}
                      onChange={(event) =>
                        updateVehicle(vehicle.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <div className="admin-xfer-card__chips">
                    <span>Base 1–{included}</span>
                    <span>Máx. {vehicle.maxPassengers}</span>
                    {!visible ? <span className="is-off">Oculto</span> : null}
                  </div>
                </div>
                <div className="admin-xfer-card__tools">
                  <label className="admin-xfer-card__toggle">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(event) =>
                        updateVehicle(vehicle.id, {
                          active: event.target.checked,
                        })
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
              </header>

              <div className="admin-xfer-card__capacity">
                <label>
                  Incluidos en el precio base
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={included}
                    onChange={(event) =>
                      updateVehicle(vehicle.id, {
                        includedPassengers: Number(event.target.value) || 1,
                      })
                    }
                  />
                </label>
                <label>
                  Capacidad máxima
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
                <div className="admin-xfer-card__sample">
                  <span>Ejemplo en {zone}</span>
                  <strong>
                    {samplePax} pax → {money(samplePrice)}
                  </strong>
                  <small>
                    {extras > 0
                      ? `${money(fare.oneWay)} base + ${extras}×${money(fare.extraOneWay)}`
                      : `${money(fare.oneWay)} precio base`}
                  </small>
                </div>
              </div>

              <div className="admin-xfer-card__prices">
                <div className="admin-xfer-price">
                  <div className="admin-xfer-price__head">
                    <p>Precio base</p>
                    <span>1–{included} pasajeros</span>
                  </div>
                  <label>
                    Ida
                    <span>
                      <b>US$</b>
                      <input
                        type="number"
                        min={0}
                        value={fare.oneWay}
                        onChange={(event) =>
                          setFare(
                            vehicle.id,
                            zone,
                            "oneWay",
                            Number(event.target.value) || 0,
                          )
                        }
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
                        value={fare.roundTrip}
                        onChange={(event) =>
                          setFare(
                            vehicle.id,
                            zone,
                            "roundTrip",
                            Number(event.target.value) || 0,
                          )
                        }
                      />
                    </span>
                  </label>
                </div>

                <div className="admin-xfer-price admin-xfer-price--extra">
                  <div className="admin-xfer-price__head">
                    <p>Pasajero extra</p>
                    <span>
                      Desde {included + 1} hasta {vehicle.maxPassengers}
                    </span>
                  </div>
                  <label>
                    Extra ida
                    <span>
                      <b>US$</b>
                      <input
                        type="number"
                        min={0}
                        value={fare.extraOneWay}
                        onChange={(event) =>
                          setFare(
                            vehicle.id,
                            zone,
                            "extraOneWay",
                            Number(event.target.value) || 0,
                          )
                        }
                      />
                    </span>
                  </label>
                  <label>
                    Extra ida y vuelta
                    <span>
                      <b>US$</b>
                      <input
                        type="number"
                        min={0}
                        value={fare.extraRoundTrip}
                        onChange={(event) =>
                          setFare(
                            vehicle.id,
                            zone,
                            "extraRoundTrip",
                            Number(event.target.value) || 0,
                          )
                        }
                      />
                    </span>
                  </label>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <AdminPager
        total={vehiclePager.total}
        page={vehiclePager.page}
        pageSize={vehiclePager.pageSize}
        pageCount={vehiclePager.pageCount}
        onPageChange={vehiclePager.setPage}
      />
    </section>
  );
}
