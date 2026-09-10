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
  zoneSurcharge: Record<Zone, number>;
  hotelsByZone: Record<Zone, string[]>;
  excursions: ManagedExcursion[];
  contact: SiteContact;
  bank: SiteBank;
  page: SitePageCopy;
  azul: AzulConfig;
};

const CONFIG_KEY = "ersunny-config-v1";
const AUTH_KEY = "ersunny-admin-auth";

/** Change this password in production / share only with staff. */
export const ADMIN_PASSWORD = "ErsunnyAdmin2026";

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
  return {
    vehicles: defaultVehicles.map((v) => ({
      ...v,
      maxPassengers: v.id === "sedan" ? 3 : v.id === "suv" ? 5 : 10,
      active: true,
    })),
    zoneSurcharge: { ...defaultZoneSurcharge },
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
): Record<Zone, string[]> {
  return {
    "Punta Cana":
      parsed?.["Punta Cana"]?.length ? parsed["Punta Cana"] : base["Punta Cana"],
    Bávaro: parsed?.Bávaro?.length ? parsed.Bávaro : base.Bávaro,
    Macao: parsed?.Macao?.length ? parsed.Macao : base.Macao,
  };
}

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    const base = defaultConfig();
    return {
      vehicles: (parsed.vehicles?.length ? parsed.vehicles : base.vehicles).map(
        (v) => ({
          ...v,
          active: v.active ?? true,
        }),
      ),
      zoneSurcharge: {
        ...base.zoneSurcharge,
        ...parsed.zoneSurcharge,
      },
      hotelsByZone: mergeHotels(parsed.hotelsByZone, base.hotelsByZone),
      excursions: (() => {
        const list = parsed.excursions?.length
          ? parsed.excursions
          : base.excursions;
        return list.map((e) => {
          const def = base.excursions.find((d) => d.id === e.id);
          return {
            ...def,
            ...e,
            price: e.price ?? def?.price ?? null,
            duration: e.duration || def?.duration || "",
            title: e.title || def?.title || "",
            image: e.image || def?.image || "",
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
    };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("ersunny-config"));
}

export function resetConfig() {
  localStorage.removeItem(CONFIG_KEY);
  window.dispatchEvent(new Event("ersunny-config"));
}

export function isAdminAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminAuthed(ok: boolean) {
  if (ok) sessionStorage.setItem(AUTH_KEY, "1");
  else sessionStorage.removeItem(AUTH_KEY);
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
