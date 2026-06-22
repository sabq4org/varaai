import type { MatchEvent } from "./types";

// Edge sends English keyword details that the client maps to Arabic
// (mirrors the iOS MatchDetail event localization).
const DETAIL_AR: Record<string, string> = {
  "Own Goal": "هدف عكسي",
  "Penalty Goal": "هدف من ركلة جزاء",
  "Missed Penalty": "ركلة جزاء ضائعة",
  "Yellow Card": "بطاقة صفراء",
  "Red Card": "بطاقة حمراء",
  Substitution: "تبديل",
};

// Common card/foul reasons (Sportmonks `info`) mapped to Arabic.
const REASON_AR: Record<string, string> = {
  Foul: "مخالفة",
  Argument: "اعتراض",
  "Time wasting": "تضييع وقت",
  "Rough play": "لعب خشن",
  "Professional foul": "خطأ متعمّد",
  "Persistent fouling": "أخطاء متكرّرة",
  Handball: "لمسة يد",
  Diving: "خداع/غطس",
  Dissent: "احتجاج",
  Unsporting: "سلوك غير رياضي",
  "Unsporting behaviour": "سلوك غير رياضي",
};

export function localizeReason(reason?: string): string | null {
  if (!reason) return null;
  return REASON_AR[reason] ?? null;
}

export function localizeEventDetail(e: MatchEvent): string {
  if (e.isVar) {
    const d = e.detail.toLowerCase();
    if (d.includes("disallow")) return "هدف ملغى (VAR)";
    if (d.includes("penalt")) return "ركلة جزاء (VAR)";
    const rest = e.detail.replace(/^VAR\s*/i, "").trim();
    return rest ? `مراجعة فيديو — ${rest}` : "مراجعة فيديو (VAR)";
  }
  if (DETAIL_AR[e.detail]) return DETAIL_AR[e.detail];
  if (e.type === "subst") return "تبديل";
  if (e.type === "goal") return "هدف";
  return e.detail;
}

export type EventGlyph = "goal" | "yellow" | "red" | "subst" | "var" | "other";

export function eventGlyph(e: MatchEvent): EventGlyph {
  if (e.isVar || e.type === "var") return "var";
  if (e.type === "goal") return "goal";
  if (e.type === "subst") return "subst";
  if (e.type === "card") return /red/i.test(e.detail) ? "red" : "yellow";
  return "other";
}

/** Full minute label, e.g. "45+2'". */
export function eventMinute(e: MatchEvent): string {
  const base = e.minute ?? 0;
  return e.extraMinute ? `${base}+${e.extraMinute}'` : `${base}'`;
}
