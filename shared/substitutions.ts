/**
 * Curated substitution database. Instant and offline, so it works in
 * demo mode where an LLM call would return nothing. Keys are normalised
 * ingredient names (see findSubstitutions); aliases map common label
 * variants onto a key. Ratios are "per 1 unit of the original".
 */
export type Substitute = {
  name: string;
  ratio: string;
  note: string;
  /** Dietary patterns this substitute is suitable for. */
  suitableFor: string[];
  /** Allergens present in this substitute. */
  contains: string[];
};

const GF = "Gluten-free";
const VG = "Vegan";
const VEG = "Vegetarian";
const DF = "Dairy-free";
const NF = "Nut-free";

export const SUBSTITUTIONS: Record<string, Substitute[]> = {
  "flour": [
    { name: "Gluten-Free Flour Blend", ratio: "1:1", note: "Best all-round swap; add ¼ tsp xanthan gum per cup if your blend lacks it.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Almond Flour", ratio: "1:1", note: "Denser, moister bakes; add an extra egg or binder and expect a flatter rise.", suitableFor: [GF, VEG, DF], contains: ["Nuts"] },
    { name: "Oat Flour", ratio: "1:1", note: "Use certified gluten-free oats if coeliac; slightly chewier texture.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Rice Flour", ratio: "¾:1", note: "A little goes further; best blended half-and-half with a starch for cakes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Cornstarch", ratio: "½:1", note: "For thickening and light coatings only, not for bread or cake structure.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "white sugar": [
    { name: "Brown Sugar", ratio: "1:1", note: "Same sweetness, hint of caramel; pack it down when measuring.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Honey", ratio: "¾:1", note: "Reduce other liquid by about 3 tbsp per cup and lower the oven slightly.", suitableFor: [GF, VEG, DF, NF], contains: [] },
    { name: "Maple Syrup", ratio: "¾:1", note: "Reduce other liquid a little; lovely in dressings and bakes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Coconut Sugar", ratio: "1:1", note: "Swaps cleanly including colour-sensitive bakes turning slightly darker.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "brown sugar": [
    { name: "White Sugar + Molasses", ratio: "1 cup + 1 tbsp molasses : 1 cup", note: "Stir together; closest match in flavour and moisture.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "White Sugar", ratio: "1:1", note: "Slightly less moist and less caramel depth.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Coconut Sugar", ratio: "1:1", note: "Similar colour and depth; a touch less sweet.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "powdered sugar": [
    { name: "White Sugar, Blended Fine", ratio: "1 cup + 1 tsp cornstarch : 1 cup", note: "Blitz until powdery; fine for icing, slightly grainier in glazes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "butter": [
    { name: "Olive Oil", ratio: "¾:1", note: "For sautéing and moist cakes; not for laminated pastry.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Coconut Oil", ratio: "1:1", note: "Use refined for a neutral taste; solid swap in baking.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Ghee", ratio: "1:1", note: "Same cooking behaviour, richer flavour; trace milk solids only.", suitableFor: [GF, VEG, NF], contains: ["Dairy"] },
  ],
  "milk": [
    { name: "Oat Milk", ratio: "1:1", note: "Most neutral in cooking and sauces.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Soy Milk", ratio: "1:1", note: "Best protein match for baking.", suitableFor: [GF, VG, VEG, DF, NF], contains: ["Soy"] },
    { name: "Almond Milk", ratio: "1:1", note: "Thinner; fine for smoothies and light sauces.", suitableFor: [GF, VG, VEG, DF], contains: ["Nuts"] },
    { name: "Water + 1 tsp Oil", ratio: "1:1", note: "Emergency swap for savoury cooking only.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "egg": [
    { name: "Flax Egg", ratio: "1 tbsp ground flax + 3 tbsp water : 1 egg", note: "Rest 10 min to gel; binding, not leavening.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Aquafaba", ratio: "3 tbsp : 1 egg", note: "Whips like egg white; good for meringues and mayo.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Mashed Banana", ratio: "¼ cup : 1 egg", note: "Bakes only; adds sweetness and density.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "olive oil": [
    { name: "Vegetable Oil", ratio: "1:1", note: "Neutral; you lose the fruity note in dressings.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Avocado Oil", ratio: "1:1", note: "Higher smoke point; great for searing.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Butter", ratio: "1:1", note: "Lower smoke point; watch it over high heat.", suitableFor: [GF, VEG, NF], contains: ["Dairy"] },
    { name: "Coconut Oil", ratio: "1:1", note: "Melt first for dressings; refined is neutral.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "vegetable oil": [
    { name: "Olive Oil", ratio: "1:1", note: "Slightly stronger flavour in delicate bakes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Avocado Oil", ratio: "1:1", note: "Neutral and heat-stable.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Melted Butter", ratio: "1:1", note: "For baking; adds dairy richness.", suitableFor: [GF, VEG, NF], contains: ["Dairy"] },
  ],
  "sesame oil": [
    { name: "Olive Oil + Sesame Seeds", ratio: "1:1 + a pinch", note: "Toast the seeds; closest flavour without the oil.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Peanut Oil", ratio: "1:1", note: "Nutty and heat-stable; check nut allergies.", suitableFor: [GF, VG, VEG, DF], contains: ["Nuts"] },
  ],
  "soy sauce": [
    { name: "Tamari", ratio: "1:1", note: "The standard gluten-free swap; near-identical taste.", suitableFor: [GF, VG, VEG, DF, NF], contains: ["Soy"] },
    { name: "Coconut Aminos", ratio: "1:1", note: "Sweeter and less salty; add a pinch of salt.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Fish Sauce + Salt", ratio: "¾:1", note: "Savoury depth; not vegetarian.", suitableFor: [GF, DF, NF], contains: [] },
  ],
  "honey": [
    { name: "Maple Syrup", ratio: "1:1", note: "The clean vegan swap in almost everything.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Golden Syrup", ratio: "1:1", note: "Similar body; slightly more caramel.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Brown Sugar + Water", ratio: "1¼ cup + ¼ cup : 1 cup", note: "Simmer to a syrup for dressings and glazes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "rice": [
    { name: "Quinoa", ratio: "1:1", note: "Rinse first; cooks a few minutes faster.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Cauliflower Rice", ratio: "1:1", note: "Add at the end so it stays firm; much lighter.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Couscous", ratio: "1:1", note: "Faster cooking; contains gluten.", suitableFor: [VG, VEG, DF, NF], contains: ["Gluten"] },
  ],
  "pasta": [
    { name: "Gluten-Free Pasta", ratio: "1:1", note: "Salt the water well and do not overcook; it softens fast.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Rice Noodles", ratio: "1:1", note: "Soak or brief boil; best in Asian-style dishes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Courgetti (Zucchini Noodles)", ratio: "2:1", note: "Add raw at the end so they do not go watery.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "breadcrumbs": [
    { name: "Gluten-Free Breadcrumbs", ratio: "1:1", note: "Straight swap for coatings and toppings.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Crushed Cornflakes", ratio: "1:1", note: "Extra crunch; check the brand is gluten-free if needed.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Ground Almonds", ratio: "¾:1", note: "Rich coating; browns faster, watch the heat.", suitableFor: [GF, VG, VEG, DF], contains: ["Nuts"] },
    { name: "Rolled Oats, Blended", ratio: "1:1", note: "Good binder in meatballs and veggie burgers.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "cornstarch": [
    { name: "Arrowroot", ratio: "1:1", note: "Clearer sauces; add at the very end.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Tapioca Starch", ratio: "2:1", note: "Glossy and stretchy; great in gravies.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Flour", ratio: "2:1", note: "Cloudier sauce and contains gluten; cook a minute longer.", suitableFor: [VG, VEG, DF, NF], contains: ["Gluten"] },
  ],
  "baking powder": [
    { name: "Baking Soda + Cream of Tartar", ratio: "¼ tsp + ½ tsp : 1 tsp", note: "Mix fresh; use immediately.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "vanilla extract": [
    { name: "Vanilla Paste", ratio: "1:1", note: "Same flavour, visible seeds.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Maple Syrup", ratio: "1:1", note: "Different but warm; reduce sugar slightly elsewhere.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Almond Extract", ratio: "½:1", note: "Much stronger; a little goes a long way.", suitableFor: [GF, VG, VEG, DF], contains: ["Nuts"] },
  ],
  "salt": [
    { name: "Sea Salt Flakes", ratio: "1:1 by weight", note: "Flakes measure lighter by spoon; season to taste.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Soy Sauce", ratio: "1 tsp : ½ tsp salt", note: "Adds umami as well as salt; reduce other liquid slightly.", suitableFor: [VG, VEG, DF, NF], contains: ["Gluten", "Soy"] },
  ],
  "black pepper": [
    { name: "White Pepper", ratio: "1:1", note: "Earthier heat; invisible in pale sauces.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Chili Flakes", ratio: "¼:1", note: "Heat without the pepper flavour; go gently.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "smoked paprika": [
    { name: "Paprika + Pinch of Cumin", ratio: "1:1", note: "Loses the smoke; cumin restores depth.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Chipotle Powder", ratio: "½:1", note: "Smoky but much hotter; start small.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "paprika": [
    { name: "Smoked Paprika", ratio: "1:1", note: "Adds smoke; lovely in savoury dishes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Chili Powder", ratio: "¾:1", note: "Hotter and more complex; adjust to taste.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "garlic powder": [
    { name: "Fresh Garlic", ratio: "1 clove : ¼ tsp", note: "Add earlier in cooking than the powder would go in.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Onion Powder", ratio: "1:1", note: "Sweeter, less punchy; works in rubs.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "cinnamon": [
    { name: "Mixed Spice", ratio: "1:1", note: "Warmer and more complex; great in baking.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Nutmeg", ratio: "½:1", note: "Stronger; best in small amounts.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
  "cream": [
    { name: "Coconut Cream", ratio: "1:1", note: "Rich and stable in curries and soups; faint coconut note.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Greek Yogurt", ratio: "1:1", note: "Stir in off the heat so it does not split.", suitableFor: [GF, VEG, NF], contains: ["Dairy"] },
    { name: "Milk + Cornstarch", ratio: "1 cup + 1 tbsp : 1 cup", note: "Simmer to thicken; for sauces, not whipping.", suitableFor: [GF, VEG, NF], contains: ["Dairy"] },
  ],
  "stock cubes": [
    { name: "Miso Paste + Water", ratio: "1 tsp per 250ml", note: "Deep umami; add at the end.", suitableFor: [GF, VG, VEG, DF, NF], contains: ["Soy"] },
    { name: "Soy Sauce + Water", ratio: "1 tsp per 250ml", note: "Quick savoury base; mind the salt.", suitableFor: [VG, VEG, DF, NF], contains: ["Gluten", "Soy"] },
  ],
  "vinegar": [
    { name: "Lemon Juice", ratio: "1:1", note: "Brighter and fresher; best in dressings.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
    { name: "Lime Juice", ratio: "1:1", note: "Sharper; great in Asian and Mexican dishes.", suitableFor: [GF, VG, VEG, DF, NF], contains: [] },
  ],
};

const ALIASES: Record<string, string> = {
  "all-purpose flour": "flour",
  "all purpose flour": "flour",
  "plain flour": "flour",
  "sugar": "white sugar",
  "granulated sugar": "white sugar",
  "caster sugar": "white sugar",
  "icing sugar": "powdered sugar",
  "confectioners sugar": "powdered sugar",
  "eggs": "egg",
  "double cream": "cream",
  "heavy cream": "cream",
  "stock cube": "stock cubes",
  "bouillon": "stock cubes",
};

function keyOf(name: string): string {
  let n = name.toLowerCase().trim().replace(/\s+/g, " ");
  if (ALIASES[n]) return ALIASES[n];
  if (n.endsWith("oes")) n = n.slice(0, -2);
  else if (n.endsWith("ies") && n.length > 3) n = n.slice(0, -3) + "y";
  else if (n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("us")) n = n.slice(0, -1);
  return ALIASES[n] ?? n;
}

/**
 * Substitutes for an ingredient, safest first for this cook: anything
 * containing one of their allergens is removed, and options suitable
 * for their dietary patterns float to the top.
 */
export function findSubstitutions(
  ingredient: string,
  profile?: { dietary?: string[]; allergens?: string[] },
): Substitute[] {
  const subs = SUBSTITUTIONS[keyOf(ingredient)] ?? [];
  const allergens = profile?.allergens ?? [];
  const dietary = profile?.dietary ?? [];
  return subs
    .filter((s) => !s.contains.some((c) => allergens.includes(c)))
    .sort((a, b) => score(b) - score(a));
  function score(s: Substitute): number {
    return s.suitableFor.filter((f) => dietary.includes(f) || allergens.map(asDietary).includes(f)).length;
  }
  function asDietary(allergen: string): string {
    return { Gluten: GF, Dairy: DF, Nuts: NF }[allergen] ?? allergen;
  }
}

export function hasSubstitutions(ingredient: string): boolean {
  return (SUBSTITUTIONS[keyOf(ingredient)] ?? []).length > 0;
}
