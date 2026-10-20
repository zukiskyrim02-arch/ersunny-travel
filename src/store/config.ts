import {
  bankPayment as defaultBank,
  contact as defaultContact,
  excursions as defaultExcursions,
  hotelsByZone as defaultHotels,
  vehicles as defaultVehicles,
  zoneSurcharge as defaultZoneSurcharge,
  type Zone,
} from "../data";
import { defaultAzulConfig, type AzulConfig } from "../payments/azul";
import { dbGet, dbRemove, dbSet, dbSubscribe } from "../firebase";
import {
  TRANSFER_ZONES,
  buildTransferRates,
  zonesOf,
  type TransferRates,
} from "../transfers";

export type ManagedVehicle = {
  id: string;
  name: string;
  capacity: string;
  maxPassengers: number;
  basePrice: number;
  active: boolean;
};

export type ManagedExcursion = {
  id: string;
  title: string;
  duration: string;
  blurb: string;
  image: string;
  highlights: string[];
  price: number | null;
  active: boolean;
};

export type SiteBank = {
  bank: string;
  accountType: string;
  accountNumber: string;
  holder: string;
  rnc: string;
};

export type SiteContact = {
  email: string;
  whatsapp: string;
  whatsappDigits: string;
  location: string;
};

export type SitePageCopy = {
  /** Optional Spanish overrides shown when set (marketing copy on home). */
  heroEyebrow: string;
  heroTitle: string;
  heroLead: string;
  servicesTitle: string;
  servicesLead: string;
  aboutMission: string;
  aboutVision: string;
};

export type AppConfig = {
  vehicles: ManagedVehicle[];
  /** Explicit prices per vehicle and zone. The public form uses these numbers. */
  transferRates: TransferRates;
  /** Ordered destination zones. Prices and hotels follow this list. */
  zones: string[];
  zoneSurcharge: Record<Zone, number>;
  hotelsByZone: Record<Zone, string[]>;
  excursions: ManagedExcursion[];
  contact: SiteContact;
  bank: SiteBank;
  page: SitePageCopy;
  azul: AzulConfig;
  /** Milliseconds. Newer local saves win over a stale Firebase snapshot. */
  updatedAt?: number;
};

const CONFIG_KEY = "ersunny-config-v1";

export function defaultPageCopy(): SitePageCopy {
  return {
    heroEyebrow: "",
    heroTitle: "",
    heroLead: "",
    servicesTitle: "",
    servicesLead: "",
    aboutMission: "",
    aboutVision: "",
  };
}

export function defaultConfig(): AppConfig {
  const vehicles = defaultVehicles.map((v) => ({
    ...v,
    maxPassengers: v.id === "sedan" ? 3 : v.id === "suv" ? 5 : 10,
    active: true,
  }));
  const zoneSurcharge = { ...defaultZoneSurcharge };
  return {
    vehicles,
    zones: [...TRANSFER_ZONES],
    zoneSurcharge,
    transferRates: buildTransferRates(vehicles, zoneSurcharge),
    hotelsByZone: {
      "Punta Cana": [...defaultHotels["Punta Cana"]],
      Bávaro: [...defaultHotels.Bávaro],
      Macao: [...defaultHotels.Macao],
    },
    excursions: defaultExcursions.map((e) => ({
      ...e,
      price: "price" in e ? (e.price as number | null) : null,
      active: true,
    })),
    contact: { ...defaultContact, location: "Punta Cana, República Dominicana" },
    bank: { ...defaultBank },
    page: defaultPageCopy(),
    azul: defaultAzulConfig(),
  };
}

function mergeHotels(
  parsed: Partial<Record<Zone, string[]>> | undefined,
  base: Record<Zone, string[]>,
  zones: string[],
): Record<Zone, string[]> {
  const hotels: Record<Zone, string[]> = {};
  for (const zone of zones) {
    const saved = parsed?.[zone];
    hotels[zone] = Array.isArray(saved) ? saved : [...(base[zone] ?? [])];
  }
  return hotels;
}

function sharperRemoteImage(url: string): string {
  if (!url.includes("images.unsplash.com")) return url;
  return url
    .replace(/([?&])w=\d+/, "$1w=1400")
    .replace(/([?&])q=\d+/, "$1q=75");
}

/** Firebase sometimes returns lists as {"0": item, "1": item}. */
function asList<T>(value: unknown): T[] | undefined {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return undefined;
  const rows = Object.entries(value as Record<string, T>)
    .filter(([key]) => /^\d+$/.test(key))
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, row]) => row);
  return rows.length ? rows : undefined;
}

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    const base = defaultConfig();
    const vehicleList = asList<ManagedVehicle>(parsed.vehicles);
    const vehicles = (vehicleList?.length ? vehicleList : base.vehicles).map(
      (v) => ({
        ...v,
        active: v.active ?? true,
      }),
    );
    const zones = zonesOf({
      zones: asList<string>(parsed.zones),
      hotelsByZone: parsed.hotelsByZone,
    });
    const zoneSurcharge = {
      ...base.zoneSurcharge,
      ...parsed.zoneSurcharge,
    };
    for (const zone of zones) zoneSurcharge[zone] ??= 0;
    return {
      vehicles,
      zones,
      zoneSurcharge,
      transferRates: buildTransferRates(
        vehicles,
        zoneSurcharge,
        parsed.transferRates,
        zones,
      ),
      hotelsByZone: mergeHotels(parsed.hotelsByZone, base.hotelsByZone, zones),
      excursions: (() => {
        const stored = asList<ManagedExcursion>(parsed.excursions);
        const list = stored?.length ? stored : base.excursions;
        return list.map((e) => {
          const def = base.excursions.find((d) => d.id === e.id);
          return {
            ...def,
            ...e,
            price: e.price ?? def?.price ?? null,
            duration: e.duration || def?.duration || "",
            title: e.title || def?.title || "",
            image: sharperRemoteImage(e.image || def?.image || ""),
            blurb: e.blurb || def?.blurb || "",
            highlights: e.highlights?.length
              ? e.highlights
              : def?.highlights || [],
            active: e.active ?? true,
          };
        });
      })(),
      contact: { ...base.contact, ...parsed.contact },
      bank: { ...base.bank, ...parsed.bank },
      page: { ...base.page, ...parsed.page },
      azul: { ...base.azul, ...parsed.azul },
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : undefined,
    };
  } catch {
    return defaultConfig();
  }
}

function writeLocalConfig(config: AppConfig) {
  const next = JSON.stringify(config);
  if (localStorage.getItem(CONFIG_KEY) === next) return;
  localStorage.setItem(CONFIG_KEY, next);
  window.dispatchEvent(new Event("ersunny-config"));
}

export function saveConfig(config: AppConfig) {
  const next = { ...config, updatedAt: Date.now() };
  writeLocalConfig(next);
  // Never sync Azul auth key to the public database node.
  dbSet("config", { ...next, azul: { ...next.azul, authKey: "" } });
}

export function resetConfig() {
  localStorage.removeItem(CONFIG_KEY);
  window.dispatchEvent(new Event("ersunny-config"));
  dbRemove("config");
}

/* ── Firebase Realtime Database sync ────────────────────────────── */

let configSyncStarted = false;

function publishConfig(config: AppConfig) {
  dbSet("config", { ...config, azul: { ...config.azul, authKey: "" } });
}

function applyRemoteConfig(value: unknown) {
  if (!value || typeof value !== "object") {
    publishConfig(getConfig());
    return;
  }
  const remote = value as Partial<AppConfig>;
  if (!remote.vehicles && !remote.excursions && !remote.contact) return;
  const local = getConfig();
  const remoteAt = typeof remote.updatedAt === "number" ? remote.updatedAt : 0;
  const localAt = typeof local.updatedAt === "number" ? local.updatedAt : 0;
  if (localAt > remoteAt) {
    publishConfig(local);
    return;
  }
  const remoteVehicles = asList<ManagedVehicle>(remote.vehicles);
  const remoteExcursions = asList<ManagedExcursion>(remote.excursions);
  writeLocalConfig({
    ...local,
    ...remote,
    vehicles: remoteVehicles ?? local.vehicles,
    excursions: remoteExcursions ?? local.excursions,
    updatedAt: remoteAt || localAt || undefined,
    azul: { ...local.azul, ...(remote.azul ?? {}), authKey: local.azul.authKey },
  });
}

/**
 * Live sync: Firebase `config` → local cache. If Firebase has no
 * config yet, the current local/default config is uploaded once.
 * The listener is restarted after React strict-mode remounts.
 */
export function startConfigSync(): () => void {
  if (configSyncStarted) return () => undefined;
  configSyncStarted = true;
  const stop = dbSubscribe("config", applyRemoteConfig);
  const refresh = () => {
    if (document.visibilityState === "hidden") return;
    void dbGet("config").then((value) => {
      if (value) applyRemoteConfig(value);
    });
  };
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    stop();
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
    configSyncStarted = false;
  };
}

export function useConfigSubscribe(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("ersunny-config", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("ersunny-config", handler);
    window.removeEventListener("storage", handler);
  };
}

/** Live contact from admin config (falls back to defaults). */
export function getSiteContact(): SiteContact {
  return getConfig().contact;
}

export function getSiteBank(): SiteBank {
  return getConfig().bank;
}

export function getHotelsByZone(): Record<Zone, string[]> {
  return getConfig().hotelsByZone;
}
