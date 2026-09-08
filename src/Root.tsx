import { useEffect, useState } from "react";
import App from "./App";
import { AboutPage } from "./AboutPage";
import { ContactPage } from "./ContactPage";
import { ExcursionsPage } from "./ExcursionsPage";
import { AdminApp } from "./admin/AdminApp";
import {
  clearAzulQueryFromUrl,
  readAzulReturnFromUrl,
} from "./payments/azul";
import { findReservation, updateReservation } from "./reservations";

function currentPath() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function Root() {
  const [path, setPath] = useState(currentPath);
  const [azulBanner, setAzulBanner] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => setPath(currentPath());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const result = readAzulReturnFromUrl();
    if (!result) return;

    if (result.status === "approved" && result.orderNumber) {
      updateReservation(result.orderNumber, { status: "paid" });
      const found = findReservation(result.orderNumber);
      setAzulBanner(
        found
          ? `Pago Azul aprobado para ${result.orderNumber}${result.authorizationCode ? ` · Auth ${result.authorizationCode}` : ""}.`
          : `Pago Azul aprobado (${result.orderNumber}).`,
      );
      window.location.hash = "#pago";
    } else if (result.status === "declined") {
      setAzulBanner(
        `Pago Azul declinado${result.responseMessage ? `: ${result.responseMessage}` : "."}`,
      );
    } else if (result.status === "cancel") {
      setAzulBanner("Cancelaste el pago en Azul. Puedes intentarlo de nuevo.");
    }

    clearAzulQueryFromUrl();
  }, []);

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminApp />;
  }

  const page =
    path === "/about" ||
    path.startsWith("/about/") ||
    path === "/nosotros" ? (
      <AboutPage />
    ) : path === "/excursions" || path === "/excursiones" ? (
      <ExcursionsPage />
    ) : path === "/contact" || path === "/contacto" ? (
      <ContactPage />
    ) : (
      <App />
    );

  return (
    <>
      {azulBanner && (
        <div className="azul-banner" role="status">
          <p>{azulBanner}</p>
          <button type="button" onClick={() => setAzulBanner(null)}>
            Cerrar
          </button>
        </div>
      )}
      {page}
    </>
  );
}
