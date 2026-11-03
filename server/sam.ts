import type { DetectContext, Ingredient } from "../shared/schemas.js";
import { extractJson, metaClient, responseText, MUSE_MODEL, SAM_MODEL, type MetaEnv } from "./meta.js";

// Demo pools rotate by photo so multiple angles yield a varied, mergeable set
// (with deliberate duplicates like "Bell Peppers" to exercise dedup).
const DEMO_POOLS: string[][] = [
  ["Eggs", "Bell Peppers", "Spinach", "Cheddar Cheese", "Red Onion"],
  ["Chicken Breast", "Bell Pepper", "Garlic", "Rice", "Broccoli"],
  ["Tomatoes", "Pasta", "Garlic", "Basil", "Parmesan"],
  ["Avocado", "Lime", "Red Onion", "Cilantro", "Tortillas"],
];

const DEMO_SPICE_POOL = ["Paprika", "Cumin", "Cinnamon", "Garlic Powder", "Turmeric", "Oregano", "Chili Powder", "Black Pepper"];

// Used only if Muse cannot enumerate a photo: probe SAM with staples.
const FALLBACK_CONCEPTS = ["egg", "tomato", "onion", "cheese", "broccoli", "carrot", "bell pepper", "chicken", "bread", "apple", "banana", "milk"];
const MAX_CONCEPTS_PER_IMAGE = 10;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

async function detectOneDemo(image: File, index: number, context: DetectContext = "kitchen"): Promise<Ingredient[]> {
  const bytes = new Uint8Array(await image.arrayBuffer());
  let h = 0;
  for (const x of bytes.slice(0, 512)) h = (h * 31 + x) >>> 0;
  if (context === "spice_rack") {
    const offset = h % 3;
    return DEMO_SPICE_POOL.slice(offset, offset + 5).map((name, i) => ({
      id: `${index}-${i}`,
      name,
      confidence: Math.round((0.78 + ((hashString(name) + i * 5) % 18) / 100) * 100) / 100,
      sourceImageIndex: index,
    }));
  }
  const pool = DEMO_POOLS[index % DEMO_POOLS.length];
  const offset = h % 2;
  return pool.slice(offset, offset + 4).map((name, i) => ({
    id: `${index}-${i}`,
    name,
    confidence: Math.round((0.72 + ((hashString(name) + i * 7) % 24) / 100) * 100) / 100,
    sourceImageIndex: index,
  }));
}

/** Parse a name list from model text: JSON array preferred, plain list as fallback. */
export function parseIngredientText(text: string, sourceImageIndex: number): Ingredient[] {
  const json = extractJson(text);
  const rows: unknown[] = Array.isArray(json)
    ? json
    : Array.isArray((json as { ingredients?: unknown[] })?.ingredients)
      ? (json as { ingredients: unknown[] }).ingredients
      : [];
  if (rows.length) {
    return rows.flatMap((row, i) => {
      if (typeof row === "string") return [{ id: `${sourceImageIndex}-${i}`, name: row, confidence: 0.8, sourceImageIndex }];
      const r = row as { name?: string; label?: string; confidence?: number };
      const name = r.name ?? r.label;
      return name ? [{ id: `${sourceImageIndex}-${i}`, name, confidence: r.confidence ?? 0.8, sourceImageIndex }] : [];
    });
  }
  return text.split(/[\n,;]+/)
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((s) => s.length > 1 && s.length < 40 && !/^(here|the following|ingredients:)/i.test(s))
    .slice(0, 20)
    .map((name, i) => ({ id: `${sourceImageIndex}-${i}`, name, confidence: 0.8, sourceImageIndex }));
}

/**
 * SAM 3.1 is a segmentation model, not a lister: given a concept ("broccoli")
 * it returns `<|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..|><|mask;...|>` per
 * instance found. Parse those boxes, normalized to 0..1.
 */
export function parseSamBoxes(text: string): number[][] {
  const boxes: number[][] = [];
  const re = /box;x1=(\d+(?:\.\d+)?);y1=(\d+(?:\.\d+)?);x2=(\d+(?:\.\d+)?);y2=(\d+(?:\.\d+)?);w=(\d+(?:\.\d+)?);h=(\d+(?:\.\d+)?)/g;
  for (let m: RegExpExecArray | null; (m = re.exec(text)); ) {
    const [x1, y1, x2, y2, w, h] = m.slice(1).map(Number);
    if (w > 0 && h > 0) boxes.push([x1 / w, y1 / h, x2 / w, y2 / h].map((v) => Math.round(v * 1000) / 1000));
  }
  return boxes;
}

async function toDataUrl(image: File): Promise<string> {
  const bytes = new Uint8Array(await image.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return `data:${image.type || "image/jpeg"};base64,${btoa(binary)}`;
}

/** Step 1: Muse Spark looks at the photo and names the ingredients. */
async function enumerateIngredients(image: File, index: number, env: MetaEnv, context: DetectContext = "kitchen"): Promise<string[]> {
  const client = metaClient(env)!;
  const prompt = context === "spice_rack"
    ? "This is a spice rack, spice drawer or pantry shelf. Read every spice, herb and seasoning jar or packet label you can. Return only a JSON array like [{\"name\":\"Smoked Paprika\"}] with no other text."
    : "List every distinct edible food ingredient visible in this image (or readable on this receipt). Return only a JSON array like [{\"name\":\"Bell Pepper\"}] with no other text.";
  const res = await client.responses.create({
    model: MUSE_MODEL,
    input: [
      { type: "message", role: "user", content: [
        { type: "input_text", text: prompt },
        { type: "input_image", image_url: await toDataUrl(image) },
      ]},
    ],
  } as never);
  return parseIngredientText(responseText(res), index).map((i) => i.name);
}

/** Step 2: SAM 3.1 verifies/localizes one named concept in the photo. */
async function samLocate(image: File, concept: string, env: MetaEnv): Promise<number[] | null> {
  const client = metaClient(env)!;
  const res = await client.responses.create({
    model: SAM_MODEL,
    input: [
      { type: "message", role: "user", content: [
        { type: "input_text", text: concept.toLowerCase() },
        { type: "input_image", image_url: await toDataUrl(image) },
      ]},
    ],
  } as never);
  return parseSamBoxes(responseText(res))[0] ?? null;
}

async function detectOneReal(image: File, index: number, env: MetaEnv, context: DetectContext = "kitchen"): Promise<Ingredient[]> {
  let names = await enumerateIngredients(image, index, env, context).catch(() => [] as string[]);
  if (!names.length) names = FALLBACK_CONCEPTS;
  const located = await Promise.all(
    names.slice(0, MAX_CONCEPTS_PER_IMAGE).map(async (name, i) => {
      const box = await samLocate(image, name, env).catch(() => null);
      return {
        id: `${index}-${i}`,
        name,
        // SAM-confirmed items rank above Muse-only sightings.
        confidence: box ? 0.92 : 0.65,
        sourceImageIndex: index,
        ...(box ? { boundingBox: box } : {}),
      } as Ingredient;
    }),
  );
  // In fallback mode a concept with no box was not actually found; drop it.
  return names === FALLBACK_CONCEPTS ? located.filter((i) => i.boundingBox) : located;
}

export async function detectIngredients(
  images: File[],
  env: MetaEnv,
  context: DetectContext = "kitchen",
): Promise<{ ingredients: Ingredient[]; demoMode: boolean }> {
  const demoMode = !metaClient(env);
  // All photos processed in parallel; within a photo, SAM concept checks are parallel too.
  const perImage = await Promise.all(
    images.map((img, i) => (demoMode ? detectOneDemo(img, i, context) : detectOneReal(img, i, env, context))),
  );
  return { ingredients: perImage.flat(), demoMode };
}
