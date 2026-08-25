import {
  excursions as defaultExcursions,
  vehicles as defaultVehicles,
  zoneSurcharge as defaultZoneSurcharge,
  type Zone,
} from "../data";

export type ManagedVehicle = {
  id: string;
  name: string;
  capacity: string;
  maxPassengers: number;
  basePrice: number;
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

export type AppConfig = {
  vehicles: ManagedVehicle[];
  zoneSurcharge: Record<Zone, number>;
  excursions: ManagedExcursion[];
};

const CONFIG_KEY = "ersunny-config-v1";
const AUTH_KEY = "ersunny-admin-auth";

/** Change this password in production / share only with staff. */
export const ADMIN_PASSWORD = "ErsunnyAdmin2026";

export function defaultConfig(): AppConfig {
  return {
    vehicles: defaultVehicles.map((v) => ({
      ...v,
      maxPassengers: v.id === "sedan" ? 3 : v.id === "suv" ? 5 : 10,
    })),
    zoneSurcharge: { ...defaultZoneSurcharge },
    excursions: defaultExcursions.map((e) => ({
      ...e,
      price: null,
      active: true,
    })),
  };
}

export function getConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw) as AppConfig;
    return {
      vehicles: parsed.vehicles?.length ? parsed.vehicles : defaultConfig().vehicles,
      zoneSurcharge: {
        ...defaultConfig().zoneSurcharge,
        ...parsed.zoneSurcharge,
      },
      excursions: parsed.excursions?.length
        ? parsed.excursions
        : defaultConfig().excursions,
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
