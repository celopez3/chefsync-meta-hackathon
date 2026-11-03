import { IonItem, IonLabel } from "@ionic/react";
import type { Plan } from "../../shared/schemas";

const DOTS = ["#690500", "#934b00", "#bb6b00"];

/** Compact tappable recipe row. Full detail opens in RecipeModal. */
export default function RecipeRow({ plan, index = 0, saved, onOpen, onSave }: {
  plan: Plan;
  index?: number;
  saved?: boolean;
  onOpen: (plan: Plan) => void;
  onSave?: (plan: Plan) => void;
}) {
  const missing = plan.missingPantryStaples?.length ?? 0;
  return (
    <IonItem button detail={false} lines="none" onClick={() => onOpen(plan)}
      className="mb-2.5 overflow-hidden rounded-[26px] bg-white shadow-[0_8px_22px_rgba(33,15,4,0.10)] ring-1 ring-[#e7d6b8]"
      style={{ "--background": "#ffffff", "--border-radius": "24px", "--padding-start": "14px", "--inner-padding-end": "10px" } as React.CSSProperties}>
      <span aria-hidden="true" className="mr-3 h-10 w-2.5 shrink-0 rounded-full" style={{ background: DOTS[index % DOTS.length] }} />
      <IonLabel className="py-2">
        <h3 style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.25, whiteSpace: "normal" }}>{plan.title}</h3>
        <p style={{ fontWeight: 600, color: "#57534e", marginTop: 2 }}>
          {plan.prepTimeMinutes} min · {plan.difficulty}
          {missing > 0 ? ` · ${missing} missing` : " · ready to cook"}
        </p>
      </IonLabel>
      {onSave && (
        <button type="button" slot="end" disabled={saved}
          onClick={(e) => { e.stopPropagation(); onSave(plan); }}
          className={`ml-2 flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-sm font-black ${saved ? "bg-[#f6ead6] text-[#452103]" : "bg-[#690500] text-white"}`}>
          {saved ? "Saved" : "Save"}
        </button>
      )}
    </IonItem>
  );
}
