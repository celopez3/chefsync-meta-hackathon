import { createApp } from "./app.js";

// Cloudflare Workers entry: `wrangler dev` / deploy with this as main.
// Set MODEL_API_KEY via `wrangler secret put MODEL_API_KEY` to go live.
export default createApp(() => ({}));
