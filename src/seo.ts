/** Canonical site URL for SEO, sitemap, and Open Graph. */
export const SITE_URL = "https://www.ersunnytravel.com";

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  /** Comma-separated keywords (secondary signal; still useful for consistency). */
  keywords?: string;
  noindex?: boolean;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export const defaultOgImage = `${SITE_URL}/hero-cover.jpg`;

export const pageSeo: Record<string, PageSeo> = {
  home: {
    path: "/",
    title: "Punta Cana Airport Transfers & Excursions | Ersunny Travel",
    description:
      "Affordable and luxury private transfers from Punta Cana Airport (PUJ) to hotels in Punta Cana, Bávaro & Macao. Book excursions and WhatsApp support.",
    keywords:
      "Punta Cana airport transfer, Bávaro transfer, Macao transfer, PUJ private transfer, Punta Cana excursions, cheap airport transfer Punta Cana, luxury transfer Dominican Republic",
  },
  about: {
    path: "/about",
    title: "About Ersunny Travel | Private Transfers Punta Cana",
    description:
      "Learn about Ersunny Travel: safe tourist transport and excursions in Punta Cana, Bávaro, and Macao with personalized WhatsApp support.",
    keywords:
      "Ersunny Travel, about, Punta Cana transport company, Dominican Republic transfers",
  },
  aboutFaq: {
    path: "/about/faq",
    title: "FAQ | Punta Cana Airport Transfers — Ersunny Travel",
    description:
      "Answers about booking transfers, flight delays, payments with Pago Azul, airport pickup, and excursions in Punta Cana with Ersunny Travel.",
    keywords:
      "Punta Cana transfer FAQ, airport pickup, cancel flight transfer, Pago Azul",
  },
  excursions: {
    path: "/excursions",
    title: "Punta Cana Excursions & Tours | Ersunny Travel",
    description:
      "Book popular Punta Cana excursions: Saona, Catalina, Santo Domingo, and more. Family-friendly tours with hotel pickup and secure online payment.",
    keywords:
      "Punta Cana excursions, Saona Island tour, Catalina Island, Dominican Republic tours, hotel pickup",
  },
  contact: {
    path: "/contact",
    title: "Contact Ersunny Travel | WhatsApp Transfers Punta Cana",
    description:
      "Contact Ersunny Travel for airport transfers and excursions in Punta Cana, Bávaro, and Macao. WhatsApp +1 809 671 0965 or email us today.",
    keywords:
      "contact Ersunny Travel, WhatsApp Punta Cana transfer, book transfer PUJ",
  },
  payment: {
    path: "/payment",
    title: "Payment Form | Ersunny Travel",
    description:
      "Complete your Ersunny Travel reservation payment securely with Pago Azul or bank transfer.",
    noindex: true,
  },
  admin: {
    path: "/admin",
    title: "Admin | Ersunny Travel",
    description: "Ersunny Travel administration panel.",
    noindex: true,
  },
};

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  const id = "ersunny-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: "Ersunny Travel",
    url: SITE_URL,
    logo: `${SITE_URL}/ersunny-logo.webp`,
    image: defaultOgImage,
    description:
      "Private airport transfers and excursions in Punta Cana, Bávaro, and Macao — affordable and luxury options with WhatsApp support.",
    email: "contact@ersunnytravel.com",
    telephone: "+18096710965",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Punta Cana",
      addressRegion: "La Altagracia",
      addressCountry: "DO",
    },
    areaServed: [
      { "@type": "Place", name: "Punta Cana" },
      { "@type": "Place", name: "Bávaro" },
      { "@type": "Place", name: "Macao" },
      { "@type": "Airport", name: "Punta Cana International Airport", iataCode: "PUJ" },
    ],
    sameAs: [],
    priceRange: "$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      bestRating: "5",
      ratingCount: "3",
      reviewCount: "3",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Maria G." },
        reviewBody:
          "Excellent service from pickup to drop-off. The driver was waiting with our name and the SUV was spotless.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Carlos R." },
        reviewBody:
          "Booked Saona through Ersunny and everything was seamless. Clear communication on WhatsApp the whole time.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Emma L." },
        reviewBody:
          "Airport transfer with kids was stress-free. On time, friendly, and fair pricing. Highly recommend.",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      },
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Ersunny Travel",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };
}

export function serviceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Punta Cana Airport Private Transfers",
    serviceType: "Airport shuttle / private transfer",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: ["Punta Cana", "Bávaro", "Macao"],
    description:
      "Private sedan, SUV, and van transfers from Punta Cana Airport (PUJ) to hotels in Punta Cana, Bávaro, and Macao at affordable and luxury rates.",
  };
}

export function faqJsonLd(
  faqs: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function applyPageSeo(seo: PageSeo) {
  const url = `${SITE_URL}${seo.path === "/" ? "/" : seo.path}`;
  const image = seo.ogImage ?? defaultOgImage;

  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  if (seo.keywords) upsertMeta("name", "keywords", seo.keywords);
  upsertMeta(
    "name",
    "robots",
    seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
  );
  upsertMeta("name", "author", "Ersunny Travel");
  upsertMeta("name", "geo.region", "DO-11");
  upsertMeta("name", "geo.placename", "Punta Cana");

  upsertLink("canonical", url);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", "Ersunny Travel");
  upsertMeta("property", "og:locale", "en_US");
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:image", image);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", image);

  const graph = seo.jsonLd
    ? Array.isArray(seo.jsonLd)
      ? seo.jsonLd
      : [seo.jsonLd]
    : [organizationJsonLd(), websiteJsonLd()];
  upsertJsonLd(graph);
}

export function seoForPath(path: string): PageSeo {
  if (path === "/admin" || path.startsWith("/admin/")) return pageSeo.admin;
  if (path.includes("faq")) return pageSeo.aboutFaq;
  if (
    path === "/about" ||
    path.startsWith("/about/") ||
    path === "/nosotros"
  ) {
    return pageSeo.about;
  }
  if (path === "/excursions" || path === "/excursiones") return pageSeo.excursions;
  if (path === "/contact" || path === "/contacto") return pageSeo.contact;
  if (path === "/payment" || path === "/pago") return pageSeo.payment;
  return pageSeo.home;
}
