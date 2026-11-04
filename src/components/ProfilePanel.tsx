import { useState } from "react";
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS, HEAT_LEVELS, type ProfilePrefs } from "../../shared/profile";
import type { User } from "../lib/supabase";
import DictateButton from "./DictateButton";

function ChipRow({ label, options, values, onToggle, tone }: {
  label: string;
  options: readonly string[];
  values: string[];
  onToggle: (v: string) => void;
  tone: "garnet" | "chocolate";
}) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-black text-[#210f04]">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = values.includes(opt);
          return (
            <button key={opt} type="button" aria-pressed={on} onClick={() => onToggle(opt)}
              className={`min-h-10 rounded-full border-2 px-4 text-sm font-bold ${on
                ? `border-[#210f04] text-white ${tone === "garnet" ? "bg-[#690500]" : "bg-[#934b00]"}`
                : "border-stone-300 bg-white text-stone-600 hover:border-[#210f04]"}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePanel({ profile, onChange, user }: {
  profile: ProfilePrefs;
  onChange: (p: ProfilePrefs) => void;
  user: User | null;
}) {
  const [avoidDraft, setAvoidDraft] = useState("");
  const toggleIn = (key: "dietary" | "allergens") => (v: string) =>
    onChange({ ...profile, [key]: profile[key].includes(v) ? profile[key].filter((x) => x !== v) : [...profile[key], v] });
  const addAvoid = (items: string[]) =>
    onChange({ ...profile, avoid: [...new Set([...profile.avoid, ...items.map((i) => i.trim()).filter(Boolean)])] });

  return (
    <section aria-label="My profile" className="rounded-[28px] bg-white p-4 shadow-[0_12px_28px_rgba(33,15,4,0.12)] ring-1 ring-[#e7d6b8] sm:p-5">
      <p className="text-[15px] font-medium leading-relaxed text-stone-600">
        {user
          ? <>Signed in as <strong className="text-[#210f04]">{user.email}</strong>. These preferences sync to your account and apply to every recipe.</>
          : <>These preferences are saved on this device. Sign in (top right) to sync them to your account.</>}
      </p>

      <ChipRow label="I eat…" options={DIETARY_OPTIONS} values={profile.dietary} onToggle={toggleIn("dietary")} tone="garnet" />
      <ChipRow label="Allergies / must avoid (the allergen, not the diet)" options={ALLERGEN_OPTIONS} values={profile.allergens} onToggle={toggleIn("allergens")} tone="chocolate" />

      <div className="mt-5">
        <h3 className="text-sm font-black text-[#210f04]">Ingredients to never use</h3>
        {profile.avoid.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.avoid.map((a) => (
              <button key={a} type="button" title="Remove" onClick={() => onChange({ ...profile, avoid: profile.avoid.filter((x) => x !== a) })}
                className="min-h-10 rounded-full bg-[#bb6b00] px-4 text-sm font-bold text-[#210f04]">{a} ×</button>
            ))}
          </div>
        )}
        <form className="mt-2 flex max-w-md items-start gap-2" onSubmit={(e) => { e.preventDefault(); if (avoidDraft.trim()) { addAvoid([avoidDraft]); setAvoidDraft(""); } }}>
          <input value={avoidDraft} onChange={(e) => setAvoidDraft(e.target.value)} placeholder="e.g. Coriander — type it, or tap the mic"
            className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-stone-300 px-4 text-base font-medium focus:border-[#210f04] focus:outline-none" aria-label="Add an ingredient to avoid" />
          <DictateButton iconOnly label="Dictate an ingredient to avoid" onItems={addAvoid} />
          <button className="min-h-12 shrink-0 rounded-full bg-[#210f04] px-6 font-bold text-white">Add</button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap gap-6">
        <div>
          <h3 className="text-sm font-black text-[#210f04]">Default servings</h3>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" aria-label="Fewer servings" onClick={() => onChange({ ...profile, servings: Math.max(1, profile.servings - 1) })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6ead6] text-xl font-black text-[#452103]">−</button>
            <span className="min-w-8 text-center text-lg font-black">{profile.servings}</span>
            <button type="button" aria-label="More servings" onClick={() => onChange({ ...profile, servings: Math.min(12, profile.servings + 1) })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6ead6] text-xl font-black text-[#452103]">+</button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-[#210f04]">Heat level</h3>
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Heat level">
            {HEAT_LEVELS.map((h) => (
              <button key={h} type="button" role="radio" aria-checked={profile.heat === h} onClick={() => onChange({ ...profile, heat: h })}
                className={`min-h-10 rounded-full border-2 px-4 text-sm font-bold ${profile.heat === h ? "border-[#210f04] bg-[#690500] text-white" : "border-stone-300 bg-white text-stone-600 hover:border-[#210f04]"}`}>
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(profile.substitutions).length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-black text-[#210f04]">Your learned substitutes</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(profile.substitutions).map(([item, sub]) => (
              <button key={item} type="button" title="Forget this substitute"
                onClick={() => { const next = { ...profile.substitutions }; delete next[item]; onChange({ ...profile, substitutions: next }); }}
                className="min-h-10 rounded-full bg-[#f6ead6] px-4 text-sm font-bold text-[#452103]">{item} → {sub} ×</button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
