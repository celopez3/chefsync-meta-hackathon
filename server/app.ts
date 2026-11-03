import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  DetectResponseSchema,
  GenerateRequestSchema,
  RecipeResponseSchema,
} from "../shared/schemas.js";
import { dedupeIngredients } from "./dedup.js";
import { detectIngredients } from "./sam.js";
import { generatePlans, generatePlansWithMeta } from "./recipes.js";
import { metaApiKey, type MetaEnv } from "./meta.js";

type Env = MetaEnv;

export function createApp(
  getEnv: () => Env = () => (typeof process !== "undefined" ? (process.env as Env) : {}),
) {
  const app = new Hono();
  app.use("/api/*", cors());

  app.get("/api/health", (c) =>
    c.json({ ok: true, demoMode: !metaApiKey(getEnv()), service: "chefsync" }),
  );

  app.post("/api/ingredients/detect", async (c) => {
    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      return c.json({ success: false, error: "Expected multipart/form-data" }, 400);
    }
    const images = form.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
    if (images.length === 0) return c.json({ success: false, error: "Add at least one photo" }, 400);
    if (images.length > 4) return c.json({ success: false, error: "Max 4 photos" }, 400);
    const bad = images.find((f) => !f.type.startsWith("image/"));
    if (bad) return c.json({ success: false, error: `"${bad.name}" is not an image` }, 400);
    const context = form.get("context") === "spice_rack" ? "spice_rack" : "kitchen";

    try {
      const { ingredients, demoMode } = await detectIngredients(images, getEnv(), context);
      const body = DetectResponseSchema.parse({
        success: true,
        sessionId: crypto.randomUUID(),
        demoMode,
        ingredients: dedupeIngredients(ingredients),
      });
      return c.json(body);
    } catch (e) {
      return c.json({ success: false, error: e instanceof Error ? e.message : "Detection failed" }, 502);
    }
  });

  app.post("/api/recipes/generate", async (c) => {
    const parsed = GenerateRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
    }
    // Muse Spark (same Meta key, model muse-spark-1.3) when configured;
    // the local engine is the fallback so the flow always returns plans.
    const metaPlans = await generatePlansWithMeta(parsed.data, getEnv());
    const body = RecipeResponseSchema.parse({
      success: true,
      demoMode: !metaPlans,
      plans: metaPlans ?? generatePlans(parsed.data),
    });
    return c.json(body);
  });

  return app;
}

export const app = createApp();
export type AppType = typeof app;
