/** Loose key so "Olive Oil", "olive oil" and "Olive Oils" compare equal. */
export function normalizeKey(raw: string): string {
  let n = raw.toLowerCase().trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (n.endsWith("oes")) n = n.slice(0, -2);
  else if (n.endsWith("ies") && n.length > 3) n = n.slice(0, -3) + "y";
  else if (n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("us")) n = n.slice(0, -1);
  return n;
}
