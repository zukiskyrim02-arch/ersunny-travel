export type Locale = "en" | "es" | "fr" | "de" | "zh" | "ru";

export type LocaleMeta = {
  code: Locale;
  label: string;
  name: string;
  flag: string;
};

export const LOCALES: LocaleMeta[] = [
  { code: "en", label: "EN", name: "English", flag: "🇺🇸" },
  { code: "es", label: "ES", name: "Español", flag: "🇪🇸" },
  { code: "fr", label: "FR", name: "Français", flag: "🇫🇷" },
  { code: "de", label: "DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "zh", label: "中文", name: "中文", flag: "🇨🇳" },
  { code: "ru", label: "RU", name: "Русский", flag: "🇷🇺" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "ersunny-locale";

export function isLocale(value: string): value is Locale {
  return LOCALES.some((l) => l.code === value);
}
