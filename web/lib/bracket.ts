// Helpers for rendering knockout brackets (shared by the home teaser + the
// dedicated bracket page).

const ORD: Record<string, string> = {
  "1st": "الأول",
  "2nd": "الثاني",
  "3rd": "الثالث",
  "4th": "الرابع",
};

/** Localize Sportmonks seed placeholders:
 *  "2nd Group A" → "الثاني · المجموعة A"
 *  "Winner Match 76" → "الفائز · مباراة 76"
 *  "Loser Match 76" → "الخاسر · مباراة 76" */
export function seedName(name: string): string {
  const g = name.match(/^(\d(?:st|nd|rd|th))\s+Group\s+(.+)$/i);
  if (g) {
    const ord = ORD[g[1].toLowerCase()] ?? g[1];
    return `${ord} · المجموعة ${g[2]}`;
  }
  const w = name.match(/^Winner\s+Match\s+(\d+)$/i);
  if (w) return `الفائز · مباراة ${w[1]}`;
  const l = name.match(/^Loser\s+Match\s+(\d+)$/i);
  if (l) return `الخاسر · مباراة ${l[1]}`;
  return name;
}

/** Has this side resolved to a real qualified nation (vs. a "1st Group A" seed)? */
export function isResolved(name: string): boolean {
  return !/Group|Winner|Loser|\//i.test(name);
}
