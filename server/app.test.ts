import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { dedupeIngredients, normalizeName } from "./dedup.js";
import { generatePlans, parsePlans, withoutPantry } from "./recipes.js";
import { parseDictatedItems } from "../src/lib/dictation.js";
import { ALL_PANTRY_ITEMS, COMMON_PANTRY_ITEMS } from "../shared/pantry.js";
import { findSubstitutions, hasSubstitutions } from "../shared/substitutions.js";
import { nextMessageIndex, SCAN_MESSAGES } from "../src/components/LoadingOverlay.js";
import { mergeSavedRecipes, savedRecipeKey } from "../shared/saved.js";
import { parseIngredientText, parseSamBoxes } from "./sam.js";

describe("normalize + dedupe", () => {
  it("merges spelling variants across photos, keeping highest confidence", () => {
    const out = dedupeIngredients([
      { id: "a", name: "Bell Peppers", confidence: 0.8, sourceImageIndex: 0 },
      { id: "b", name: "bell pepper", confidence: 0.93, sourceImageIndex: 1 },
      { id: "c", name: "Fresh Eggs", confidence: 0.7, sourceImageIndex: 1 },
      { id: "d", name: "egg", confidence: 0.6, sourceImageIndex: 0 },
    ]);
    expect(out.map((i) => i.name)).toEqual(["Bell Pepper", "Egg"]);
    expect(out[0].confidence).toBe(0.93);
  });
  it("normalizes tomatoes and berries", () => {
    expect(normalizeName("Tomatoes")).toBe("tomato");
    expect(normalizeName("berries")).toBe("berry");
  });
});

describe("recipe engine", () => {
  it("uses the selected ingredients and honours intent count", () => {
    const plans = generatePlans({ sessionId: "s", selectedIngredients: ["Chicken Breast", "Rice", "Broccoli"], intent: "quick_snack", dietaryPreferences: [] });
    expect(plans).toHaveLength(2);
    expect(plans[0].usedIngredients).toContain("Chicken Breast");
    expect(plans.every((p) => p.instructions.length >= 3)).toBe(true);
  });
});

describe("Meta response parsing", () => {
  it("parses SAM JSON and fenced Muse plans", () => {
    expect(parseIngredientText('[{"name":"Eggs","confidence":0.9}]', 2)).toEqual([
      { id: "2-0", name: "Eggs", confidence: 0.9, sourceImageIndex: 2 },
    ]);
    expect(parseIngredientText("- Milk\n- Cheese", 0).map((i) => i.name)).toEqual(["Milk", "Cheese"]);
    const plans = parsePlans('```json\n{"plans":[{"title":"Omelette","prepTimeMinutes":10,"difficulty":"Easy","usedIngredients":["Eggs"],"instructions":["Whisk","Fry"]}]}\n```');
    expect(plans?.[0].title).toBe("Omelette");
    expect(parsePlans("no json here")).toBeNull();
    expect(parseSamBoxes("<0f>0<|box;x1=500;y1=250;x2=1000;y2=500;w=2000;h=1000|><|mask;x=0|>" )).toEqual([[0.25, 0.25, 0.5, 0.5]]);
    expect(parseSamBoxes("nothing found")).toEqual([]);
  });
});

describe("pantry + dictation", () => {
  it("pantry items are never reported missing", () => {
    expect(withoutPantry(["olive oil", "Salt", "smoked paprika"], ["Olive Oil", "salt"])).toEqual(["smoked paprika"]);
    const plans = generatePlans({ sessionId: "s", selectedIngredients: ["Eggs", "Spinach"], intent: "single_meal", dietaryPreferences: [], pantryItems: ["Olive Oil", "Salt", "Black Pepper", "Smoked Paprika", "Soy Sauce", "Sesame Oil"] });
    expect(plans.every((p) => !(p.missingPantryStaples ?? []).length)).toBe(true);
  });
  it("splits a dictated list into items", () => {
    expect(parseDictatedItems("olive oil, garlic and smoked paprika.")).toEqual(["Olive Oil", "Garlic", "Smoked Paprika"]);
    expect(parseDictatedItems("")).toEqual([]);
  });
  it("corrects kitchen homophones from speech recognition", () => {
    expect(parseDictatedItems("flower")).toEqual(["Flour"]);
    expect(parseDictatedItems("flower and brown sugar")).toEqual(["Flour", "Brown Sugar"]);
    expect(parseDictatedItems("cauliflower and powered sugar")).toEqual(["Cauliflower", "Powdered Sugar"]);
  });
});

describe("pantry starter set", () => {
  it("most-common items are all real pantry entries", () => {
    expect(COMMON_PANTRY_ITEMS).toContain("Flour");
    expect(COMMON_PANTRY_ITEMS).toContain("Brown Sugar");
    expect(COMMON_PANTRY_ITEMS).toContain("Olive Oil");
    expect(COMMON_PANTRY_ITEMS.every((i) => ALL_PANTRY_ITEMS.includes(i))).toBe(true);
  });
});

describe("substitutions", () => {
  it("finds flour swaps and hides nut options for a nut allergy", () => {
    const plain = findSubstitutions("Flour");
    expect(plain.map((s) => s.name)).toContain("Almond Flour");
    const nutFree = findSubstitutions("Flour", { allergens: ["Nuts"], dietary: [] });
    expect(nutFree.length).toBeGreaterThan(0);
    expect(nutFree.map((s) => s.name)).not.toContain("Almond Flour");
    const gf = findSubstitutions("plain flour", { allergens: ["Gluten"], dietary: ["Gluten-free"] });
    expect(gf[0].suitableFor).toContain("Gluten-free");
    expect(hasSubstitutions("olive oil")).toBe(true);
    expect(findSubstitutions("Unobtainium")).toEqual([]);
  });
  it("profile servings and heat land in generated plans", () => {
    const plans = generatePlans({ sessionId: "s", selectedIngredients: ["Eggs", "Spinach"], intent: "single_meal", servings: 4, heatLevel: "Hot", avoidIngredients: ["Coriander"] });
    const text = plans[0].instructions.join(" ");
    expect(text).toMatch(/Serves 4/);
    expect(text).toMatch(/Heat level hot/);
    expect(text).toMatch(/Coriander/);
  });
});

describe("scan overlay messages", () => {
  it("rotates to a different message every time", () => {
    expect(SCAN_MESSAGES.length).toBeGreaterThan(5);
    for (let cur = 0; cur < SCAN_MESSAGES.length; cur++) {
      for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
        const next = nextMessageIndex(cur, SCAN_MESSAGES.length, roll);
        expect(next).not.toBe(cur);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(SCAN_MESSAGES.length);
      }
    }
    expect(nextMessageIndex(0, 1, 0.5)).toBe(0);
  });
});

describe("saved-recipe merge", () => {
  const plan = { title: "Egg Skillet", prepTimeMinutes: 20, difficulty: "Easy", usedIngredients: ["Eggs", "Spinach"], missingPantryStaples: [], instructions: ["Whisk", "Fry"] };
  it("unions cloud and local without duplicating the same recipe", () => {
    const cloud = [{ id: "cloud-1", savedAt: "2026-01-01", plan }];
    const local = [
      { id: "local-1", savedAt: "2026-01-02", plan: { ...plan, title: "egg skillet " } },
      { id: "local-2", savedAt: "2026-01-02", plan: { ...plan, title: "Other Dish" } },
    ];
    const { merged, toUpload } = mergeSavedRecipes(cloud, local);
    expect(merged.map((m) => m.id)).toEqual(["cloud-1", "local-2"]);
    expect(toUpload.map((m) => m.id)).toEqual(["local-2"]);
    expect(savedRecipeKey(plan)).toBe(savedRecipeKey({ ...plan, usedIngredients: ["Spinach", "Eggs"] }));
    expect(savedRecipeKey(plan)).not.toBe(savedRecipeKey({ ...plan, instructions: ["Bake"] }));
  });
});

describe("API", () => {
  const app = createApp(() => ({}));
  it("health is ok and reports demo mode", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect((await res.json()).demoMode).toBe(true);
  });
  it("detect rejects an empty upload", async () => {
    const res = await app.request("/api/ingredients/detect", { method: "POST", body: new FormData() });
    expect(res.status).toBe(400);
  });
  it("detect returns a deduped unified list from 2 photos", async () => {
    const form = new FormData();
    form.append("images", new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" }));
    form.append("images", new File([new Uint8Array([4, 5, 6])], "b.jpg", { type: "image/jpeg" }));
    const res = await app.request("/api/ingredients/detect", { method: "POST", body: form });
    expect(res.status).toBe(200);
    const body = await res.json();
    const names = body.ingredients.map((i: { name: string }) => i.name);
    expect(new Set(names).size).toBe(names.length);
    expect(body.demoMode).toBe(true);
  });
  it("spice-rack scan returns spices in demo mode", async () => {
    const form = new FormData();
    form.append("context", "spice_rack");
    form.append("images", new File([new Uint8Array([9, 8, 7])], "rack.jpg", { type: "image/jpeg" }));
    const res = await app.request("/api/ingredients/detect", { method: "POST", body: form });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ingredients.length).toBeGreaterThan(0);
    expect(body.ingredients.map((i: { name: string }) => i.name)).toContain("Cinnamon");
  });
  it("generate rejects no ingredients and accepts a valid request", async () => {
    const bad = await app.request("/api/recipes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "s", selectedIngredients: [], intent: "single_meal" }) });
    expect(bad.status).toBe(400);
    const ok = await app.request("/api/recipes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "s", selectedIngredients: ["Eggs", "Spinach"], intent: "batch_prep" }) });
    expect(ok.status).toBe(200);
    expect((await ok.json()).plans.length).toBe(3);
  });
});
