import OpenAI from "openai";

export type MetaEnv = {
  MODEL_API_KEY?: string;
  META_API_BASE_URL?: string;
  // Legacy names from the first draft's .env template; accepted as fallbacks.
  SAM_API_KEY?: string;
  MUSE_API_KEY?: string;
  SAM_API_URL?: string;
  MUSE_API_URL?: string;
};

export function metaApiKey(env: MetaEnv): string | undefined {
  return env.MODEL_API_KEY || env.SAM_API_KEY || env.MUSE_API_KEY || undefined;
}

export function metaBaseUrl(env: MetaEnv): string {
  return env.META_API_BASE_URL || env.SAM_API_URL || env.MUSE_API_URL || META_BASE_URL;
}

export const META_BASE_URL = "https://api.meta.ai/v1";
export const SAM_MODEL = "sam-3.1";
export const MUSE_MODEL = "muse-spark-1.3";

/** Single Meta key for both models; the model name selects SAM vs Muse. */
export function metaClient(env: MetaEnv): OpenAI | null {
  const apiKey = metaApiKey(env);
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: metaBaseUrl(env) });
}

/** Pull the text out of a Responses API result, whatever shape it arrives in. */
export function responseText(res: unknown): string {
  const r = res as { output_text?: string; output?: unknown[] };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  let text = "";
  for (const item of r.output ?? []) {
    const content = (item as { content?: unknown[] }).content ?? [];
    for (const part of content) {
      const p = part as { text?: string; output_text?: string };
      text += p.text ?? p.output_text ?? "";
    }
  }
  return text;
}

/** Extract a JSON value from model text that may be fenced or padded with prose. */
export function extractJson(text: string): unknown | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  for (const candidate of [cleaned, cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1), cleaned.slice(cleaned.indexOf("["), cleaned.lastIndexOf("]") + 1)]) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch { /* try next */ }
  }
  return null;
}
