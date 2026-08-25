/** Public asset path that works on GitHub Pages and locally. */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}
