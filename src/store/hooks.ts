import { useEffect, useState } from "react";
import { getConfig, useConfigSubscribe, type AppConfig } from "./config";
import { listReservations, type Reservation } from "../reservations";

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(() => getConfig());

  useEffect(() => {
    return useConfigSubscribe(() => setConfig(getConfig()));
  }, []);

  return config;
}

export function useReservations() {
  const [items, setItems] = useState<Reservation[]>(() => listReservations());

  useEffect(() => {
    const refresh = () => setItems(listReservations());
    window.addEventListener("ersunny-reservations", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ersunny-reservations", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return items;
}
