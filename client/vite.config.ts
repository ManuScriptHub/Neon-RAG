import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from "dotenv";

dotenv.config(); // Load .env manually

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      "7802b6d6-addd-4790-a54e-726565f8cd8d.lovableproject.com",
      'myragify.ai', 
      'myneonrag.ai'
    ],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_API_KEY": JSON.stringify(process.env.VITE_API_KEY),
  },
}));

console.log("🔧 Loaded API key:", process.env.VITE_API_KEY);
