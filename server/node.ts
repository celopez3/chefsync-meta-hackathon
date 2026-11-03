import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./app.js";

// Load .env (MODEL_API_KEY) for local runs; real env vars take precedence.
try { (process as { loadEnvFile?: (p: string) => void }).loadEnvFile?.(".env"); } catch { /* no .env */ }

const app = createApp();
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

const port = Number(process.env.PORT ?? 8787);
// LAN binding so a phone on the same Wi-Fi can demo against this machine
// (open http://<this-pc-ip>:8787). Set HOST=127.0.0.1 to lock it down.
const hostname = process.env.HOST ?? "0.0.0.0";
serve({ fetch: app.fetch, port, hostname }, () => {
  console.log(`ChefSync API on http://${hostname}:${port} (demoMode=${!(process.env.MODEL_API_KEY || process.env.SAM_API_KEY || process.env.MUSE_API_KEY)})`);
});
