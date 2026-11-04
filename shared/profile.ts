export const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free",
  "Halal", "Kosher", "High-protein", "Low-carb",
] as const;

export const ALLERGEN_OPTIONS = [
  "Gluten", "Dairy", "Nuts", "Peanuts", "Egg", "Soy", "Fish", "Shellfish", "Sesame",
] as const;

export const HEAT_LEVELS = ["None", "Mild", "Medium", "Hot", "Extra hot"] as const;

export type ProfilePrefs = {
  dietary: string[];
  allergens: string[];
  avoid: string[];
  servings: number;
  heat: (typeof HEAT_LEVELS)[number];
  /** Learned swaps: missing ingredient name -> chosen substitute. */
  substitutions: Record<string, string>;
};

export const DEFAULT_PROFILE: ProfilePrefs = {
  dietary: [],
  allergens: [],
  avoid: [],
  servings: 2,
  heat: "Medium",
  substitutions: {},
};

/** Dietary-preference strings sent to recipe generation. */
export function profileDietaryStrings(p: ProfilePrefs): string[] {
  return [...p.dietary, ...p.allergens.map((a) => `No ${a.toLowerCase()}`)];
}
