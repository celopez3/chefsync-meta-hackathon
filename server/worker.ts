import { createApp } from "./app.js";
import type { MetaEnv } from "./meta.js";

type WorkerEnv = MetaEnv & {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
};

/**
 * Cloudflare Workers entry.
 * - /api/* goes to the Hono app, with the Worker's real env (secrets
 *   such as MODEL_API_KEY, set via `wrangler secret put`).
 * - Everything else serves the built React app from dist/ via the
 *   ASSETS binding (see wrangler.toml), with SPA fallback to index.html.
 */
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return createApp(() => env).fetch(request);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
};
