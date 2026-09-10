import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./Root";
import { I18nProvider } from "./i18n/I18nProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <Root />
    </I18nProvider>
  </StrictMode>,
);

// Remove the static LCP shell once React has painted
requestAnimationFrame(() => {
  document.getElementById("boot-hero")?.remove();
});
