import { useEffect, useRef, useState } from "react";
import { getSpeechRecognition, parseDictatedItems, type RecognitionLike } from "../lib/dictation";

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm7-3a7 7 0 0 1-13 3.3V13h2v2.3A5 5 0 0 0 13 20v-9h-2v9a5 5 0 0 0 5-4.7V13h2v2.3c-.6-.9-1-2-1-3.3Z" transform="scale(0.95) translate(0 -1)" /><rect x="11" y="19" width="2" height="3" rx="1" /></svg>
  );
}

/**
 * Toggle mic: tap to start, keep talking, tap to stop. Every finished
 * phrase is added as it lands, so "flour … sugar … olive oil" adds three
 * items in one session. Always renders — where the browser has no speech
 * recognition (common on phones), tapping explains instead of silently
 * doing nothing, and the keyboard mic in the text field still works.
 */
export default function DictateButton({ onItems, label = "Dictate", iconOnly = false }: {
  onItems: (items: string[]) => void;
  label?: string;
  iconOnly?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const [heard, setHeard] = useState("");
  const supported = getSpeechRecognition() !== null;
  const recRef = useRef<RecognitionLike | null>(null);
  const activeRef = useRef(false);

  useEffect(() => () => {
    activeRef.current = false;
    try { recRef.current?.stop(); } catch { /* already stopped */ }
  }, []);

  function stop() {
    activeRef.current = false;
    setListening(false);
    try { recRef.current?.stop(); } catch { /* already stopped */ }
  }

  function start() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setNotice("Voice input is not available in this browser. Try Chrome, or tap the text box and use your keyboard's microphone button.");
      return;
    }
    setNotice(""); setHeard("");
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const items = parseDictatedItems(text);
          if (items.length) onItems(items);
          setHeard(text.trim());
        } else {
          interim += text;
        }
      }
      if (interim) setHeard(interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        activeRef.current = false;
        setListening(false);
        setNotice("Microphone is blocked. Allow mic access for this site (the page must be on HTTPS), or use your keyboard's microphone in the text box.");
      }
      // "no-speech" / "aborted" fall through: onend restarts while active.
    };
    rec.onend = () => {
      // Browsers stop after a pause even in continuous mode; restart so
      // one tap really does keep listening until the user taps stop.
      if (activeRef.current) {
        try { rec.start(); } catch { /* already running */ }
      } else {
        setListening(false);
      }
    };
    activeRef.current = true;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={listening ? stop : start} aria-label={listening ? "Stop dictating" : `${label} by voice`} aria-pressed={listening}
        className={iconOnly
          ? `flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_6px_16px_rgba(33,15,4,0.18)] ${listening ? "bg-[#690500] text-white animate-pulse" : "bg-[#bb6b00] text-[#210f04]"}`
          : `inline-flex min-h-11 items-center gap-1.5 rounded-full px-6 text-sm font-bold shadow-[0_6px_16px_rgba(33,15,4,0.18)] ${listening ? "bg-[#690500] text-white animate-pulse" : "bg-[#bb6b00] text-[#210f04] hover:bg-[#934b00] hover:text-white"}`}>
        <MicIcon />
        {!iconOnly && (listening ? "Tap to stop" : label)}
      </button>
      {listening && (
        <span className="max-w-[260px] text-xs font-semibold text-[#690500]" role="status">
          Listening… say items one after another.{heard ? ` Heard: “${heard}”` : ""}
        </span>
      )}
      {!supported && notice && (
        <span className="max-w-[260px] text-xs font-semibold text-[#690500]" role="status">{notice}</span>
      )}
      {supported && notice && !listening && (
        <span className="max-w-[260px] text-xs font-semibold text-[#690500]" role="alert">{notice}</span>
      )}
    </span>
  );
}
