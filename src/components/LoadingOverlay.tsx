import { useEffect, useState } from "react";

export const SCAN_MESSAGES = [
  "Please wait while we gather your ingredients…",
  "Contemplating dinner…",
  "Sautéing…",
  "Peeking in the fridge…",
  "Reading your receipt…",
  "Chopping, dicing, thinking…",
  "Warming up the pan…",
  "Sniffing the spice rack…",
  "Tasting and adjusting…",
  "Plating up ideas…",
];

export const GENERATE_MESSAGES = [
  "Please wait while we cook something up…",
  "Writing your recipes…",
  "Balancing the flavours…",
  "Checking what pairs well together…",
  "Borrowing a trick from grandma…",
  "Reducing the sauce…",
  "Seasoning to taste…",
  "Arguing with the chef…",
  "Sharpening the good knife…",
  "Preheating the imagination…",
];

/** Next message index: random, but never the one already showing. */
export function nextMessageIndex(current: number, length: number, roll = Math.random()): number {
  if (length <= 1) return 0;
  const next = Math.floor(roll * (length - 1));
  return next >= current ? next + 1 : next;
}

/**
 * Full-screen dimmed overlay for long waits (scan, generation). The page
 * stays visible underneath through the translucent coffee-bean scrim;
 * the spinner and a message rotating every 10 seconds carry the wait.
 */
export default function LoadingOverlay({ messages = SCAN_MESSAGES, caption = "Scanning your photos…", intervalMs = 10_000 }: {
  messages?: string[];
  caption?: string;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * messages.length));

  useEffect(() => {
    setIndex(Math.floor(Math.random() * messages.length));
    const id = setInterval(() => {
      setIndex((cur) => nextMessageIndex(cur, messages.length));
    }, intervalMs);
    return () => clearInterval(id);
  }, [messages, intervalMs]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#210f04]/60 px-8"
      role="status" aria-live="polite" aria-label={caption}>
      <div aria-hidden="true"
        className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-[#bb6b00]" />
      <p className="mt-6 text-center font-[family-name:var(--font-display)] text-2xl font-black text-white">
        {messages[index]}
      </p>
      <p className="mt-2 text-center text-sm font-semibold text-white/75">
        {caption}
      </p>
    </div>
  );
}
