import { useState } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from "@ionic/react";
import { isSupabaseConfigured, supabase, type User } from "../lib/supabase";

export default function AuthBar({ user, onUser }: { user: User | null; onUser: (u: User | null) => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <p className="rounded-full bg-[#faf0dd] px-4 py-2 text-sm font-semibold text-[#934b00]">
        Saving on this device only
      </p>
    );
  }
  const sb = supabase;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="max-w-[160px] truncate rounded-full bg-[#f6ead6] px-4 py-2 text-sm font-bold text-[#452103]">{user.email}</span>
        <button type="button" className="min-h-11 rounded-full border-2 border-white/70 px-4 text-sm font-bold text-white hover:bg-white hover:text-[#210f04]"
          onClick={async () => { await sb.auth.signOut(); onUser(null); }}>Sign out</button>
      </div>
    );
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setSent(true);
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setMsg(""); }}
        className="min-h-11 rounded-full bg-[#bb6b00] px-6 text-sm font-black text-white shadow-[0_6px_16px_rgba(33,15,4,0.25)] hover:bg-[#934b00]">
        Sign in
      </button>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)} breakpoints={[0, 1]} initialBreakpoint={1}>
        <IonHeader>
          <IonToolbar style={{ "--background": "#690500", "--color": "#ffffff", "--padding-start": "20px", "--padding-end": "12px", "--padding-top": "10px", "--padding-bottom": "10px" } as React.CSSProperties}>
            <IonTitle style={{ fontWeight: 900 }}>Sign in</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setOpen(false)} style={{ "--color": "#ffffff", "--padding-start": "18px", "--padding-end": "18px", fontWeight: 800 } as React.CSSProperties}>Done</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="mx-auto max-w-md px-5 pb-12 pt-6">
            <p className="font-[family-name:var(--font-display)] text-[26px] font-black leading-tight text-[#210f04]">Save recipes everywhere</p>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-stone-600">
              Enter your email and we will send you a magic sign-in link. No password to remember. Your pantry and saved recipes will follow you between devices.
            </p>

            {sent ? (
              <div className="mt-6 rounded-[24px] bg-[#faf0dd] p-5 text-center ring-1 ring-[#e7d6b8]" role="status">
                <p className="font-black text-[#210f04]">Check your inbox</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-stone-600">
                  We sent a sign-in link to <strong className="text-[#210f04]">{email.trim()}</strong>. Tap it on this device to finish signing in, then you can close this sheet.
                </p>
                <button type="button" onClick={() => { setSent(false); setMsg(""); }}
                  className="mt-4 min-h-11 rounded-full bg-white px-6 text-sm font-black text-[#690500] ring-1 ring-[#e7d6b8]">
                  Use a different email
                </button>
              </div>
            ) : (
              <form className="mt-6" onSubmit={sendLink}>
                <label className="block text-sm font-black text-[#210f04]" htmlFor="magic-email">Email address</label>
                <input id="magic-email" type="email" required autoComplete="email" inputMode="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="mt-2 min-h-14 w-full rounded-full border-2 border-stone-300 px-5 text-base font-medium focus:border-[#690500] focus:outline-none" />
                {msg && (
                  <p className="mt-3 rounded-2xl bg-[#f9e7d7] px-4 py-3 text-sm font-bold text-[#690500]" role="alert">{msg}</p>
                )}
                <button type="submit" disabled={busy || !email.trim()}
                  className="mt-4 min-h-14 w-full rounded-full bg-[#690500] text-base font-black text-white shadow-[0_10px_24px_rgba(105,5,0,0.30)] hover:bg-[#452103] disabled:opacity-40 disabled:shadow-none">
                  {busy ? "Sending link…" : "Email me a sign-in link"}
                </button>
                <p className="mt-3 text-center text-xs font-medium leading-relaxed text-stone-500">
                  First time? The same link creates your account.
                </p>
              </form>
            )}
          </div>
        </IonContent>
      </IonModal>
    </>
  );
}
