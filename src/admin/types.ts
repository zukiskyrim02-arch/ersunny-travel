import { flightsEnabled } from "../../shared/features";

export type AdminTab =
  | "overview"
  | "reservations"
  | "flights"
  | "vehicles"
  | "zones"
  | "excursions"
  | "media"
  | "site"
  | "payments";

export const ADMIN_TABS: {
  id: AdminTab;
  label: string;
  hint: string;
  group: "ops" | "catalog" | "settings";
}[] = [
  { id: "overview", label: "Resumen", hint: "Vista general", group: "ops" },
  {
    id: "reservations",
    label: "Reservas",
    hint: "Pedidos y clientes",
    group: "ops",
  },
  ...(flightsEnabled
    ? [
        {
          id: "flights" as const,
          label: "Vuelos",
          hint: "Horario real y hora de recogida",
          group: "ops" as const,
        },
      ]
    : []),
  {
    id: "vehicles",
    label: "Traslados",
    hint: "Vehículos y precios fijos",
    group: "catalog",
  },
  {
    id: "zones",
    label: "Hoteles",
    hint: "Agregar o quitar hoteles",
    group: "catalog",
  },
  {
    id: "excursions",
    label: "Excursiones",
    hint: "Tours y puntos de recogida",
    group: "catalog",
  },
  {
    id: "media",
    label: "Galería",
    hint: "Fotos y videos",
    group: "catalog",
  },
  {
    id: "site",
    label: "Sitio web",
    hint: "Contacto y textos",
    group: "settings",
  },
  {
    id: "payments",
    label: "Pagos",
    hint: "Tarjeta, PayPal y conexiones",
    group: "settings",
  },
];

export const ADMIN_GROUP_LABELS: Record<
  (typeof ADMIN_TABS)[number]["group"],
  string
> = {
  ops: "Operaciones",
  catalog: "Catálogo",
  settings: "Configuración",
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
