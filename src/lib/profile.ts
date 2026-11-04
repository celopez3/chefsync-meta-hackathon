import { DEFAULT_PROFILE, type ProfilePrefs } from "../../shared/profile";
import { supabase, type User } from "./supabase";

const LS_PROFILE = "chefsync.profile";

function readLocal(): ProfilePrefs {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    return raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<ProfilePrefs>) } : DEFAULT_PROFILE;
  } catch { return DEFAULT_PROFILE; }
}
function writeLocal(p: ProfilePrefs) {
  try { localStorage.setItem(LS_PROFILE, JSON.stringify(p)); } catch { /* private mode */ }
}

/** Supabase (user_preferences row) when signed in, localStorage otherwise. */
export async function loadProfile(user: User | null): Promise<ProfilePrefs> {
  const local = readLocal();
  if (supabase && user) {
    const { data, error } = await supabase.from("user_preferences").select("prefs").eq("user_id", user.id).maybeSingle();
    if (!error && data?.prefs) {
      // Merge, never replace: lists are unioned, learned substitutes
      // combine (account wins a conflict), servings/heat follow the
      // account. The merged result is saved back to both places.
      const cloud = { ...DEFAULT_PROFILE, ...(data.prefs as Partial<ProfilePrefs>) };
      const merged: ProfilePrefs = {
        dietary: [...new Set([...cloud.dietary, ...local.dietary])],
        allergens: [...new Set([...cloud.allergens, ...local.allergens])],
        avoid: [...new Set([...cloud.avoid, ...local.avoid])],
        servings: cloud.servings,
        heat: cloud.heat,
        substitutions: { ...local.substitutions, ...cloud.substitutions },
      };
      writeLocal(merged);
      void saveProfile(user, merged);
      return merged;
    }
    if (!error && !data) {
      // First sign-in: upload this device's preferences to the account.
      await saveProfile(user, local);
    }
  }
  return local;
}

export async function saveProfile(user: User | null, prefs: ProfilePrefs): Promise<void> {
  writeLocal(prefs);
  if (supabase && user) {
    await supabase.from("user_preferences").upsert({ user_id: user.id, prefs, updated_at: new Date().toISOString() });
  }
}
