export type AdminTab =
  | "overview"
  | "reservations"
  | "vehicles"
  | "zones"
  | "excursions"
  | "site"
  | "azul";

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
  {
    id: "vehicles",
    label: "Traslados",
    hint: "Vehículos y precios",
    group: "catalog",
  },
  {
    id: "zones",
    label: "Zonas y hoteles",
    hint: "Recargos y listados",
    group: "catalog",
  },
  {
    id: "excursions",
    label: "Excursiones",
    hint: "Tours del catálogo",
    group: "catalog",
  },
  {
    id: "site",
    label: "Sitio web",
    hint: "Contacto y textos",
    group: "settings",
  },
  {
    id: "azul",
    label: "Pagos Azul",
    hint: "Cobros con tarjeta",
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
