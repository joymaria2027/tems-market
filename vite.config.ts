import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react")) return "vendor";
          if (id.includes("node_modules/react-dom")) return "vendor";
          if (id.includes("node_modules/react-router")) return "vendor";
          if (id.includes("node_modules/lucide-react")) return "ui";
          if (id.includes("node_modules/@radix-ui")) return "ui";
          if (id.includes("node_modules/embla-carousel")) return "ui";
          if (id.includes("node_modules/cmdk")) return "ui";
          if (id.includes("node_modules/input-otp")) return "ui";
          if (id.includes("node_modules/sonner")) return "ui";
          if (id.includes("node_modules/react-day-picker")) return "ui";
          if (id.includes("node_modules/react-hook-form")) return "ui";
          if (id.includes("node_modules/vaul")) return "ui";
          if (id.includes("node_modules/@tanstack/react-table")) return "ui";
          if (id.includes("node_modules/recharts")) return "charts";
          if (id.includes("node_modules/d3-")) return "charts";
        },
      },
    },
  },
}));
