/** Public asset path using Vite BASE_URL (works on Vercel, custom domain, and local). */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}
