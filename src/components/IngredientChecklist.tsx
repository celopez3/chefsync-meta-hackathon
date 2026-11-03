import { useState } from "react";
import type { Ingredient } from "../../shared/schemas";
import DictateButton from "./DictateButton";

export default function IngredientChecklist({
  ingredients, selected, onToggle, onSelectAll, onAdd,
}: {
  ingredients: Ingredient[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: (all: boolean) => void;
  onAdd: (name: string) => void;
}) {
  const [custom, setCustom] = useState("");
  return (
    <section aria-label="Detected ingredients" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] font-black text-[#210f04] sm:text-3xl">
          What we found <span className="text-base font-bold text-stone-500">({selected.size} of {ingredients.length} selected)</span>
        </h2>
        <div className="flex gap-2 text-sm font-bold">
          <button type="button" onClick={() => onSelectAll(true)} className="min-h-11 rounded-full border-2 border-[#210f04] px-4 hover:bg-[#210f04] hover:text-white">Select all</button>
          <button type="button" onClick={() => onSelectAll(false)} className="min-h-11 rounded-full border-2 border-stone-300 px-4 text-stone-600 hover:border-[#210f04]">Clear</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {ingredients.map((ing) => {
          const on = selected.has(ing.name);
          return (
            <label key={ing.id} className={`flex min-h-[76px] cursor-pointer items-start gap-2 rounded-[26px] border-2 p-3.5 transition-colors ${on ? "border-[#210f04] bg-[#bb6b00] shadow-[0_10px_24px_rgba(33,15,4,0.16)]" : "border-stone-200 bg-white hover:border-[#210f04]"}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(ing.name)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#690500]" />
              <span>
                <span className="block font-black leading-tight">{ing.name}</span>
                <span className="block text-xs font-medium text-stone-500">Photo {ing.sourceImageIndex + 1} · {Math.round(ing.confidence * 100)}% sure</span>
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex max-w-lg flex-wrap items-center gap-2">
        <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { onAdd(custom.trim()); setCustom(""); } }}>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Missed something? Add it"
            className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-stone-300 px-4 text-base font-medium focus:border-[#210f04] focus:outline-none" aria-label="Add an ingredient manually" />
          <button className="min-h-12 rounded-full bg-[#210f04] px-6 font-bold text-white">Add</button>
        </form>
        <DictateButton label="Dictate it" onItems={(items) => items.forEach(onAdd)} />
      </div>
    </section>
  );
}
