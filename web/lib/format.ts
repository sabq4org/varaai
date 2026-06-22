// Arabic-aware formatting helpers, mirroring the iOS app's display logic.
import type { MatchState } from "./types";

const AR = "ar";

/** Short date like "21 يونيو". */
export function formatDayMonth(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(AR, { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/** Weekday + day + month, e.g. "الأحد 21 يونيو". */
export function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(AR, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

/** Kickoff time, e.g. "20:00". */
export function formatTime(iso: string): string {
  try {
    const parts = new Intl.DateTimeFormat(AR, {
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(iso));
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "";
    const period = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
    const time = `${hour}:${minute}`;
    // Keep the day period (ص/م) AFTER the time for visual balance.
    return period ? `${time} ${period}` : time;
  } catch {
    return "";
  }
}

/** YYYY-MM-DD for a Date (used in /date/[date] routes). */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Relative day label: اليوم / أمس / غدًا, else the full date. */
export function relativeDayLabel(date: Date, today = new Date()): string {
  const a = isoDate(date);
  const t = isoDate(today);
  const yest = isoDate(new Date(today.getTime() - 86_400_000));
  const tom = isoDate(new Date(today.getTime() + 86_400_000));
  if (a === t) return "اليوم";
  if (a === yest) return "أمس";
  if (a === tom) return "غدًا";
  return date.toLocaleDateString(AR, { weekday: "long", day: "numeric", month: "long" });
}

export const STATE_LABEL: Record<MatchState, string> = {
  scheduled: "لم تبدأ",
  live: "مباشر",
  finished: "انتهت",
  postponed: "مؤجّلة",
  cancelled: "ملغاة",
};

/** Live minute badge ("45′") or the state label. */
export function matchStatusText(state: MatchState, minute?: number | null): string {
  if (state === "live") return minute != null ? `${minute}′` : "مباشر";
  return STATE_LABEL[state];
}

/** Two-decimal number for xG display. */
export function fmt2(n: number | null | undefined): string {
  return n == null ? "—" : n.toFixed(2);
}

/** Thousands separator for capacities etc. */
export function fmtInt(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString(AR);
}
