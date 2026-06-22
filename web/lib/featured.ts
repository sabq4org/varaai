import type { Match, Standings } from "./types";

/**
 * The marquee event the homepage leads with. Right now that's the FIFA World
 * Cup 2026 (live June–July 2026). Change this when the headline event changes —
 * the homepage hero + sections follow it.
 */
export const FEATURED = {
  competitionId: "732",
  name: "كأس العالم",
} as const;

/** Does this competition use the cup/tournament model (groups + knockout) rather
 * than a flat league table? Right now that's the featured World Cup. */
export function isCupModel(competitionId: string): boolean {
  return competitionId === FEATURED.competitionId;
}

/** Genuinely in-play matches (the live endpoint can briefly include just-finished ones). */
export function trulyLive(live: Match[]): Match[] {
  return live.filter((m) => m.state === "live");
}

/** Max minutes a football match realistically runs (90 + stoppage + half-time). */
const MATCH_WINDOW_MIN = 150;

/**
 * Matches that have kicked off but the provider hasn't flagged "live" yet — a
 * scheduled fixture whose kickoff is in the past but within a match window.
 * Without this, a just-started match vanishes from the hero and a future match
 * wrongly takes its place. Most-recent kickoff first.
 */
export function kickedOff(matches: Match[], nowMs: number = Date.now()): Match[] {
  const seen = new Set<string>();
  return matches
    .filter((m) => {
      if (m.id && seen.has(m.id)) return false;
      if (m.state !== "scheduled") return false;
      const t = new Date(m.startTime).getTime();
      if (!(t <= nowMs && nowMs - t < MATCH_WINDOW_MIN * 60_000)) return false;
      if (m.id) seen.add(m.id);
      return true;
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
}

/**
 * Genuinely upcoming matches — scheduled AND kicking off in the future, soonest
 * first. A scheduled match whose kickoff already passed is stale/delayed data;
 * we skip it for the hero (it still shows in the day's list) so the countdown is
 * always meaningful and never reads "على وشك البداية" for a stale fixture.
 */
export function upcoming(next: Match[], nowMs: number = Date.now()): Match[] {
  return next
    .filter((m) => m.state === "scheduled" && new Date(m.startTime).getTime() > nowMs)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Pick the hero match, in priority order:
 *  1. a genuinely live match,
 *  2. a match that just kicked off (provider lag — still in play),
 *  3. the soonest genuine upcoming match.
 * Never a finished match — a finished match must drop out of the hero.
 */
export function pickHeroMatch(live: Match[], next: Match[]): Match | null {
  return trulyLive(live)[0] ?? kickedOff([...live, ...next])[0] ?? upcoming(next)[0] ?? null;
}

/** True when a match has kicked off but isn't reporting "live" yet. */
export function isInProgress(m: Match, nowMs: number = Date.now()): boolean {
  if (m.state !== "scheduled") return false;
  const t = new Date(m.startTime).getTime();
  return t <= nowMs && nowMs - t < MATCH_WINDOW_MIN * 60_000;
}

/** Map team id → group label (e.g. "المجموعة A") from grouped standings. */
export function teamGroupMap(standings: Standings): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of standings.rows) {
    if (r.group) map.set(r.team.id, r.group);
  }
  return map;
}

export function groupForMatch(m: Match, map: Map<string, string>): string | undefined {
  return map.get(m.home.team.id) ?? map.get(m.away.team.id);
}
