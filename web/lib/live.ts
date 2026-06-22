import type { MatchPhase } from "./types";

/** Short Arabic label for a live phase (the half / break name). */
export function phaseLabel(phase?: MatchPhase): string | null {
  switch (phase) {
    case "1H":
      return "الشوط الأول";
    case "HT":
      return "بين الشوطين";
    case "2H":
      return "الشوط الثاني";
    case "ET":
      return "الوقت الإضافي";
    case "BREAK":
      return "استراحة";
    case "PEN":
      return "ركلات الترجيح";
    default:
      return null;
  }
}

/** Phases where the clock isn't ticking — show the phase word, not a minute. */
export function isBreakPhase(phase?: MatchPhase): boolean {
  return phase === "HT" || phase === "BREAK" || phase === "PEN";
}

/**
 * Smart live-minute label: stoppage-aware ("45+2′", "90+3′") and break-aware
 * ("بين الشوطين"). `minute` is the locally-ticked absolute minute.
 */
export function liveMinuteLabel(minute: number | null, phase?: MatchPhase): string {
  if (isBreakPhase(phase)) return phaseLabel(phase) ?? "مباشر";
  if (minute == null) return "مباشر";
  const m = minute < 1 ? 1 : minute;
  if (phase === "1H" && m > 45) return `45+${m - 45}′`;
  if (phase === "2H" && m > 90) return `90+${m - 90}′`;
  if (phase === "ET" && m > 120) return `120+${m - 120}′`;
  return `${m}′`;
}
