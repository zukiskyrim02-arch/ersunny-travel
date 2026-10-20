import { lazy, Suspense, useEffect, useState } from "react";
import App from "./App";
import { AboutPage } from "./AboutPage";
import { ContactPage } from "./ContactPage";
import { ExcursionsPage } from "./ExcursionsPage";
import { PaymentPage } from "./PaymentPage";
import { ReviewPage } from "./ReviewPage";
import { reviewsEnabled } from "../shared/features";
import { StaffPickupPage } from "./StaffPickupPage";
import { ConfirmPickupPage } from "./ConfirmPickupPage";
import {
  clearAzulQueryFromUrl,
  readAzulReturnFromUrl,
} from "./payments/azul";
import {
  findReservation,
  startReservationsSync,
  updateReservation,
} from "./reservations";
import { startConfigSync } from "./store/config";
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
import { useMedia } from "./media/library";

const AdminApp = lazy(() =>
  import("./admin/AdminApp").then((m) => ({ default: m.AdminApp })),
);

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  let tries = 0;
  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (tries < 24) {
      tries += 1;
      window.setTimeout(tick, 50);
    }
  };
  window.setTimeout(tick, 0);
}

export function Root() {
  const media = useMedia();
  const [path, setPath] = useState(() => {
    migrateLegacyHashRoute();
    return currentPath();
  });
  const [azulBanner, setAzulBanner] = useState<string | null>(null);

  useEffect(() => {
    const stopReservations = startReservationsSync();
    const stopConfig = startConfigSync();
    return () => {
      stopReservations();
      stopConfig();
    };
  }, []);

  useEffect(() => {
    migrateLegacyHashRoute();
    setPath(currentPath());

    const sync = () => setPath(currentPath());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);

    // Scroll to in-page anchor on first load (e.g. /#cotizar)
    if (window.location.hash) scrollToHash(window.location.hash);

    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  useEffect(() => {
    const seo = seoForPath(path);
    const ogImage = media.absolute("hero", 1600);
    const org = organizationJsonLd({
      logo: media.absolute("logo", 480),
      image: ogImage,
    });
    if (path === "/" || path === "") {
      applyPageSeo({
        ...seo,
        ogImage,
        jsonLd: [org, websiteJsonLd(), serviceJsonLd()],
      });
    } else if (path.includes("faq") || path === "/about") {
      applyPageSeo({
        ...seo,
        ogImage,
        jsonLd: [
          org,
          websiteJsonLd(),
          ...(path.includes("faq") ? [faqJsonLd(faqs)] : []),
        ],
      });
    } else {
      applyPageSeo({
        ...seo,
        ogImage,
        jsonLd: [org, websiteJsonLd()],
      });
    }
  }, [path, media]);

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
      if (url.hash) scrollToHash(url.hash);
      else window.scrollTo(0, 0);
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
      window.history.replaceState(
        null,
        "",
        `/payment?id=${encodeURIComponent(result.orderNumber)}`,
      );
      setPath("/payment");

      // Confirm payment by email + send customer the pickup-time link
      if (found) {
        void import("./notifyBooking").then(({ sendPaidBookingEmails }) =>
          sendPaidBookingEmails(found).catch(() => undefined),
        );
      }
    } else if (result.status === "declined") {
      setAzulBanner(
        `Pago Azul payment declined${result.responseMessage ? `: ${result.responseMessage}` : "."}`,
      );
    } else if (result.status === "cancel") {
      setAzulBanner("You canceled the Azul payment. You can try again.");
    }

    clearAzulQueryFromUrl();
  }, []);

  if (reviewsEnabled && path === "/review") {
    return <ReviewPage />;
  }

  if (path === "/admin/pickup") {
    return <StaffPickupPage />;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    return (
      <Suspense fallback={<div className="admin-loading">Loading admin…</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  if (path === "/confirm-pickup") {
    return <ConfirmPickupPage />;
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
    ) : path === "/payment" || path === "/pago" ? (
      <PaymentPage />
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
