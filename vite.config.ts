import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative asset paths so the same dist/ also loads from
  // capacitor://localhost inside a future Capacitor shell.
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    // LAN binding: open http://<this-pc-ip>:5173 on a phone on same Wi-Fi.
    host: true,
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8787" },
  },
});
