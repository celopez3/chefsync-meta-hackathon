import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from "@ionic/react";
import type { Plan } from "../../shared/schemas";
import RecipeCard from "./RecipeCard";

/** Full-screen recipe detail sheet. Lists stay short; this is where
 *  steps, missing items, dictation and save/remove live. */
export default function RecipeModal({ plan, saved, onClose, onSave, onRemove, onHaveIt, onMissingTap, swaps = {} }: {
  plan: Plan | null;
  saved?: boolean;
  onClose: () => void;
  onSave?: (plan: Plan) => void;
  onRemove?: (plan: Plan) => void;
  onHaveIt?: (plan: Plan, items: string[]) => void;
  onMissingTap?: (ingredient: string) => void;
  swaps?: Record<string, string>;
}) {
  return (
    <IonModal isOpen={plan !== null} onDidDismiss={onClose} breakpoints={[0, 1]} initialBreakpoint={1}>
      <IonHeader>
        <IonToolbar style={{ "--background": "#690500", "--color": "#ffffff", "--padding-start": "20px", "--padding-end": "12px", "--padding-top": "10px", "--padding-bottom": "10px" } as React.CSSProperties}>
          <IonTitle style={{ fontWeight: 900 }}>Recipe</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ "--color": "#ffffff", "--padding-start": "18px", "--padding-end": "18px", fontWeight: 800 } as React.CSSProperties}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {plan && (
          <div className="mx-auto max-w-2xl px-4 pb-12 pt-5 sm:px-6">
            <RecipeCard plan={plan} onHaveIt={onHaveIt} onMissingTap={onMissingTap} swaps={swaps} />
            <div className="mb-2 mt-5 flex flex-wrap gap-2 px-1">
              {onSave && (
                <button type="button" disabled={saved} onClick={() => onSave(plan)}
                  className={`min-h-12 rounded-full px-6 font-black ${saved ? "bg-[#f6ead6] text-[#452103]" : "bg-[#690500] text-white"}`}>
                  {saved ? "Saved to my recipes" : "Save recipe"}
                </button>
              )}
              {onRemove && (
                <button type="button" onClick={() => { onRemove(plan); onClose(); }}
                  className="min-h-12 rounded-full border-2 border-[#690500] px-6 font-black text-[#452103]">
                  Remove from saved
                </button>
              )}
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
}
