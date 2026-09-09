/** Path-based SPA routing helpers (SEO-friendly URLs). */

export function currentPath(): string {
  const path = window.location.pathname || "/";
  // Normalize trailing slash except root
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

/** Migrate legacy hash routes (#/about) to real paths (/about). */
export function migrateLegacyHashRoute(): boolean {
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return false;

  const raw = hash.slice(1); // "/about" or "/about/faq"
  const [pathPart, hashQuery] = raw.split("?");
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const search = hashQuery ? `?${hashQuery}` : window.location.search;
  const next = `${path}${search}`;
  window.history.replaceState(null, "", next);
  return true;
}

export function navigate(to: string) {
  const url = new URL(to, window.location.origin);
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    url.hash === window.location.hash
  ) {
    return;
  }
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
