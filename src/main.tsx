import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./Root";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

// Remove the static LCP shell once React has painted
requestAnimationFrame(() => {
  document.getElementById("boot-hero")?.remove();
});
