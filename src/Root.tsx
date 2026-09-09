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
import { currentPath, migrateLegacyHashRoute } from "./routing";
import {
  applyPageSeo,
  faqJsonLd,
  organizationJsonLd,
  seoForPath,
  serviceJsonLd,
  websiteJsonLd,
} from "./seo";
import { faqs } from "./data";

export function Root() {
  const [path, setPath] = useState(() => {
    migrateLegacyHashRoute();
    return currentPath();
  });
  const [azulBanner, setAzulBanner] = useState<string | null>(null);

  useEffect(() => {
    migrateLegacyHashRoute();
    setPath(currentPath());

    const sync = () => setPath(currentPath());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);

    // Scroll to in-page anchor on first load (e.g. /#cotizar)
    if (window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }

    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  useEffect(() => {
    const seo = seoForPath(path);
    if (path === "/" || path === "") {
      applyPageSeo({
        ...seo,
        jsonLd: [organizationJsonLd(), websiteJsonLd(), serviceJsonLd()],
      });
    } else if (path.includes("faq") || path === "/about") {
      applyPageSeo({
        ...seo,
        jsonLd: [
          organizationJsonLd(),
          websiteJsonLd(),
          ...(path.includes("faq") ? [faqJsonLd(faqs)] : []),
        ],
      });
    } else {
      applyPageSeo({
        ...seo,
        jsonLd: [organizationJsonLd(), websiteJsonLd()],
      });
    }
  }, [path]);

  useEffect(() => {
    // SPA clicks: same-origin path links without full reload
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as Element | null;
      const a = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || !a.href) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      const url = new URL(a.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      // Static assets
      if (/\.(png|jpe?g|webp|svg|gif|pdf|css|js)$/i.test(url.pathname)) return;

      // Same-page hash only → let browser handle scroll
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      e.preventDefault();
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      setPath(currentPath());
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        window.setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      } else {
        window.scrollTo(0, 0);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const result = readAzulReturnFromUrl();
    if (!result) return;

    if (result.status === "approved" && result.orderNumber) {
      updateReservation(result.orderNumber, { status: "paid" });
      const found = findReservation(result.orderNumber);
      setAzulBanner(
        found
          ? `Pago Azul payment approved for ${result.orderNumber}${result.authorizationCode ? ` · Auth ${result.authorizationCode}` : ""}.`
          : `Pago Azul payment approved (${result.orderNumber}).`,
      );
      window.history.replaceState(null, "", "/excursions#pago");
      setPath("/excursions");
    } else if (result.status === "declined") {
      setAzulBanner(
        `Pago Azul payment declined${result.responseMessage ? `: ${result.responseMessage}` : "."}`,
      );
    } else if (result.status === "cancel") {
      setAzulBanner("You canceled the Azul payment. You can try again.");
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
            Close
          </button>
        </div>
      )}
      {page}
    </>
  );
}
