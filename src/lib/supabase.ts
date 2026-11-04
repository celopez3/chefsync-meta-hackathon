import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Plan } from "../../shared/schemas";
import { mergeSavedRecipes } from "../../shared/saved";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, anonKey!) : null;
export type { User };

const LS_PANTRY = "chefsync.pantry";
const LS_SAVED = "chefsync.savedRecipes";

export type SavedRecipe = { id: string; plan: Plan; savedAt: string };

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } }

/* ---- Pantry: Supabase when signed in, localStorage otherwise.
   First sign-in migration: if the account has nothing yet but this
   device does, the local items are uploaded and become the account's. */
export async function loadPantry(user: User | null): Promise<string[]> {
  const local = read<string[]>(LS_PANTRY, []);
  if (supabase && user) {
    const { data, error } = await supabase.from("pantry_items").select("name").eq("user_id", user.id).order("name");
    if (!error && data) {
      const cloud = data.map((r) => r.name as string);
      // Merge, never replace: union of account + this device, uploaded
      // back if the device had anything the account did not.
      const merged = [...new Set([...cloud, ...local])].sort();
      if (merged.length !== cloud.length) await savePantry(user, merged);
      else write(LS_PANTRY, merged);
      return merged;
    }
  }
  return local;
}

export async function savePantry(user: User | null, items: string[]): Promise<void> {
  write(LS_PANTRY, items);
  if (supabase && user) {
    await supabase.from("pantry_items").delete().eq("user_id", user.id);
    if (items.length) await supabase.from("pantry_items").insert(items.map((name) => ({ user_id: user.id, name })));
  }
}

/* ---- Saved recipes ---- */
export async function loadSaved(user: User | null): Promise<SavedRecipe[]> {
  const local = read<SavedRecipe[]>(LS_SAVED, []);
  if (supabase && user) {
    const { data, error } = await supabase.from("saved_recipes").select("id, plan, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!error && data) {
      const cloud = data.map((r) => ({ id: r.id as string, plan: r.plan as Plan, savedAt: r.created_at as string }));
      // Merge account + device lists, de-duplicated by recipe
      // fingerprint (same title, ingredients and method). Cloud copies
      // win; device-only recipes are uploaded to the account.
      const { merged, toUpload } = mergeSavedRecipes(cloud, local);
      const uploaded = new Map<string, SavedRecipe>();
      for (const entry of toUpload) {
        const { data: row, error: insertError } = await supabase
          .from("saved_recipes")
          .insert({ user_id: user.id, title: entry.plan.title, plan: entry.plan })
          .select("id, created_at")
          .single();
        if (!insertError && row) {
          uploaded.set(entry.id, { id: row.id as string, plan: entry.plan, savedAt: row.created_at as string });
        }
      }
      const result = merged.map((e) => uploaded.get(e.id) ?? e);
      write(LS_SAVED, result);
      return result;
    }
  }
  return local;
}

export async function saveRecipe(user: User | null, plan: Plan): Promise<SavedRecipe> {
  if (supabase && user) {
    const { data, error } = await supabase.from("saved_recipes").insert({ user_id: user.id, title: plan.title, plan }).select("id, created_at").single();
    if (!error && data) return { id: data.id as string, plan, savedAt: data.created_at as string };
  }
  const entry: SavedRecipe = { id: `local-${Date.now()}`, plan, savedAt: new Date().toISOString() };
  write(LS_SAVED, [entry, ...read<SavedRecipe[]>(LS_SAVED, [])]);
  return entry;
}

export async function deleteSaved(user: User | null, id: string): Promise<void> {
  if (supabase && user && !id.startsWith("local-")) await supabase.from("saved_recipes").delete().eq("id", id).eq("user_id", user.id);
  write(LS_SAVED, read<SavedRecipe[]>(LS_SAVED, []).filter((r) => r.id !== id));
}
