import { databaseUrl } from "./rtdb.js";

const DEFAULT_USD_DOP_RATE = 61.45;

/** Valid Cardnet conversion: Dominican pesos per 1 US dollar. */
export function parseUsdDopRate(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 200) return null;
  return Math.round(n * 10000) / 10000;
}

function envFallback(): number {
  return parseUsdDopRate(process.env.CARDNET_USD_DOP_RATE) ?? DEFAULT_USD_DOP_RATE;
}

/**
 * Prefer the rate saved in Admin → Pagos (Firebase config.usdDopRate).
 * Env CARDNET_USD_DOP_RATE stays as an offline fallback only.
 */
export async function resolveUsdDopRate(): Promise<number> {
  const base = databaseUrl();
  if (!base) return envFallback();
  try {
    const res = await fetch(`${base}/config/usdDopRate.json`);
    if (!res.ok) return envFallback();
    const parsed = parseUsdDopRate(await res.json());
    return parsed ?? envFallback();
  } catch {
    return envFallback();
  }
}

export { DEFAULT_USD_DOP_RATE };
