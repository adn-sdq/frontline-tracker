import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Base path for GitHub Pages project site: https://<user>.github.io/frontline-tracker/
// Override with VITE_BASE (e.g. "/" for local or a custom domain).
const base = process.env.VITE_BASE ?? "/frontline-tracker/"

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
