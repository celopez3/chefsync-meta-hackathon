import { useEffect, useRef, useState } from "react";
import {
  IonApp, IonBadge, IonContent, IonFooter, IonHeader, IonIcon, IonLabel,
  IonPage, IonTabBar, IonTabButton, IonTitle, IonToolbar,
} from "@ionic/react";
import { basketOutline, bookmarkOutline, personOutline, restaurantOutline } from "ionicons/icons";
import MultiImageUploader, { type LocalPhoto } from "./components/MultiImageUploader";
import IngredientChecklist from "./components/IngredientChecklist";
import PantryPanel from "./components/PantryPanel";
import RecipeRow from "./components/RecipeRow";
import RecipeModal from "./components/RecipeModal";
import ProfilePanel from "./components/ProfilePanel";
import LoadingOverlay, { GENERATE_MESSAGES } from "./components/LoadingOverlay";
import SubstituteModal, { type SubTarget } from "./components/SubstituteModal";
import { loadProfile, saveProfile } from "./lib/profile";
import { profileDietaryStrings, type ProfilePrefs } from "../shared/profile";
import type { Substitute } from "../shared/substitutions";
import AuthBar from "./components/AuthBar";
import { compressImage } from "./lib/compress";
import { apiUrl } from "./lib/api";
import {
  deleteSaved, loadPantry, loadSaved, savePantry, saveRecipe, supabase,
  type SavedRecipe, type User,
} from "./lib/supabase";
import { normalizeKey } from "./lib/normalize";
import {
  DetectResponseSchema, RecipeResponseSchema,
  type Ingredient, type Intent, type Plan,
} from "../shared/schemas";

const INTENTS: { id: Intent; label: string; hint: string }[] = [
  { id: "single_meal", label: "Single meal", hint: "One sitting, tonight" },
  { id: "batch_prep", label: "Batch prep", hint: "Cook once, eat all week" },
  { id: "quick_snack", label: "Quick snack", hint: "15 minutes or less" },
];
type Tab = "cook" | "pantry" | "saved" | "profile";

export default function App() {
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [intent, setIntent] = useState<Intent>("single_meal");
{}  const [plans, setPlans] = useState<Plan[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [demoDetect, setDemoDetect] = useState(false);
  const [busy, setBusy] = useState<"detect" | "generate" | null>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [pantry, setPantry] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [tab, setTab] = useState<Tab>("cook");
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [profile, setProfile] = useState<ProfilePrefs | null>(null);
  const [subTarget, setSubTarget] = useState<SubTarget | null>(null);
  const [sessionSwaps, setSessionSwaps] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      const [p, s, prof] = await Promise.all([loadPantry(user), loadSaved(user), loadProfile(user)]);
      if (live) { setPantry(new Set(p)); setSaved(s); setProfile(prof); }
    })();
    return () => { live = false; };
  }, [user]);

  function changePantry(next: Set<string>) {
    setPantry(next);
    void savePantry(user, [...next]);
  }

  function changeProfile(next: ProfilePrefs) {
    setProfile(next);
    void saveProfile(user, next);
  }

  const scannedKey = useRef("");

  /** Adding photos is the scan: no separate Scan button. */
  useEffect(() => {
    const key = photos.map((p) => p.url).join("|");
    if (photos.length === 0) {
      scannedKey.current = "";
      setIngredients([]); setSelected(new Set()); setPlans([]);
      return;
    }
    if (scannedKey.current === key) return;
    scannedKey.current = key;
    void detect(photos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  function rescan() {
    scannedKey.current = photos.map((p) => p.url).join("|");
    void detect(photos);
  }

  async function detect(list: LocalPhoto[]) {
    setBusy("detect"); setError(""); setPlans([]);
    try {
      const form = new FormData();
      for (const p of list) form.append("images", await compressImage(p.file));
      const res = await fetch(apiUrl("/api/ingredients/detect"), { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Detection failed");
      const data = DetectResponseSchema.parse(json);
      setIngredients(data.ingredients);
      setSelected(new Set(data.ingredients.map((i) => i.name)));
      setSessionId(data.sessionId);
      setDemoDetect(data.demoMode);
    } catch (e) { setError(e instanceof Error ? e.message : "Detection failed. Is the API running (npm run dev)?"); }
    finally { setBusy(null); }
  }

  async function generate() {
    setBusy("generate"); setError("");
    try {
      const res = await fetch(apiUrl("/api/recipes/generate"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, selectedIngredients: [...selected], intent,
          dietaryPreferences: profile ? profileDietaryStrings(profile) : [],
          pantryItems: [...pantry],
          avoidIngredients: profile?.avoid ?? [],
          servings: profile?.servings,
          heatLevel: profile?.heat,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setSessionSwaps({});
      setPlans(RecipeResponseSchema.parse(json).plans);
    } catch (e) { setError(e instanceof Error ? e.message : "Generation failed"); }
    finally { setBusy(null); }
  }

  function toggle(name: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  }
  function addCustom(name: string) {
    const pretty = name.replace(/\b\w/g, (c) => c.toUpperCase());
    if (!ingredients.some((i) => i.name.toLowerCase() === pretty.toLowerCase())) {
      setIngredients((list) => [...list, { id: `custom-${pretty}`, name: pretty, confidence: 1, sourceImageIndex: 0 }]);
    }
    setSelected((s) => new Set(s).add(pretty));
  }

  function haveIt(plan: Plan, items: string[]) {
    const next = new Set(pantry);
    const keys = new Set<string>();
    for (const raw of items) {
      const pretty = raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      if (pretty) { next.add(pretty); keys.add(normalizeKey(pretty)); }
    }
    changePantry(next);
    const clear = (p: Plan) => p.title === plan.title
      ? { ...p, missingPantryStaples: (p.missingPantryStaples ?? []).filter((m) => !keys.has(normalizeKey(m))) }
      : p;
    setPlans((list) => list.map(clear));
    setActivePlan((p) => (p ? clear(p) : p));
  }

  /** Chosen swaps for a plan: learned (profile) + this session, keyed by missing-item name. */
  function swapsFor(plan: Plan): Record<string, string> {
    const all = { ...(profile?.substitutions ?? {}), ...sessionSwaps };
    const out: Record<string, string> = {};
    for (const m of plan.missingPantryStaples ?? []) {
      const hit = Object.entries(all).find(([k]) => normalizeKey(k) === normalizeKey(m));
      if (hit) out[m] = hit[1];
    }
    return out;
  }

  function useSubstitute(ingredient: string, sub: Substitute) {
    setSessionSwaps((s) => ({ ...s, [ingredient]: sub.name }));
    if (profile) {
      changeProfile({ ...profile, substitutions: { ...profile.substitutions, [ingredient]: sub.name } });
    }
    setSubTarget(null);
  }

  async function onSave(plan: Plan) {
    const entry = await saveRecipe(user, plan);
    setSaved((list) => [entry, ...list]);
  }
  async function onRemoveSaved(plan: Plan) {
    const entry = saved.find((s) => s.plan.title === plan.title);
    if (!entry) return;
    await deleteSaved(user, entry.id);
    setSaved((list) => list.filter((r) => r.id !== entry.id));
  }
  const savedTitles = new Set(saved.map((s) => s.plan.title));
  const activeSaved = activePlan ? savedTitles.has(activePlan.title) : false;

  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ "--background": "#690500", "--color": "#ffffff", "--padding-start": "20px", "--padding-end": "12px", "--padding-top": "8px", "--padding-bottom": "8px" } as React.CSSProperties}>
            <IonTitle style={{ fontWeight: 900, fontSize: 20 }}>ChefSync AI</IonTitle>
            <div slot="end" className="pr-2">
              <AuthBar user={user} onUser={setUser} />
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen style={{ "--background": "#ffffff" } as React.CSSProperties}>
          <div className="mx-auto max-w-3xl px-3 pb-10 pt-4 sm:px-4">

            {tab === "cook" && (
              <main>
                <p className="font-[family-name:var(--font-display)] text-[26px] font-black leading-tight">Photos in. Dinner sorted.</p>
                <button type="button" onClick={() => setTab("pantry")}
                  className="mt-3 flex min-h-12 w-full items-center justify-between rounded-full border-2 border-[#210f04] bg-[#faf0dd] px-4 text-left text-sm font-bold">
                  <span>My pantry · {pantry.size} staple{pantry.size === 1 ? "" : "s"} saved</span>
                  <span className="font-black text-[#452103]">Open</span>
                </button>

                <div className="mt-4">
                  <MultiImageUploader photos={photos} onChange={setPhotos} disabled={busy !== null} />
                </div>
                {busy === "detect" && <LoadingOverlay />}
                {busy === "generate" && <LoadingOverlay messages={GENERATE_MESSAGES} caption="Writing your recipes…" />}
                {demoDetect && ingredients.length > 0 && (
                  <p className="mt-4 rounded-2xl border-2 border-[#bb6b00] bg-[#faf0dd] px-4 py-2.5 text-sm font-medium text-[#934b00]" role="status">
                    Demo mode: no Meta API key is configured, so these are sample detections. Add <code>MODEL_API_KEY</code> to your <code>.env</code> and restart for real SAM 3.1 results.
                  </p>
                )}
                {error && (
                  <p className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[#690500] bg-[#f9e7d7] px-4 py-2.5 text-sm font-bold text-[#452103]" role="alert">
                    <span>{error}</span>
                    {photos.length > 0 && <button type="button" onClick={rescan} className="min-h-10 rounded-full bg-[#690500] px-4 font-black text-white">Retry scan</button>}
                  </p>
                )}

                {ingredients.length > 0 && (
                  <>
                    <IngredientChecklist ingredients={ingredients} selected={selected} onToggle={toggle}
                      onSelectAll={(all) => setSelected(all ? new Set(ingredients.map((i) => i.name)) : new Set())} onAdd={addCustom} />

                    <section aria-label="What are we making" className="mt-10">
                      <h2 className="font-[family-name:var(--font-display)] text-3xl font-black text-[#210f04]">What are we making?</h2>
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5" role="radiogroup" aria-label="Intent">
                        {INTENTS.map((it) => (
                          <button key={it.id} type="button" role="radio" aria-checked={intent === it.id} onClick={() => setIntent(it.id)}
                            className={`min-h-[72px] rounded-[26px] border-2 p-3 text-left sm:p-4 ${intent === it.id ? "border-[#210f04] bg-[#934b00] text-white shadow-[0_10px_24px_rgba(33,15,4,0.16)]" : "border-stone-200 bg-white hover:border-[#210f04]"}`}>
                            <span className="block text-[15px] font-black leading-tight sm:text-base">{it.label}</span>
                            <span className={`mt-0.5 hidden text-sm font-medium sm:block ${intent === it.id ? "text-white/85" : "text-stone-600"}`}>{it.hint}</span>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setTab("profile")}
                        className="mt-3 flex min-h-11 w-full flex-wrap items-center justify-between gap-2 rounded-full border-2 border-stone-300 px-4 text-left text-sm font-bold text-stone-600">
                        <span>
                          {profile && (profile.dietary.length || profile.allergens.length || profile.avoid.length)
                            ? [...profile.dietary, ...profile.allergens.map((a) => `No ${a.toLowerCase()}`), ...profile.avoid.map((a) => `No ${a.toLowerCase()}`)].join(" · ")
                            : "No preferences set"}
                          {profile ? ` · Serves ${profile.servings} · ${profile.heat}` : ""}
                        </span>
                        <span className="font-black text-[#690500]">Profile</span>
                      </button>
                      <button type="button" onClick={generate} disabled={selected.size === 0 || busy !== null}
                        className="mt-5 min-h-14 w-full rounded-full border-2 border-[#210f04] bg-[#210f04] text-base font-black text-white shadow-[4px_4px_0_#690500] disabled:opacity-40 disabled:shadow-none">
                        {busy === "generate" ? "Writing your recipes…" : `Generate recipes from ${selected.size} ingredient${selected.size === 1 ? "" : "s"}`}
                      </button>
                    </section>
                  </>
                )}

                {plans.length > 0 && (
                  <section aria-label="Recipes" className="mt-10">
                    <h2 className="font-[family-name:var(--font-display)] text-3xl font-black text-[#210f04]">Your plans</h2>
                    <p className="mt-1 text-sm font-medium text-stone-600">Tap a recipe for the full steps.</p>
                    <div className="mt-3">
                      {plans.map((p, i) => (
                        <RecipeRow key={p.title} plan={p} index={i} saved={savedTitles.has(p.title)}
                          onOpen={setActivePlan} onSave={onSave} />
                      ))}
                    </div>
                  </section>
                )}
              </main>
            )}

            {tab === "pantry" && (
              <main>
                <h2 className="font-[family-name:var(--font-display)] text-[26px] font-black leading-tight">My pantry</h2>
                <p className="mt-1 text-[15px] font-medium text-stone-600">The general goods you always have at home.</p>
                <div className="mt-4">
                  <PantryPanel pantry={pantry} onChange={changePantry} defaultOpen />
                </div>
              </main>
            )}

            {tab === "saved" && (
              <main>
                <h2 className="font-[family-name:var(--font-display)] text-[26px] font-black leading-tight">
                  Saved recipes {saved.length > 0 && <span className="text-base font-bold text-stone-500">({saved.length})</span>}
                </h2>
                <p className="mt-1 text-[15px] font-medium text-stone-600">
                  {user ? "Synced to your Supabase account." : "Saved on this device. Sign in to sync them everywhere."}
                </p>
                {saved.length === 0 ? (
                  <div className="mt-6 rounded-[28px] border-2 border-dashed border-stone-300 p-6 text-center">
                    <p className="font-black">No saved recipes yet</p>
                    <p className="mt-1 text-sm font-medium text-stone-600">Snap some ingredients, generate a plan, and tap Save.</p>
                    <button type="button" onClick={() => setTab("cook")}
                      className="mt-4 min-h-12 rounded-full bg-[#690500] px-6 font-black text-white">Go to Cook</button>
                  </div>
                ) : (
                  <div className="mt-4">
                    {saved.map((s, i) => (
                      <RecipeRow key={s.id} plan={s.plan} index={i} saved onOpen={setActivePlan} />
                    ))}
                  </div>
                )}
              </main>
            )}

            {tab === "profile" && (
              <main>
                <h2 className="font-[family-name:var(--font-display)] text-[26px] font-black leading-tight">My profile</h2>
                <p className="mt-1 text-[15px] font-medium text-stone-600">Preferences that shape every recipe and every substitute list.</p>
                <div className="mt-4">
                  {profile
                    ? <ProfilePanel profile={profile} onChange={changeProfile} user={user} />
                    : <p className="text-sm font-medium text-stone-600">Loading your preferences…</p>}
                </div>
              </main>
            )}

            <footer className="mt-14 border-t-2 border-stone-200 pt-4 text-sm font-medium text-stone-500">
              ChefSync AI — SAM 3.1 detection · Muse Spark recipes · Ionic + React + Supabase.
            </footer>
          </div>
        </IonContent>

        <IonFooter>
          <IonTabBar selectedTab={tab} style={{ "--background": "#ffffff", "--color": "#934b00", "--color-selected": "#690500" } as Record<string, string>}>
            <IonTabButton tab="cook" selected={tab === "cook"} onClick={() => setTab("cook")}>
              <IonIcon icon={restaurantOutline} />
              <IonLabel style={{ fontWeight: 800 }}>Cook</IonLabel>
            </IonTabButton>
            <IonTabButton tab="pantry" selected={tab === "pantry"} onClick={() => setTab("pantry")}>
              <IonIcon icon={basketOutline} />
              <IonLabel style={{ fontWeight: 800 }}>Pantry</IonLabel>
              {pantry.size > 0 && <IonBadge style={{ "--background": "#934b00" } as React.CSSProperties}>{pantry.size}</IonBadge>}
            </IonTabButton>
            <IonTabButton tab="saved" selected={tab === "saved"} onClick={() => setTab("saved")}>
              <IonIcon icon={bookmarkOutline} />
              <IonLabel style={{ fontWeight: 800 }}>Saved</IonLabel>
              {saved.length > 0 && <IonBadge style={{ "--background": "#690500" } as React.CSSProperties}>{saved.length}</IonBadge>}
            </IonTabButton>
            <IonTabButton tab="profile" selected={tab === "profile"} onClick={() => setTab("profile")}>
              <IonIcon icon={personOutline} />
              <IonLabel style={{ fontWeight: 800 }}>Profile</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonFooter>
      </IonPage>

      <RecipeModal plan={activePlan} saved={activeSaved} onClose={() => setActivePlan(null)}
        onSave={onSave} onRemove={activeSaved ? onRemoveSaved : undefined} onHaveIt={haveIt}
        onMissingTap={(ingredient) => setSubTarget({ ingredient })}
        swaps={activePlan ? swapsFor(activePlan) : {}} />
      {profile && (
        <SubstituteModal target={subTarget} profile={profile} onClose={() => setSubTarget(null)}
          onUse={useSubstitute}
          onHaveIt={(ingredient) => { if (activePlan) haveIt(activePlan, [ingredient]); setSubTarget(null); }} />
      )}
    </IonApp>
  );
}
