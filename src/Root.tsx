import { useEffect, useState } from "react";
import App from "./App";
import { AdminApp } from "./admin/AdminApp";

function currentPath() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function Root() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onHash = () => setPath(currentPath());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminApp />;
  }

  return <App />;
}
