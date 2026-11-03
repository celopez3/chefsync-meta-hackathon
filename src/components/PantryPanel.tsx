import { useRef, useState } from "react";
import { COMMON_PANTRY_ITEMS, PANTRY_CATEGORIES } from "../../shared/pantry";
import { DetectResponseSchema } from "../../shared/schemas";
import { compressImage } from "../lib/compress";
import { apiUrl } from "../lib/api";
import DictateButton from "./DictateButton";

export default function PantryPanel({ pantry, onChange, defaultOpen = false }: { pantry: Set<string>; onChange: (next: Set<string>) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [custom, setCustom] = useState("");
  const [scanning, setScanning] = useState(false);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const known = new Set(PANTRY_CATEGORIES.flatMap((c) => c.items));
  const extras = [...pantry].filter((i) => !known.has(i));

  function toggle(name: string) {
    const next = new Set(pantry);
    if (next.has(name)) next.delete(name); else next.add(name);
    onChange(next);
  }
  function addMany(names: string[]) {
    const next = new Set(pantry);
    for (const n of names) {
      const pretty = n.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      if (pretty) next.add(pretty);
    }
    onChange(next);
  }

  async function scanSpiceRack(file: File) {
    setScanning(true); setNote("");
    try {
      const form = new FormData();
      form.append("context", "spice_rack");
      form.append("images", await compressImage(file));
      const res = await fetch(apiUrl("/api/ingredients/detect"), { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Spice scan failed");
      const data = DetectResponseSchema.parse(json);
      addMany(data.ingredients.map((i) => i.name));
      setNote(`Added ${data.ingredients.length} item${data.ingredients.length === 1 ? "" : "s"} from your spice rack${data.demoMode ? " (demo spices — add a Meta key for real label reading)" : ""}.`);
    } catch (e) { setNote(e instanceof Error ? e.message : "Spice scan failed"); }
    finally { setScanning(false); }
  }

  return (
    <section aria-label="My pantry" className="rounded-[28px] bg-white p-4 shadow-[0_12px_28px_rgba(33,15,4,0.12)] ring-1 ring-[#e7d6b8] sm:p-5">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="block font-[family-name:var(--font-display)] text-2xl font-black text-[#210f04]">My pantry</span>
          <span className="block text-sm font-medium text-stone-600">{pantry.size} staple{pantry.size === 1 ? "" : "s"} saved — recipes won’t call them missing.</span>
        </span>
        <span className="shrink-0 rounded-full bg-[#210f04] px-4 py-2 text-sm font-black text-white">{open ? "Hide" : "Set up"}</span>
      </button>

      {open && <>
      <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => addMany(COMMON_PANTRY_ITEMS)}
            className="min-h-11 rounded-full bg-[#bb6b00] px-6 text-sm font-black text-[#210f04] shadow-[0_6px_16px_rgba(33,15,4,0.18)] hover:bg-[#934b00] hover:text-white">
            Select most common
          </button>
          <button type="button" disabled={scanning} onClick={() => fileRef.current?.click()}
            className="min-h-11 rounded-full bg-[#934b00] px-6 text-sm font-bold text-white shadow-[0_6px_16px_rgba(33,15,4,0.18)] hover:bg-[#452103] disabled:opacity-50">
            {scanning ? "Scanning rack…" : "Snap spice rack"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void scanSpiceRack(f); e.target.value = ""; }} />
      </div>

      {PANTRY_CATEGORIES.map((cat) => (
        <div key={cat.label} className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#690500]">{cat.label}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cat.items.map((item) => {
              const on = pantry.has(item);
              return (
                <button key={item} type="button" aria-pressed={on} onClick={() => toggle(item)}
                  className={`min-h-10 rounded-full border-2 px-4 text-sm font-bold transition-colors ${on ? "border-[#210f04] bg-[#690500] text-white" : "border-stone-300 bg-white text-stone-600 hover:border-[#210f04]"}`}>
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {extras.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#690500]">Your additions</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {extras.map((item) => (
              <button key={item} type="button" onClick={() => toggle(item)} title="Remove"
                className="rounded-full border-2 border-[#210f04] bg-[#bb6b00] px-3 py-1 text-sm font-bold text-[#210f04]">{item} ×</button>
            ))}
          </div>
        </div>
      )}

      <form className="mt-4 flex max-w-md items-start gap-2" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { addMany([custom]); setCustom(""); } }}>
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a staple — type it, or tap the mic and say it"
          className="min-h-12 min-w-0 flex-1 rounded-full border-2 border-stone-300 px-4 text-base font-medium focus:border-[#210f04] focus:outline-none" aria-label="Add a pantry item manually" />
        <DictateButton iconOnly label="Dictate a pantry item" onItems={addMany} />
        <button className="min-h-12 shrink-0 rounded-full bg-[#210f04] px-6 font-bold text-white">Add</button>
      </form>
      </>}
      {note && <p className="mt-3 rounded-2xl bg-[#f6ead6] px-3 py-2 text-sm font-medium text-[#452103]" role="status">{note}</p>}
    </section>
  );
}
