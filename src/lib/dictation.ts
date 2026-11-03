/** Turn a dictated phrase ("olive oil, garlic and smoked paprika") into items. */
export function parseDictatedItems(transcript: string): string[] {
  return transcript
    .replace(/[.!?]+$/g, "")
    .split(/,|;|\band\b|\bplus\b|&/i)
    .map((s) => s.trim().replace(/\b(add|i have|we have|i've got)\b/gi, "").trim())
    .filter((s) => s.length > 1)
    .map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase()));
}

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function getSpeechRecognition(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as new () => RecognitionLike) ?? (w.webkitSpeechRecognition as new () => RecognitionLike) ?? null;
}

export const dictationSupported = () => getSpeechRecognition() !== null;
