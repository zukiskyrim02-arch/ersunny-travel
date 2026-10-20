import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  type Database,
} from "firebase/database";

/** Firebase web config. Values come from VITE_FIREBASE_* in .env / Vercel. */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const FIREBASE_INFO = {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
  authDomain: firebaseConfig.authDomain,
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

export function getDb(): Database | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.databaseURL) return null;
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}

/** RTDB cannot store `undefined` — strip those keys deeply. */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

export function dbSet(path: string, value: unknown): void {
  const database = getDb();
  if (!database) return;
  void set(ref(database, path), stripUndefined(value)).catch((err) => {
    console.warn(`[firebase] write failed (${path})`, err);
  });
}

export function dbRemove(path: string): void {
  const database = getDb();
  if (!database) return;
  void remove(ref(database, path)).catch((err) => {
    console.warn(`[firebase] remove failed (${path})`, err);
  });
}

export async function dbGet<T>(path: string): Promise<T | null> {
  const database = getDb();
  if (!database) return null;
  try {
    const snap = await get(ref(database, path));
    return snap.exists() ? (snap.val() as T) : null;
  } catch (err) {
    console.warn(`[firebase] read failed (${path})`, err);
    return null;
  }
}

/** Subscribe to a node. Returns unsubscribe. */
export function dbSubscribe(
  path: string,
  onData: (value: unknown) => void,
): () => void {
  const database = getDb();
  if (!database) return () => undefined;
  return onValue(
    ref(database, path),
    (snap) => onData(snap.exists() ? snap.val() : null),
    (err) => console.warn(`[firebase] listen failed (${path})`, err),
  );
}
