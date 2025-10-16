// vite.config.ts dosyanızın son hali bu OLMALIDIR:
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

export default defineConfig(({ mode }) => ({
  plugins: [
    viteSourceLocator({
      prefix: "mgx",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // 🎯 Düzeltilmiş Base URL: Netlify ve Vercel için '/' olmalıdır.
  base: '/', 
}));