import type { Ingredient } from "../shared/schemas.js";

/** Normalize a detected label so "Bell Peppers", "bell pepper " and "bell-pepper" merge. */
export function normalizeName(raw: string): string {
  let n = raw.toLowerCase().trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  n = n.replace(/\b(fresh|raw|organic|large|small)\b/g, "").replace(/\s+/g, " ").trim();
  // naive singular: tomatoes->tomato handled, peppers->pepper, eggs->egg; keep "ss" endings
  if (n.endsWith("oes")) n = n.slice(0, -2);
  else if (n.endsWith("ies") && n.length > 3) n = n.slice(0, -3) + "y";
  else if (n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("us")) n = n.slice(0, -1);
  return n;
}

export function titleCase(n: string): string {
  return n.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Merge duplicates across photos, keeping the highest-confidence detection. */
export function dedupeIngredients(items: Ingredient[]): Ingredient[] {
  const byKey = new Map<string, Ingredient>();
  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || item.confidence > existing.confidence) {
      byKey.set(key, { ...item, id: key.replace(/\s+/g, "-"), name: titleCase(key) });
    }
  }
  return [...byKey.values()].sort((a, b) => b.confidence - a.confidence);
}
