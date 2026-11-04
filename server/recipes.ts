import { PlanSchema, type GenerateRequest, type Plan } from "../shared/schemas.js";
import { normalizeName } from "./dedup.js";
import { extractJson, metaClient, responseText, MUSE_MODEL, type MetaEnv } from "./meta.js";

const PROTEINS = new Set(["egg", "chicken breast", "chicken", "beef", "tofu", "salmon", "shrimp", "pork"]);
const GRAINS = new Set(["rice", "pasta", "tortilla", "bread", "quinoa", "noodle"]);
const VEG = new Set(["spinach", "broccoli", "bell pepper", "red onion", "tomato", "garlic", "avocado", "basil", "cilantro", "lime"]);

function pick(selected: string[], set: Set<string>) {
  return selected.filter((s) => set.has(normalizeName(s)));
}

/** Drop staples the user already owns (their persistent pantry) from a list. */
export function withoutPantry(items: string[], pantryItems: string[] = []): string[] {
  if (!pantryItems.length) return items;
  const owned = new Set(pantryItems.map(normalizeName));
  return items.filter((i) => !owned.has(normalizeName(i)));
}

export function generatePlans(req: GenerateRequest): Plan[] {
  const sel = req.selectedIngredients;
  const proteins = pick(sel, PROTEINS);
  const grains = pick(sel, GRAINS);
  const veg = pick(sel, VEG);
  const protein = proteins[0] ?? "Egg";
  const grain = grains[0];
  const vegList = veg.length ? veg : sel.slice(0, 3);
  const main = [protein, ...vegList.slice(0, 2)].join(" & ");
  const dietaryList = req.dietaryPreferences ?? [];
  const dietary = dietaryList.length ? ` (${dietaryList.join(", ")})` : "";

  const base: Plan[] = [
    {
      title: grain ? `${main} ${grain} Skillet${dietary}` : `${main} Skillet${dietary}`,
      prepTimeMinutes: req.intent === "quick_snack" ? 10 : 25,
      difficulty: "Easy",
      usedIngredients: sel.slice(0, 6),
      missingPantryStaples: ["olive oil", "salt", "black pepper"],
      instructions: [
        `Prep: wash and chop ${vegList.join(", ") || sel[0]}; pat ${protein.toLowerCase()} dry and season.`,
        grain ? `Start the ${grain.toLowerCase()} so it finishes with the skillet.` : "Heat a large skillet over medium heat with olive oil.",
        `Sear ${protein.toLowerCase()} 4–5 min per side until cooked through; set aside to rest.`,
        `In the same pan, sauté ${vegList.join(", ") || "the vegetables"} 5–7 min until tender-crisp.`,
        grain ? `Fold in the ${grain.toLowerCase()}, slice the ${protein.toLowerCase()} over the top, and serve.` : "Return protein to the pan, toss 1 minute, and serve hot.",
      ],
    },
    {
      title: `${protein} & ${vegList[0] ?? sel[0]} Tray Bake`,
      prepTimeMinutes: req.intent === "batch_prep" ? 45 : 30,
      difficulty: "Easy",
      usedIngredients: sel.slice(0, 5),
      missingPantryStaples: ["olive oil", "smoked paprika"],
      instructions: [
        "Heat oven to 200°C / 400°F and line a tray.",
        `Toss ${sel.slice(0, 5).join(", ").toLowerCase()} with oil, salt and paprika.`,
        req.intent === "batch_prep"
          ? "Roast 30–35 min in a double batch; cool and portion into 4 containers."
          : "Roast 22–28 min until edges caramelise.",
        "Rest 5 minutes, then serve or refrigerate up to 4 days.",
      ],
    },
    {
      title: `Quick ${protein} Stir-Fry Bowls`,
      prepTimeMinutes: 15,
      difficulty: "Medium",
      usedIngredients: sel.slice(0, 6),
      missingPantryStaples: ["soy sauce", "sesame oil"],
      instructions: [
        `Slice ${protein.toLowerCase()} thin so it cooks in minutes.`,
        "Sear in a hot wok 3–4 min; remove.",
        `Stir-fry ${vegList.join(", ") || "vegetables"} 3 min, keeping some crunch.`,
        "Return protein, add soy sauce and sesame oil, toss and serve.",
      ],
    },
  ];

  const profileNotes: string[] = [];
  if (req.servings) profileNotes.push(`Serves ${req.servings}: scale quantities to suit.`);
  if (req.heatLevel && req.heatLevel !== "Medium") {
    profileNotes.push(req.heatLevel === "None"
      ? "No heat: skip chili and go easy on the black pepper."
      : `Heat level ${req.heatLevel.toLowerCase()}: adjust chili flakes and pepper to taste.`);
  }
  if ((req.avoidIngredients ?? []).length) {
    profileNotes.push(`Strictly avoid: ${(req.avoidIngredients ?? []).join(", ")}.`);
  }
  const filtered = base.map((p) => ({
    ...p,
    missingPantryStaples: withoutPantry(p.missingPantryStaples ?? [], req.pantryItems),
    instructions: [...p.instructions, ...profileNotes],
  }));
  if (req.intent === "quick_snack") return [filtered[2], filtered[0]];
  if (req.intent === "batch_prep") return [filtered[1], filtered[0], filtered[2]];
  return filtered;
}

export function parsePlans(text: string): Plan[] | null {
  const json = extractJson(text);
  const rows = Array.isArray(json) ? json : (json as { plans?: unknown[] })?.plans;
  if (!Array.isArray(rows)) return null;
  const plans = rows.flatMap((r) => {
    const p = PlanSchema.safeParse(r);
    return p.success ? [p.data] : [];
  });
  return plans.length ? plans : null;
}

/** Muse Spark generation when a key is set; null means "use the local engine". */
export async function generatePlansWithMeta(req: GenerateRequest, env: MetaEnv): Promise<Plan[] | null> {
  const client = metaClient(env);
  if (!client) return null;
  const intentLabel = { single_meal: "a single meal for tonight", batch_prep: "batch meal prep for the week (with storage guidance)", quick_snack: "a quick snack ready in 15 minutes or less" }[req.intent];
  try {
    const res = await client.responses.create({
      model: MUSE_MODEL,
      input:
        `You are ChefSync. Create 3 recipe plans for ${intentLabel} using these ingredients: ${req.selectedIngredients.join(", ")}.` +
        ((req.dietaryPreferences ?? []).length ? ` Dietary preferences: ${(req.dietaryPreferences ?? []).join(", ")}.` : "") +
        ((req.pantryItems ?? []).length ? ` The cook already owns these pantry staples, so never list them in missingPantryStaples: ${(req.pantryItems ?? []).join(", ")}.` : "") +
        ((req.avoidIngredients ?? []).length ? ` Never use or suggest these ingredients (the cook avoids them): ${(req.avoidIngredients ?? []).join(", ")}.` : "") +
        (req.servings ? ` Write for ${req.servings} servings.` : "") +
        (req.heatLevel ? ` Heat level: ${req.heatLevel}.` : "") +
        ` Return only JSON: {"plans":[{"title":string,"prepTimeMinutes":number,"difficulty":string,"usedIngredients":[string],"missingPantryStaples":[string],"instructions":[string]}]}. No markdown, no extra text.`,
    });
    const plans = parsePlans(responseText(res));
    return plans?.map((p) => ({ ...p, missingPantryStaples: withoutPantry(p.missingPantryStaples ?? [], req.pantryItems) })) ?? null;
  } catch {
    return null;
  }
}
