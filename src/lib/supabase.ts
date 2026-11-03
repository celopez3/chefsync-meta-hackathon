import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Plan } from "../../shared/schemas";

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

/* ---- Pantry: Supabase when signed in, localStorage otherwise ---- */
export async function loadPantry(user: User | null): Promise<string[]> {
  if (supabase && user) {
    const { data, error } = await supabase.from("pantry_items").select("name").eq("user_id", user.id).order("name");
    if (!error && data) return data.map((r) => r.name as string);
  }
  return read<string[]>(LS_PANTRY, []);
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
  if (supabase && user) {
    const { data, error } = await supabase.from("saved_recipes").select("id, plan, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!error && data) return data.map((r) => ({ id: r.id as string, plan: r.plan as Plan, savedAt: r.created_at as string }));
  }
  return read<SavedRecipe[]>(LS_SAVED, []);
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
