# ChefSync AI

Photos in. Dinner sorted. Snap up to 4 photos of your fridge, counter or a
receipt, check off the ingredients you want to use, pick an intent
(single meal / batch prep / quick snack), and get structured recipe plans.

Built for the Meta Global AI Developer Hackathon (Indie Developer — Build for
Your World): SAM 3.1 for ingredient detection, Muse Spark for recipe
generation, Hono (TypeScript, Zod-validated, RPC-typed) on Cloudflare Workers,
React + Vite + Tailwind on the front end.

## Run it

```bash
npm install
npm run dev        # API on :8787 + web on http://127.0.0.1:5173
```

Open http://127.0.0.1:5173 in a browser.

On a phone on the same Wi-Fi, open `http://<this-pc-ip>:8787` after
`npm run build && npm start` (the server binds the LAN; set
`HOST=127.0.0.1` to lock it down). "Take a photo" opens the rear
camera directly via `capture="environment"`, and adding a photo runs
detection automatically — there is no separate Scan step.
A future Capacitor shell needs no rework — see
[docs/capacitor.md](docs/capacitor.md).

Production-style (API serves the built site on one port):

```bash
npm run build
npm start          # http://127.0.0.1:8787
```

## Demo mode

No key needed to try the full flow. With one, both models use the same Meta
key and base URL (`https://api.meta.ai/v1`, Responses API) — only the model
name changes: `sam-3.1` for detection, `muse-spark-1.3` for recipes.
Put `MODEL_API_KEY=...` in a `.env` file in this folder (gitignored,
see [.dev.vars.example](.dev.vars.example)) and restart the server.
Without a key, the API returns deterministic demo detections and locally
generated recipes, and the UI shows a "Demo mode" banner so this is never
mistaken for live model output. For Cloudflare, use
`wrangler secret put MODEL_API_KEY` instead of `.env`.

## Accounts, pantry & voice

- **Saved recipes & pantry sync (Supabase):** create a free project at
  supabase.com, run [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql)
  in its SQL Editor, then set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  in `.env` (see [.env.example](.env.example)) and restart. Sign-in is an
  email magic link. Without keys, pantry and saved recipes fall back to
  `localStorage` on that device — nothing breaks.
- **My pantry:** tick general goods (flour, sugars, vanilla, oils, spices),
  add your own, dictate them, or scan a spice-rack photo (same detection
  endpoint with `context=spice_rack`). Pantry items are sent with recipe
  generation, so they never appear as "missing".
- **Dictation:** mic buttons (Chrome/Edge `SpeechRecognition`) add items by
  voice — in the checklist, the pantry, and on each recipe's missing-items
  list ("say what you have" ticks them off and saves them to your pantry).
  Unsupported browsers keep the text inputs.

## API

| Endpoint | What |
|---|---|
| `POST /api/ingredients/detect` | multipart `images` (max 4), optional `context=spice_rack` → deduped unified ingredient list ([schema](shared/schemas.ts)) |
| `POST /api/recipes/generate` | `{ sessionId, selectedIngredients, intent, dietaryPreferences?, pantryItems? }` → recipe plans |
| `GET /api/health` | liveness + demo-mode flag |

Schemas live in [shared/schemas.ts](shared/schemas.ts) and validate both
server responses and client parsing. Detection runs all photos in parallel
(`Promise.all`) and merges duplicates across photos in
[server/dedup.ts](server/dedup.ts). How detection works: SAM 3.1 is a
segmentation model — it localizes a *named* concept and returns bounding
boxes, it does not list ingredients. So Muse Spark first names the
ingredients in each photo, then SAM 3.1 verifies/localizes each one
(SAM-confirmed items get a bounding box and higher confidence; see
[server/sam.ts](server/sam.ts)). Photos are resized/compressed in the
browser via Canvas before upload ([src/lib/compress.ts](src/lib/compress.ts)).

## Test

```bash
npm test
npm run typecheck
```

## Deploy (Cloudflare)

`npm run build && npx wrangler deploy` using [wrangler.toml](wrangler.toml) /
[server/worker.ts](server/worker.ts). The `[assets]` block serves `dist/`
from the same Worker (SPA fallback to `index.html`), while `/api/*` goes
to Hono — no separate Pages/static host needed. Set the model key with
`wrangler secret put MODEL_API_KEY`.
