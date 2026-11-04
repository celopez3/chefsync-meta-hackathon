import type { Plan } from "./schemas.js";

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Identity of a recipe for merging: same dish, same ingredients, same method. */
export function savedRecipeKey(plan: Plan): string {
  return [
    norm(plan.title),
    [...plan.usedIngredients].map(norm).sort().join(","),
    plan.instructions.map(norm).join(" "),
  ].join("|");
}

export type SavedLike<T> = { id: string; plan: Plan } & T;

/**
 * Union of account (cloud) and this-device (local) saved recipes.
 * Cloud wins on duplicates — a duplicate is the same title cooked the
 * same way, per savedRecipeKey. Returns the de-duplicated list plus the
 * local-only entries that still need uploading to the account.
 */
export function mergeSavedRecipes<T extends object>(
  cloud: SavedLike<T>[],
  local: SavedLike<T>[],
): { merged: SavedLike<T>[]; toUpload: SavedLike<T>[] } {
  const seen = new Set<string>();
  const merged: SavedLike<T>[] = [];
  for (const entry of cloud) {
    const key = savedRecipeKey(entry.plan);
    if (!seen.has(key)) { seen.add(key); merged.push(entry); }
  }
  const toUpload: SavedLike<T>[] = [];
  for (const entry of local) {
    const key = savedRecipeKey(entry.plan);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
    toUpload.push(entry);
  }
  return { merged, toUpload };
}
