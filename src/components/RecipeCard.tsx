import type { Plan } from "../../shared/schemas";
import DictateButton from "./DictateButton";

const BANDS = ["bg-[#690500]", "bg-[#934b00]", "bg-[#bb6b00]"];

export default function RecipeCard({ plan, index = 0, onSave, saved, onHaveIt, onMissingTap, swaps = {} }: {
  plan: Plan;
  index?: number;
  onSave?: (plan: Plan) => void;
  saved?: boolean;
  /** User dictated/confirmed they already have a missing item. */
  onHaveIt?: (plan: Plan, items: string[]) => void;
  /** Tap a missing item to see substitutes. */
  onMissingTap?: (ingredient: string) => void;
  /** ingredient -> chosen substitute (shown as covered). */
  swaps?: Record<string, string>;
}) {
  const missing = plan.missingPantryStaples ?? [];
  return (
    <article className="overflow-hidden rounded-[26px] bg-white shadow-[0_12px_28px_rgba(33,15,4,0.12)] ring-1 ring-[#e7d6b8]">
      <div className={`h-2.5 ${BANDS[index % BANDS.length]}`} />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-[22px] font-black leading-tight text-[#210f04]">{plan.title}</h3>
          <span className="rounded-full bg-[#210f04] px-3 py-1 text-xs font-black text-white">{plan.prepTimeMinutes} MIN · {plan.difficulty.toUpperCase()}</span>
        </div>
        <p className="mt-3 text-sm font-medium text-stone-600"><strong className="font-black text-[#210f04]">Uses:</strong> {plan.usedIngredients.join(", ")}</p>

        {missing.length > 0 && (
          <div className="mt-3 rounded-2xl bg-[#f9e7d7] p-3">
            <p className="text-sm"><strong className="font-black text-[#210f04]">Missing items:</strong></p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {missing.map((m) => swaps[m] ? (
                <span key={m} className="rounded-full bg-[#934b00] px-3 py-1 text-sm font-bold text-white">{m} ✓ via {swaps[m]}</span>
              ) : (
                <button key={m} type="button" title="See substitutes"
                  onClick={() => onMissingTap?.(m)}
                  className="min-h-9 rounded-full border-2 border-[#690500] bg-white px-3 text-sm font-bold text-[#452103] hover:bg-[#690500] hover:text-white">{m} — swap?</button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <DictateButton label="Say what you have" onItems={(items) => onHaveIt?.(plan, items)} />
              <span className="text-xs font-medium text-stone-500">or tap an item you already have</span>
            </div>
          </div>
        )}

        <ol className="mt-4 space-y-2 pl-1 text-[15px] leading-relaxed">
          {plan.instructions.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bb6b00] text-xs font-black text-[#210f04]">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        {onSave && (
          <button type="button" disabled={saved} onClick={() => onSave(plan)}
            className={`mt-4 rounded-full px-5 py-2 text-sm font-black ${saved ? "bg-[#f6ead6] text-[#452103]" : "bg-[#690500] text-white hover:bg-[#452103]"}`}>
            {saved ? "Saved to my recipes" : "Save recipe"}
          </button>
        )}
      </div>
    </article>
  );
}
