/**
 * Speech-recognition homophones and near-misses in a kitchen context.
 * "Flour" is the classic: recognisers hear "flower". Word boundaries keep
 * "cauliflower" safe. Applied before the transcript is split into items.
 */
const CORRECTIONS: [RegExp, string][] = [
  [/\bflowers?\b/gi, "flour"],
  [/\bpowered sugar\b/gi, "powdered sugar"],
  [/\bbaking powered\b/gi, "baking powder"],
  [/\bcorn starch\b/gi, "cornstarch"],
  [/\bself raising\b/gi, "self-raising"],
  [/\bgarlic powered\b/gi, "garlic powder"],
  [/\bonion powered\b/gi, "onion powder"],
];

export function correctDictation(text: string): string {
  return CORRECTIONS.reduce((t, [re, fix]) => t.replace(re, fix), text);
}

/** Turn a dictated phrase ("olive oil, garlic and smoked paprika") into items. */
export function parseDictatedItems(transcript: string): string[] {
  return correctDictation(transcript)
    .replace(/[.!?]+$/g, "")
    .split(/,|;|\band\b|\bplus\b|&/i)
    .map((s) => s.trim().replace(/\b(add|i have|we have|i've got)\b/gi, "").trim())
    .filter((s) => s.length > 1)
    .map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase()));
}

export type SpeechResultLike = { isFinal: boolean; 0: { transcript: string } };
export type SpeechEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
};
export type SpeechErrorLike = { error?: string };

export type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechErrorLike) => void) | null;
};

export function getSpeechRecognition(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as new () => RecognitionLike) ?? (w.webkitSpeechRecognition as new () => RecognitionLike) ?? null;
}
