import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from "@ionic/react";
import { findSubstitutions, type Substitute } from "../../shared/substitutions";
import type { ProfilePrefs } from "../../shared/profile";

export type SubTarget = { ingredient: string };

/** Tap a missing pantry item -> this sheet. Curated substitutes, ranked
 *  for the cook's profile; allergic options are already filtered out. */
export default function SubstituteModal({ target, profile, onClose, onUse, onHaveIt }: {
  target: SubTarget | null;
  profile: ProfilePrefs;
  onClose: () => void;
  onUse: (ingredient: string, sub: Substitute) => void;
  onHaveIt: (ingredient: string) => void;
}) {
  const ingredient = target?.ingredient ?? "";
  const subs = target ? findSubstitutions(ingredient, profile) : [];
  return (
    <IonModal isOpen={target !== null} onDidDismiss={onClose} breakpoints={[0, 1]} initialBreakpoint={1}>
      <IonHeader>
        <IonToolbar style={{ "--background": "#690500", "--color": "#ffffff", "--padding-start": "20px", "--padding-end": "12px", "--padding-top": "10px", "--padding-bottom": "10px" } as React.CSSProperties}>
          <IonTitle style={{ fontWeight: 900 }}>Swap {ingredient}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ "--color": "#ffffff", "--padding-start": "18px", "--padding-end": "18px", fontWeight: 800 } as React.CSSProperties}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="mx-auto max-w-2xl px-4 pb-12 pt-5 sm:px-6">
          {profile.allergens.length > 0 || profile.dietary.length > 0 ? (
            <p className="rounded-2xl bg-[#faf0dd] px-4 py-3 text-sm font-semibold text-[#934b00]">
              Ranked for your profile{profile.allergens.length ? ` — anything containing ${profile.allergens.join(", ")} is hidden` : ""}.
            </p>
          ) : (
            <p className="rounded-2xl bg-[#faf0dd] px-4 py-3 text-sm font-semibold text-[#934b00]">
              Set allergies and dietary preferences in your Profile and this list will rank itself for you.
            </p>
          )}

          {subs.length === 0 ? (
            <p className="mt-5 text-[15px] font-medium leading-relaxed text-stone-600">
              No tested substitute in our database for {ingredient} yet. If you already have it at home, mark it below.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {subs.map((s) => (
                <div key={s.name} className="rounded-[24px] bg-white p-4 shadow-[0_8px_22px_rgba(33,15,4,0.10)] ring-1 ring-[#e7d6b8]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-black text-[#210f04]">{s.name}</p>
                    <span className="rounded-full bg-[#210f04] px-3 py-1 text-xs font-black text-white">{s.ratio}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-stone-600">{s.note}</p>
                  {s.suitableFor.length > 0 && (
                    <p className="mt-2 text-xs font-bold text-[#934b00]">{s.suitableFor.join(" · ")}</p>
                  )}
                  <button type="button" onClick={() => onUse(ingredient, s)}
                    className="mt-3 min-h-11 rounded-full bg-[#690500] px-6 text-sm font-black text-white">
                    Use {s.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => onHaveIt(ingredient)}
            className="mt-5 min-h-12 w-full rounded-full border-2 border-[#210f04] px-6 font-black text-[#210f04]">
            I have {ingredient} at home
          </button>
        </div>
      </IonContent>
    </IonModal>
  );
}
