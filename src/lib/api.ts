/** API origin. Empty on the web (same-origin / Vite proxy); set
 *  VITE_API_BASE_URL when the UI runs somewhere else — e.g. inside a
 *  Capacitor shell, where the app is served from capacitor://localhost
 *  and "/api" would not reach the Hono server. */
const base = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${base}${path}`;
}
