import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Root base for custom domain (www.ersunnytravel.com / Vercel).
// Override with VITE_BASE=/ersunny-travel/ only if you still need GitHub Pages project path.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
});
