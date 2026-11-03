import { useEffect, useRef, useState } from "react";
import { getSpeechRecognition, parseDictatedItems } from "../lib/dictation";

/** Mic button: speak items ("olive oil and garlic") instead of typing them.
 *  Uses the browser SpeechRecognition API (Chrome/Edge); hides itself where
 *  unsupported so other browsers simply keep the text input. */
export default function DictateButton({ onItems, label = "Dictate" }: { onItems: (items: string[]) => void; label?: string }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => getSpeechRecognition() !== null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* already stopped */ } }, []);
  if (!supported) return null;

  function start() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      const items = parseDictatedItems(transcript);
      if (items.length) onItems(items);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <button type="button" onClick={start} disabled={listening} aria-label={`${label} by voice`}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-6 text-sm font-bold shadow-[0_6px_16px_rgba(33,15,4,0.18)] ${listening ? "bg-[#690500] text-white animate-pulse" : "bg-[#bb6b00] text-[#210f04] hover:bg-[#934b00] hover:text-white"}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm7-3a7 7 0 0 1-13 3.3V13h2v2.3A5 5 0 0 0 13 20v-9h-2v9a5 5 0 0 0 5-4.7V13h2v2.3c-.6-.9-1-2-1-3.3Z" transform="scale(0.95) translate(0 -1)" /><rect x="11" y="19" width="2" height="3" rx="1" /></svg>
      {listening ? "Listening…" : label}
    </button>
  );
}
