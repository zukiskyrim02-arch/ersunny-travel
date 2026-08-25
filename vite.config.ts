import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local: /  ·  GitHub Pages build: /ersunny-travel/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/ersunny-travel/" : "/",
}));
