import { config } from "../config.ts";
import { localizeCompetitionName } from "../data/competitionNames.ts";
import { localizeCountry, localizePosition } from "../data/labels.ts";
import { localizeCoach, localizePlayer } from "../data/playerNames.ts";
import { localizeTeamByName } from "../data/teamNames.ts";
import type {
  BracketStage,
  CompetitionSummary,
  Lineup,
  LineupPlayer,
  Match,
  MatchDayGroup,
  MatchDetail,
  MatchEvent,
  MatchEventType,
  MatchPhase,
  MatchSide,
  MatchState,
  MomentumPoint,
  PeriodScore,
  MatchStat,
  PlayerCareerTotals,
  PlayerProfile,
  PlayerRecentMatch,
  PlayerRef,
  PlayerSeasonRow,
  PlayerStatItem,
  PlayerTrophy,
  RefereeProfile,
  RefereeRecentMatch,
  RefereeStatItem,
  ScorerMetric,
  SportsProvider,
  SquadPlayer,
  Standings,
  StandingRow,
  Team,
  TeamFixtures,
  TeamPair,
  TeamProfile,
  TeamSchedule,
  TeamScheduleEntry,
  TeamSquad,
  TopScorer,
} from "../types.ts";

// ——— Sportmonks state → VARA state ———
const LIVE = new Set([
  "INPLAY_1ST_HALF", "INPLAY_2ND_HALF", "HT", "BREAK", "EXTRA_TIME",
  "EXTRA_TIME_BREAK", "INPLAY_ET", "INPLAY_ET_2ND_HALF", "PEN_BREAK",
  "INPLAY_PENALTIES", "INTERRUPTED", "AWAITING_UPDATES", "SUSPENDED",
]);
const FINISHED = new Set(["FT", "AET", "FT_PEN", "AWARDED", "WO"]);
const POSTPONED = new Set(["POSTPONED", "TBA", "PENDING", "DELAYED"]);
const CANCELLED = new Set(["CANCELLED", "ABANDONED", "DELETED"]);

// Some endpoints (e.g. /schedules/teams/:id) return only the numeric `state_id`
// without the nested `state` object. Map the common ids back to developer names
// so `toMatch` can classify each fixture.
const STATE_DEV_BY_ID: Record<number, string> = {
  1: "NS",
  2: "INPLAY_1ST_HALF",
  3: "HT",
  4: "BREAK",
  5: "FT",
  6: "EXTRA_TIME",
  7: "AET",
  8: "FT_PEN",
  9: "INPLAY_PENALTIES",
  10: "BREAK",
  11: "POSTPONED",
  12: "SUSPENDED",
  13: "CANCELLED",
  14: "TBA",
  15: "WO",
  16: "ABANDONED",
  17: "DELAYED",
  18: "AWARDED",
  19: "DELETED",
  20: "EXTRA_TIME_BREAK",
  21: "PEN_BREAK",
  22: "INPLAY_2ND_HALF",
  23: "INPLAY_ET",
  25: "INPLAY_ET_2ND_HALF",
  26: "AWAITING_UPDATES",
  27: "INTERRUPTED",
};

// Saudi domestic competition IDs (used to label country); others stay generic.
const SAUDI_LEAGUES = new Set(["944", "947", "2540", "950", "953", "1557", "1678", "3268", "3225", "1782", "3569"]);
function countryFor(competitionId: string): string | undefined {
  if (SAUDI_LEAGUES.has(competitionId)) return "Saudi Arabia";
  if (competitionId === "1085" || competitionId === "1088") return "Asia";
  if (competitionId === "732") return "International";
  return undefined;
}

function mapState(dev: string): MatchState {
  if (LIVE.has(dev)) return "live";
  if (FINISHED.has(dev)) return "finished";
  if (POSTPONED.has(dev)) return "postponed";
  if (CANCELLED.has(dev)) return "cancelled";
  return "scheduled";
}

// Live phase from the Sportmonks state developer name (only when in play).
function mapPhase(dev: string): MatchPhase | undefined {
  switch (dev) {
    case "INPLAY_1ST_HALF":
      return "1H";
    case "HT":
      return "HT";
    case "INPLAY_2ND_HALF":
      return "2H";
    case "EXTRA_TIME":
    case "INPLAY_ET":
    case "INPLAY_ET_2ND_HALF":
    case "EXTRA_TIME_BREAK":
      return "ET";
    case "PEN_BREAK":
    case "INPLAY_PENALTIES":
      return "PEN";
    case "BREAK":
      return "BREAK";
    default:
      return undefined;
  }
}

// ——— Curated stats (Sportmonks type name → Arabic label), in display order ———
const STAT_DEFS: { key: string; label: string; percent?: boolean }[] = [
  { key: "Expected Goals (xG)", label: "الأهداف المتوقّعة (xG)" },
  { key: "Ball Possession %", label: "الاستحواذ", percent: true },
  { key: "Shots Total", label: "إجمالي التسديدات" },
  { key: "Shots On Target", label: "على المرمى" },
  { key: "Big Chances Created", label: "فرص خطيرة" },
  { key: "Key Passes", label: "تمريرات مفتاحية" },
  { key: "Successful Passes Percentage", label: "دقّة التمرير", percent: true },
  { key: "Corners", label: "الركلات الركنية" },
  { key: "Fouls", label: "الأخطاء" },
  { key: "Offsides", label: "التسلل" },
  { key: "Yellowcards", label: "البطاقات الصفراء" },
  { key: "Saves", label: "تصدّيات الحارس" },
];

// Localize a standings group/pool name (e.g. "Group A" → "المجموعة A", "West" → "غرب").
function localizeGroup(name?: string | null): string | undefined {
  if (!name) return undefined;
  const m = name.match(/group\s+([A-Z0-9]+)/i);
  if (m) return `المجموعة ${m[1].toUpperCase()}`;
  const direct: Record<string, string> = {
    west: "غرب", east: "شرق", north: "شمال", south: "جنوب",
  };
  return direct[name.trim().toLowerCase()] ?? name;
}

// Knockout stage name → Arabic, with a display order (group stage excluded).
const STAGE_LABELS: Record<string, { ar: string; order: number }> = {
  "round of 32": { ar: "دور الـ32", order: 1 },
  "round of 16": { ar: "دور الـ16", order: 2 },
  "quarter-finals": { ar: "ربع النهائي", order: 3 },
  "quarter finals": { ar: "ربع النهائي", order: 3 },
  "semi-finals": { ar: "نصف النهائي", order: 4 },
  "semi finals": { ar: "نصف النهائي", order: 4 },
  "3rd place final": { ar: "تحديد المركز الثالث", order: 5 },
  final: { ar: "النهائي", order: 6 },
};
function stageInfo(name?: string | null): { ar: string; order: number } {
  if (!name) return { ar: "—", order: 9 };
  return STAGE_LABELS[name.trim().toLowerCase()] ?? { ar: name, order: 8 };
}

// Sportmonks lineup position_id → short Arabic role.
const POSITIONS: Record<number, string> = {
  24: "حارس",
  25: "دفاع",
  26: "وسط",
  27: "هجوم",
};

async function call<T>(path: string, includes?: string, extra?: Record<string, string>): Promise<T> {
  const url = new URL(config.sportmonks.baseUrl + path);
  url.searchParams.set("api_token", config.sportmonks.token);
  if (includes) url.searchParams.set("include", includes);
  for (const [k, v] of Object.entries(extra ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = (await res.json()) as { data?: T; message?: string };
  if (!res.ok || json.message) {
    throw new Error(`Sportmonks ${path} -> HTTP ${res.status}${json.message ? `: ${json.message}` : ""}`);
  }
  return json.data as T;
}

function toTeam(p: { id: number; name: string; image_path?: string }): Team {
  const localized = localizeTeamByName(p.name);
  return { id: String(p.id), name: localized.name, shortName: localized.short, logo: p.image_path };
}

// Live minute from the currently-ticking period (null when not in play).
// Absolute match-minute offset where each period begins.
const PERIOD_BASE: Record<number, number> = { 1: 0, 2: 45, 3: 90, 4: 105 };

// Real-time clock for the ticking period. We compute the minute from the period's
// `started` timestamp (not the discrete `minutes` snapshot, which lags by up to a
// minute) and also hand the client `startedAt`/`base` so it can tick locally each
// second — eliminating any caching/polling delay.
function liveClock(fx: any): { minute: number | null; startedAt: number | null; base: number | null } {
  const ticking = (fx.periods ?? []).find((p: any) => p.ticking);
  if (!ticking) return { minute: null, startedAt: null, base: null };
  const base = PERIOD_BASE[ticking.type_id] ?? 0;
  if (typeof ticking.started === "number") {
    const elapsed = Math.max(0, Math.floor((Date.now() / 1000 - ticking.started) / 60));
    return { minute: base + elapsed, startedAt: ticking.started, base };
  }
  return { minute: ticking.minutes ?? null, startedAt: null, base };
}

function isoTime(fx: { starting_at?: string; starting_at_timestamp?: number }): string {
  if (fx.starting_at_timestamp) return new Date(fx.starting_at_timestamp * 1000).toISOString();
  // "2026-05-21 18:00:00" is UTC in Sportmonks.
  return fx.starting_at ? fx.starting_at.replace(" ", "T") + "Z" : new Date().toISOString();
}

// Kickoff time in epoch milliseconds (null if unknown).
function fixtureStartMs(fx: { starting_at?: string; starting_at_timestamp?: number }): number | null {
  if (fx.starting_at_timestamp) return fx.starting_at_timestamp * 1000;
  if (fx.starting_at) return Date.parse(fx.starting_at.replace(" ", "T") + "Z");
  return null;
}

function sides(participants: any[]): { home?: any; away?: any } {
  const out: { home?: any; away?: any } = {};
  for (const p of participants ?? []) {
    const loc = p.meta?.location;
    if (loc === "home") out.home = p;
    else if (loc === "away") out.away = p;
  }
  return out;
}

// Final score from the "CURRENT" score rows (running score = final for finished matches).
function currentScores(scores: any[]): { home: number | null; away: number | null } {
  let home: number | null = null;
  let away: number | null = null;
  for (const s of scores ?? []) {
    if (s.description !== "CURRENT") continue;
    if (s.score?.participant === "home") home = s.score.goals ?? home;
    else if (s.score?.participant === "away") away = s.score.goals ?? away;
  }
  return { home, away };
}

function toMatch(fx: any, competitionId: string): Match {
  const { home, away } = sides(fx.participants);
  const sc = currentScores(fx.scores);
  const clock = liveClock(fx);
  const dev = fx.state?.developer_name ?? fx.state?.short_name ?? "";
  const state = mapState(dev);
  return {
    id: String(fx.id),
    competitionId,
    sport: "football",
    state,
    phase: state === "live" ? mapPhase(dev) : undefined,
    minute: clock.minute,
    liveStartedAt: clock.startedAt,
    liveBase: clock.base,
    startTime: isoTime(fx),
    round: fx.round?.name ? String(fx.round.name) : undefined,
    venue: fx.venue?.name ?? undefined,
    home: { team: toTeam(home ?? { id: 0, name: "?" }), score: sc.home } satisfies MatchSide,
    away: { team: toTeam(away ?? { id: 0, name: "?" }), score: sc.away } satisfies MatchSide,
  };
}

// Resolve the season to display: the current season if it has started, else the
// most-recently-finished one (so the prototype always shows real data off-season).
async function resolveSeasonId(competitionId: string): Promise<number> {
  const league = await call<any>(`/leagues/${competitionId}`, "seasons");
  const seasons: any[] = league.seasons ?? [];
  if (!seasons.length) throw new Error(`No seasons for league ${competitionId}`);
  const today = new Date().toISOString().slice(0, 10);
  const current = seasons.find((s) => s.is_current);
  if (current && !current.pending && (current.starting_at ?? "9999") <= today) {
    return current.id;
  }
  const finished = seasons
    .filter((s) => s.finished || (s.ending_at ?? "0000") < today)
    .sort((a, b) => (a.ending_at ?? "").localeCompare(b.ending_at ?? ""));
  return (finished.at(-1) ?? seasons.sort((a, b) => a.id - b.id).at(-1)).id;
}

export const sportmonks: SportsProvider = {
  name: "sportmonks",

  async getStandings(competitionId, season): Promise<Standings> {
    const seasonId = season ?? (await resolveSeasonId(competitionId));
    const rowsRaw = await call<any[]>(
      `/standings/seasons/${seasonId}`,
      "participant;details.type;form;group",
    );
    const detail = (r: any, typeName: string): number => {
      const d = (r.details ?? []).find((x: any) => x.type?.name === typeName);
      return Number(d?.value ?? 0);
    };
    const rows: StandingRow[] = rowsRaw
      .map((r): StandingRow => {
        const form = (r.form ?? [])
          .slice()
          .sort((a: any, b: any) => (b.sort_order ?? 0) - (a.sort_order ?? 0))
          .slice(0, 6)
          .map((f: any) => f.form)
          .join("");
        return {
          rank: r.position,
          team: toTeam(r.participant ?? { id: r.participant_id, name: "?" }),
          played: detail(r, "Overall Matches Played"),
          win: detail(r, "Overall Won"),
          draw: detail(r, "Overall Draw"),
          lose: detail(r, "Overall Lost"),
          goalsFor: detail(r, "Overal Goals Scored"),
          goalsAgainst: detail(r, "Overall Goals Conceded"),
          goalsDiff: detail(r, "Goal Difference"),
          points: r.points ?? detail(r, "Overall Points"),
          form: form || undefined,
          group: localizeGroup(r.group?.name),
        };
      })
      // Group standings: order by group name, then position within the group.
      .sort((a, b) =>
        (a.group ?? "").localeCompare(b.group ?? "", "ar") || a.rank - b.rank,
      );

    const grouped = new Set(rows.map((r) => r.group).filter(Boolean)).size > 1;

    return {
      competition: {
        id: competitionId,
        sport: "football",
        name: localizeCompetitionName(competitionId, "دوري روشن السعودي").name,
        country: countryFor(competitionId),
        season: seasonId,
      },
      rows,
      grouped,
    };
  },

  async getFixtures({ competitionId, season, last, next, live }): Promise<Match[]> {
    if (live) {
      const inplay = await call<any[]>("/livescores/inplay", "participants;scores;state;round;periods");
      return inplay
        .filter((fx) => String(fx.league_id) === competitionId)
        .map((fx) => toMatch(fx, competitionId));
    }
    const seasonId = season ?? (await resolveSeasonId(competitionId));
    const seasonData = await call<any>(
      `/seasons/${seasonId}`,
      "fixtures.participants;fixtures.scores;fixtures.state;fixtures.round",
    );
    const fixtures: any[] = (seasonData.fixtures ?? [])
      .map((fx: any) => toMatch(fx, competitionId))
      .sort((a: Match, b: Match) => a.startTime.localeCompare(b.startTime));

    if (next) {
      return fixtures.filter((m) => m.state === "scheduled").slice(0, next);
    }
    // Default + `last`: most recent finished matches first.
    const played = fixtures.filter((m) => m.state === "finished" || m.state === "live").reverse();
    return played.slice(0, last ?? 10);
  },

  async getMatchDetail(matchId): Promise<MatchDetail> {
    // xGFixture (post-match add-on) is a superset of statistics + xG types.
    // Fall back to plain statistics if the add-on is unavailable for a fixture.
    const fx = await call<any>(
      `/fixtures/${matchId}`,
      "participants;scores;state;round;league;periods;events.type;lineups.details;lineups.player;statistics.type;xGFixture.type;pressure;coaches;referees.referee",
    );
    const competitionId = String(fx.league_id);
    const { home, away } = sides(fx.participants);
    const homeId = home ? String(home.id) : "";
    const sideOf = (participantId: number | string) =>
      String(participantId) === homeId ? "home" : "away";

    const match = toMatch(fx, competitionId);

    const events: MatchEvent[] = (fx.events ?? [])
      .slice()
      .sort((a: any, b: any) => (a.minute ?? 0) - (b.minute ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((e: any): MatchEvent => {
        const typeName = String(e.type?.name ?? "");
        const { type, isVar } = mapEventType(typeName);
        const detail = buildDetail(typeName, e.info, e.addition);
        const related = e.related_player_name
          ? localizePlayer(e.related_player_id, e.related_player_name)
          : undefined;
        const isSub = type === "subst";
        return {
          minute: e.minute ?? 0,
          extraMinute: e.extra_minute ?? null,
          side: sideOf(e.participant_id),
          type,
          detail,
          // Substitution: player_name = coming on, related_player_name = going off.
          player: e.player_name ? localizePlayer(e.player_id, e.player_name) : undefined,
          assist: isSub ? undefined : related,
          playerOut: isSub ? related : undefined,
          reason: type === "card" && e.info ? String(e.info) : undefined,
          isVar,
        };
      });

    // xGFixture is a superset (stats + xG); prefer it, else fall back to statistics.
    const statsSource: any[] = (fx.xgfixture?.length ? fx.xgfixture : fx.statistics) ?? [];
    const stats = buildStats(statsSource);
    const lineups = buildLineups(fx.lineups ?? [], fx.coaches ?? [], homeId);
    const xg = pickPair(statsSource, "Expected Goals (xG)");
    const pressure = aggregatePressure(fx.pressure ?? [], homeId);
    const momentum = buildMomentum(fx.pressure ?? [], homeId);
    const periodScores = buildPeriodScores(fx.scores ?? [], homeId, match);

    return {
      match,
      competitionName: localizeCompetitionName(competitionId, fx.league?.name ?? "").name,
      events,
      stats,
      lineups,
      xg,
      pressure,
      momentum,
      periodScores,
      referee: pickReferee(fx.referees ?? []),
    };
  },

  // ——— Catalog features ———

  async getCompetitions(): Promise<CompetitionSummary[]> {
    const leagues = await call<any[]>("/leagues", "currentSeason", { per_page: "100" });
    const order = ["944", "732", "1085", "1088", "947", "2540", "950", "953", "1557", "1678", "3268", "3225"];
    return leagues
      .map((l): CompetitionSummary => {
        const loc = localizeCompetitionName(String(l.id), l.name);
        return {
          id: String(l.id),
          sport: "football",
          name: loc.name,
          shortName: loc.short,
          country: countryFor(String(l.id)),
          logo: l.image_path,
          currentSeason: l.currentseason?.name ?? l.currentseason?.id,
        };
      })
      .sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });
  },

  async getMatchesByDate(date: string): Promise<MatchDayGroup[]> {
    const fixtures = await call<any[]>(
      `/fixtures/date/${date}`,
      "participants;scores;state;round;league;periods",
      { per_page: "100" },
    );
    return groupByCompetition(fixtures);
  },

  // "Today" by local-day kickoff window. A local day can straddle two UTC
  // calendar dates (e.g. a 01:00 +03 kickoff is the previous UTC date), so we
  // fetch the UTC range that covers the window and filter by exact timestamp.
  async getMatchesToday(startMs: number, endMs: number): Promise<MatchDayGroup[]> {
    const startDate = new Date(startMs).toISOString().slice(0, 10);
    const endDate = new Date(endMs - 1).toISOString().slice(0, 10);
    const path =
      startDate === endDate
        ? `/fixtures/date/${startDate}`
        : `/fixtures/between/${startDate}/${endDate}`;
    const fixtures = await call<any[]>(
      path,
      "participants;scores;state;round;league;periods",
      { per_page: "100" },
    );
    const inWindow = (fixtures ?? []).filter((fx) => {
      const ms = fixtureStartMs(fx);
      return ms != null && ms >= startMs && ms < endMs;
    });
    return groupByCompetition(inWindow);
  },

  async getLiveMatches(): Promise<MatchDayGroup[]> {
    const fixtures = await call<any[]>(
      "/livescores/inplay",
      "participants;scores;state;round;league;periods",
      { per_page: "100" },
    );
    return groupByCompetition(fixtures);
  },

  async getCompetitionMatchDay(competitionId: string, date: string): Promise<Match[]> {
    const fixtures = await call<any[]>(
      `/fixtures/date/${date}`,
      "participants;scores;state;round;periods",
      { per_page: "100" },
    );
    return fixtures
      .filter((fx) => String(fx.league_id) === competitionId)
      .map((fx) => toMatch(fx, competitionId))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  async getBracket(competitionId: string, season): Promise<BracketStage[]> {
    const seasonId = season ?? (await resolveSeasonId(competitionId));
    const stages = await call<any[]>(
      `/stages/seasons/${seasonId}`,
      "fixtures.participants;fixtures.scores;fixtures.state;fixtures.periods;fixtures.round",
    );
    return stages
      .filter((s) => s.type_id === 224) // knockout stages only
      .map((s): BracketStage & { _order: number } => {
        const info = stageInfo(s.name);
        return {
          id: String(s.id),
          name: info.ar,
          matches: (s.fixtures ?? [])
            .map((fx: any) => toMatch(fx, competitionId))
            .sort((a: Match, b: Match) => a.startTime.localeCompare(b.startTime)),
          _order: info.order,
        };
      })
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...rest }) => rest);
  },

  async getTeamFixtures(teamId: string, competitionId: string, season): Promise<TeamFixtures> {
    const seasonId = season ?? (await resolveSeasonId(competitionId));
    const [seasonData, rows] = await Promise.all([
      call<any>(
        `/seasons/${seasonId}`,
        "fixtures.participants;fixtures.scores;fixtures.state;fixtures.periods;fixtures.round",
      ),
      call<any[]>(`/standings/seasons/${seasonId}`, "participant;group;details.type").catch(() => []),
    ]);
    const all: any[] = seasonData.fixtures ?? [];
    const mine = all.filter((fx) => (fx.participants ?? []).some((p: any) => String(p.id) === teamId));
    const fixtures = mine
      .map((fx) => toMatch(fx, competitionId))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let teamRaw: any = null;
    for (const fx of mine) {
      const p = (fx.participants ?? []).find((x: any) => String(x.id) === teamId);
      if (p) { teamRaw = p; break; }
    }
    const team = toTeam(teamRaw ?? { id: Number(teamId), name: "?" });
    const row = (rows as any[]).find(
      (r) => String(r.participant_id ?? r.participant?.id) === teamId,
    );
    return {
      team,
      competition: localizeCompetitionName(competitionId, "").name || undefined,
      group: localizeGroup(row?.group?.name),
      rank: row?.position ?? null,
      fixtures,
    };
  },

  async getTeamSchedule(teamId: string): Promise<TeamSchedule> {
    // /schedules/teams/:id returns an array of stages; fixtures live either
    // directly on a stage (cups) or under stage.rounds[].fixtures (leagues).
    const stages = await call<any[]>(`/schedules/teams/${teamId}`);

    const seen = new Set<string>();
    const entries: TeamScheduleEntry[] = [];
    const collect = (fx: any) => {
      if (!fx || seen.has(String(fx.id))) return;
      seen.add(String(fx.id));
      // The schedules feed only carries `state_id`; rebuild the nested state so
      // toMatch can classify live/finished/scheduled correctly.
      if (!fx.state && typeof fx.state_id === "number") {
        fx.state = { developer_name: STATE_DEV_BY_ID[fx.state_id] ?? "NS" };
      }
      const competitionId = String(fx.league_id ?? "");
      const match = toMatch(fx, competitionId);
      const competitionName =
        localizeCompetitionName(competitionId, "").name || undefined;
      entries.push({ match, competitionName });
    };

    for (const stage of stages ?? []) {
      for (const fx of stage.fixtures ?? []) collect(fx);
      for (const round of stage.rounds ?? []) {
        for (const fx of round.fixtures ?? []) collect(fx);
      }
    }

    entries.sort((a, b) => a.match.startTime.localeCompare(b.match.startTime));

    const isDone = (e: TeamScheduleEntry) =>
      e.match.state === "finished" || e.match.state === "cancelled";

    const recent = entries.filter(isDone).slice(-10).reverse();
    const upcoming = entries.filter((e) => !isDone(e)).slice(0, 12);

    let teamRaw: any = null;
    for (const stage of stages ?? []) {
      const pools = [...(stage.fixtures ?? [])];
      for (const r of stage.rounds ?? []) pools.push(...(r.fixtures ?? []));
      for (const fx of pools) {
        const p = (fx.participants ?? []).find((x: any) => String(x.id) === teamId);
        if (p) { teamRaw = p; break; }
      }
      if (teamRaw) break;
    }
    const team = toTeam(teamRaw ?? { id: Number(teamId), name: "?" });

    return { team, upcoming, recent };
  },

  async getTopScorers(competitionId, metric: ScorerMetric, season): Promise<TopScorer[]> {
    const seasonId = season ?? (await resolveSeasonId(competitionId));
    const typeId = metric === "assists" ? 209 : 208;
    const rows = await call<any[]>(
      `/topscorers/seasons/${seasonId}`,
      "player;participant;type",
      { "filters": `seasonTopscorerTypes:${typeId}`, per_page: "25" },
    );
    return rows
      .filter((r) => r.type?.name && (metric === "assists" ? /assist/i.test(r.type.name) : /goal/i.test(r.type.name)))
      .sort((a, b) => a.position - b.position)
      .map((r, i): TopScorer => ({
        rank: r.position ?? i + 1,
        player: playerRef(r.player, r.player_id),
        team: toTeam(r.participant ?? { id: r.participant_id, name: "?" }),
        total: r.total ?? 0,
        metric,
      }));
  },

  async getTeams(competitionId, season): Promise<TeamProfile[]> {
    const seasonId = season ?? (await resolveSeasonId(competitionId));
    const teams = await call<any[]>(`/teams/seasons/${seasonId}`);
    return teams
      .map((t): TeamProfile => ({ team: toTeam(t) }))
      .sort((a, b) => a.team.name.localeCompare(b.team.name, "ar"));
  },

  async getTeam(teamId): Promise<TeamProfile> {
    const t = await call<any>(`/teams/${teamId}`, "country;venue");
    return {
      team: toTeam(t),
      founded: t.founded ?? null,
      country: localizeCountry(t.country?.name),
      venue: t.venue
        ? { name: t.venue.name, city: t.venue.city_name ?? undefined, capacity: t.venue.capacity ?? null }
        : undefined,
    };
  },

  async getSquad(teamId): Promise<TeamSquad> {
    const [team, squad] = await Promise.all([
      call<any>(`/teams/${teamId}`),
      call<any[]>(`/squads/teams/${teamId}`, "player.position;player.nationality"),
    ]);
    const roleRank: Record<string, number> = { "حارس مرمى": 0, مدافع: 1, وسط: 2, مهاجم: 3 };
    const players: SquadPlayer[] = squad
      .filter((s) => s.player)
      .map((s): SquadPlayer => ({
        player: playerRef(s.player, s.player_id),
        number: s.jersey_number ?? null,
        position: localizePosition(s.player?.position?.name),
        nationality: localizeCountry(s.player?.nationality?.name),
        captain: !!s.captain,
      }))
      .sort((a, b) => {
        const ra = roleRank[a.position ?? ""] ?? 9;
        const rb = roleRank[b.position ?? ""] ?? 9;
        if (ra !== rb) return ra - rb;
        return (a.number ?? 99) - (b.number ?? 99);
      });
    return { team: toTeam(team), players };
  },

  async getPlayer(playerId): Promise<PlayerProfile> {
    const p = await call<any>(
      `/players/${playerId}`,
      "position;detailedPosition;nationality;teams.team;" +
        "statistics.details.type;statistics.season.league;statistics.team;" +
        "trophies.league;trophies.season;trophies.team;" +
        "latest.fixture.participants;latest.fixture.league;latest.fixture.scores;latest.details.type;" +
        "metadata.type",
    );
    const stats = pickPlayerStats(p.statistics ?? []);
    return {
      id: String(p.id),
      name: localizePlayer(p.id, p.display_name ?? p.common_name ?? p.name),
      photo: p.image_path,
      position: localizePosition(p.position?.name),
      detailedPosition: localizePosition(p.detailedposition?.name),
      nationality: localizeCountry(p.nationality?.name),
      dateOfBirth: p.date_of_birth ?? undefined,
      age: ageFrom(p.date_of_birth),
      height: p.height ?? null,
      weight: p.weight ?? null,
      preferredFoot: preferredFoot(p.metadata ?? []),
      teams: (p.teams ?? []).map((t: any) => localizeTeamByName(t.team?.name ?? "").name).filter(Boolean),
      currentTeam: currentTeam(p.teams ?? []),
      stats,
      careerTotals: careerTotals(p.statistics ?? []),
      seasons: careerSeasons(p.statistics ?? []),
      trophies: playerTrophies(p.trophies ?? []),
      recentMatches: recentMatches(p.latest ?? [], String(p.id)),
    };
  },

  async getReferee(refereeId): Promise<RefereeProfile> {
    const r = await call<any>(
      `/referees/${refereeId}`,
      "country;statistics.details.type;statistics.season.league;" +
        "latest.fixture.participants;latest.fixture.league;latest.fixture.scores",
    );
    const season = pickRefereeSeason(r.statistics ?? []);
    return {
      id: String(r.id),
      name: r.display_name ?? r.common_name ?? r.name,
      photo: realPhoto(r.image_path),
      country: localizeCountry(r.country?.name),
      countryFlag: r.country?.image_path,
      seasonName: season?.season?.name,
      competition:
        localizeCompetitionName(
          String(season?.season?.league_id ?? ""),
          season?.season?.league?.name ?? "",
        ).name || undefined,
      competitionLogo: season?.season?.league?.image_path,
      stats: refereeStats(season?.details ?? []),
      recentMatches: refereeRecent(r.latest ?? []),
    };
  },
};

// ——— Player profile enrichment helpers ———

// The player's current club: the membership with the latest start date.
function currentTeam(teams: any[]): PlayerProfile["currentTeam"] {
  if (!teams.length) return undefined;
  const sorted = teams
    .filter((t) => t.team)
    .slice()
    .sort((a, b) => String(b.start ?? "").localeCompare(String(a.start ?? "")));
  const cur = sorted[0];
  if (!cur) return undefined;
  const t = toTeam(cur.team);
  return { id: t.id, name: t.name, logo: t.logo, jerseyNumber: cur.jersey_number ?? null };
}

function detailValue(details: any[], typeId: number, from?: "average"): number | null {
  const d = (details ?? []).find((x) => x.type_id === typeId || x.type?.id === typeId);
  return statValue(d?.value, from);
}

// Sum appearances/goals/assists across every season+competition with data.
function careerTotals(statistics: any[]): PlayerCareerTotals | undefined {
  let appearances = 0;
  let goals = 0;
  let assists = 0;
  let any = false;
  for (const s of statistics) {
    if (!(s.details ?? []).length) continue;
    any = true;
    appearances += detailValue(s.details, 321) ?? 0; // Appearances
    goals += detailValue(s.details, 52) ?? 0; // Goals
    assists += detailValue(s.details, 79) ?? 0; // Assists
  }
  return any ? { appearances, goals, assists } : undefined;
}

// Per-season career rows (club & national-team), most recent first.
function careerSeasons(statistics: any[]): PlayerSeasonRow[] {
  return statistics
    .filter((s) => (s.details ?? []).length && (detailValue(s.details, 321) ?? 0) > 0)
    .map((s): PlayerSeasonRow & { _sort: string } => {
      const team = s.team ? toTeam(s.team) : null;
      const leagueId = String(s.season?.league_id ?? s.season?.league?.id ?? "");
      return {
        _sort: String(s.season?.starting_at ?? s.season_id ?? ""),
        seasonId: String(s.season_id ?? ""),
        seasonName: s.season?.name,
        competition:
          localizeCompetitionName(leagueId, s.season?.league?.name ?? "").name || undefined,
        competitionLogo: s.season?.league?.image_path,
        teamName: team?.name,
        teamLogo: team?.logo,
        appearances: detailValue(s.details, 321) ?? 0,
        goals: detailValue(s.details, 52) ?? 0,
        assists: detailValue(s.details, 79) ?? 0,
        rating: detailValue(s.details, 118, "average"),
      };
    })
    .sort((a, b) => b._sort.localeCompare(a._sort))
    .slice(0, 12)
    .map(({ _sort, ...rest }) => rest);
}

// Honours: winners first, then most recent.
function playerTrophies(trophies: any[]): PlayerTrophy[] {
  return trophies
    .map((t): PlayerTrophy & { _sort: string } => {
      const team = t.team ? toTeam(t.team) : null;
      const winner = t.trophy?.position === 1 || /winner/i.test(t.trophy?.name ?? "");
      return {
        _sort: String(t.season?.starting_at ?? t.season?.name ?? ""),
        competition:
          localizeCompetitionName(String(t.league_id ?? ""), t.league?.name ?? "").name ||
          undefined,
        competitionLogo: t.league?.image_path,
        seasonName: t.season?.name,
        teamName: team?.name,
        teamLogo: team?.logo,
        winner,
      };
    })
    .sort((a, b) => {
      if (a.winner !== b.winner) return a.winner ? -1 : 1;
      return b._sort.localeCompare(a._sort);
    })
    .map(({ _sort, ...rest }) => rest);
}

// Latest appearances mapped to unified matches + the player's per-match line.
function recentMatches(latest: any[], playerId: string): PlayerRecentMatch[] {
  return latest
    .filter((l) => l.fixture)
    .map((l): PlayerRecentMatch & { _sort: string } => {
      const fx = l.fixture;
      if (!fx.state && typeof fx.state_id === "number") {
        fx.state = { developer_name: STATE_DEV_BY_ID[fx.state_id] ?? "NS" };
      }
      const competitionId = String(fx.league_id ?? "");
      const match = toMatch(fx, competitionId);
      return {
        _sort: match.startTime,
        match,
        teamId: String(l.team_id ?? ""),
        competitionName:
          localizeCompetitionName(competitionId, fx.league?.name ?? "").name || undefined,
        rating: detailValue(l.details, 118),
        goals: detailValue(l.details, 52) ?? 0,
        assists: detailValue(l.details, 79) ?? 0,
        minutes: detailValue(l.details, 119),
        started: l.type_id === 11,
      };
    })
    .sort((a, b) => b._sort.localeCompare(a._sort))
    .slice(0, 6)
    .map(({ _sort, ...rest }) => rest);
}

// ——— Referee profile enrichment helpers ———

// Sportmonks fixture referees: pick the main referee (type_id 6), else the first.
function pickReferee(refs: any[]): { id: string; name: string } | null {
  const main = refs.find((r) => r.type_id === 6) ?? refs[0];
  const ref = main?.referee;
  if (!ref) return null;
  return { id: String(ref.id), name: ref.display_name ?? ref.common_name ?? ref.name };
}

// Drop Sportmonks' generic placeholder so the UI falls back to a monogram.
function realPhoto(url?: string): string | undefined {
  return url && !/placeholder/i.test(url) ? url : undefined;
}

// A season's officiated-match count (type 188), used to rank seasons.
function seasonMatchCount(s: any): number {
  const d = (s.details ?? []).find((x: any) => x.type_id === 188 || x.type?.id === 188);
  return refStatNumbers(d?.value).total ?? 0;
}

// The most relevant season block: the one the referee officiated most, newest first.
function pickRefereeSeason(statistics: any[]): any | undefined {
  return statistics
    .filter((s) => (s.details ?? []).length)
    .slice()
    .sort(
      (a, b) =>
        seasonMatchCount(b) - seasonMatchCount(a) ||
        (b.details?.length ?? 0) - (a.details?.length ?? 0) ||
        (b.season_id ?? 0) - (a.season_id ?? 0),
    )[0];
}

// Referee stat type ids → Arabic labels, in display order (matches first).
const REFEREE_STAT_DEFS: { id: number; label: string }[] = [
  { id: 188, label: "مباريات" },
  { id: 84, label: "بطاقات صفراء" },
  { id: 83, label: "بطاقات حمراء" },
  { id: 85, label: "صفراء ثانية" },
  { id: 47, label: "ركلات جزاء" },
  { id: 56, label: "أخطاء" },
  { id: 314, label: "لحظات الفار" },
];

// A referee detail value is either { count, average } or { all: { count, average } }.
function refStatNumbers(value: any): { total: number | null; avg: number | null } {
  if (value == null) return { total: null, avg: null };
  const node = value.all ?? value;
  return {
    total: typeof node.count === "number" ? node.count : null,
    avg: typeof node.average === "number" ? node.average : null,
  };
}

function refereeStats(details: any[]): RefereeStatItem[] {
  return REFEREE_STAT_DEFS.flatMap((def): RefereeStatItem[] => {
    const d = details.find((x) => x.type_id === def.id || x.type?.id === def.id);
    if (!d) return [];
    const { total, avg } = refStatNumbers(d.value);
    if (total == null) return [];
    return [
      {
        key: String(def.id),
        label: def.label,
        total,
        // Season matches has no meaningful per-match average; hide it.
        perMatch: def.id === 188 || avg == null ? null : round2(avg),
      },
    ];
  });
}

// Latest officiated fixtures mapped to unified matches, most recent first.
function refereeRecent(latest: any[]): RefereeRecentMatch[] {
  return latest
    .filter((l) => l.fixture)
    .map((l): RefereeRecentMatch & { _sort: string } => {
      const fx = l.fixture;
      if (!fx.state && typeof fx.state_id === "number") {
        fx.state = { developer_name: STATE_DEV_BY_ID[fx.state_id] ?? "NS" };
      }
      const competitionId = String(fx.league_id ?? "");
      const match = toMatch(fx, competitionId);
      return {
        _sort: match.startTime,
        match,
        competitionName:
          localizeCompetitionName(competitionId, fx.league?.name ?? "").name || undefined,
      };
    })
    .sort((a, b) => b._sort.localeCompare(a._sort))
    .slice(0, 10)
    .map(({ _sort, ...rest }) => rest);
}

function mapEventType(typeName: string): { type: MatchEventType; isVar: boolean } {
  const t = typeName.toLowerCase();
  if (t.includes("var")) return { type: "var", isVar: true };
  if (t.includes("goal") || t === "penalty") return { type: "goal", isVar: false };
  if (t.includes("card")) return { type: "card", isVar: false };
  if (t.includes("substitution")) return { type: "subst", isVar: false };
  return { type: "other", isVar: false };
}

// Produce an English detail string whose keywords the iOS layer maps to Arabic.
function buildDetail(typeName: string, info?: string, addition?: string): string {
  const t = typeName.toLowerCase();
  if (t.includes("own")) return "Own Goal";
  if (t.includes("var")) {
    const extra = [info, addition].filter(Boolean).join(" ");
    return extra ? `VAR ${extra}` : "VAR";
  }
  // Cards: keep the card type (not the reason) so the client maps colour + Arabic.
  if (t.includes("card")) return t.includes("red") ? "Red Card" : "Yellow Card";
  if (t === "penalty" || (t.includes("goal") && /penalt/i.test(`${info} ${addition}`))) return "Penalty Goal";
  if (t.includes("missed penalty")) return "Missed Penalty";
  return info && String(info).trim() ? String(info) : typeName;
}

function buildStats(raw: any[]): MatchStat[] {
  const pick = (typeName: string, location: "home" | "away") => {
    const s = raw.find((x) => x.type?.name === typeName && x.location === location);
    return s?.data?.value ?? null;
  };
  return STAT_DEFS.map((def): MatchStat => {
    const h = pick(def.key, "home");
    const a = pick(def.key, "away");
    const fmt = (v: number | null) =>
      v == null ? null : def.percent ? `${v}%` : round2(v as number);
    return { key: def.key, label: def.label, home: fmt(h), away: fmt(a) };
  }).filter((s) => s.home !== null || s.away !== null);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// Extract a home/away pair for a given stat type (e.g. Expected Goals).
function pickPair(raw: any[], typeName: string): TeamPair | null {
  const get = (loc: "home" | "away") => {
    const s = raw.find((x) => x.type?.name === typeName && x.location === loc);
    return s?.data?.value != null ? round2(s.data.value) : null;
  };
  const home = get("home");
  const away = get("away");
  if (home == null && away == null) return null;
  return { home, away };
}

// Aggregate the Pressure Index timeline into a dominance share (% per team).
function aggregatePressure(points: any[], homeId: string): TeamPair | null {
  if (!points.length) return null;
  let home = 0;
  let away = 0;
  for (const p of points) {
    const v = Number(p.pressure ?? 0);
    if (String(p.participant_id) === homeId) home += v;
    else away += v;
  }
  const total = home + away;
  if (total <= 0) return null;
  return { home: Math.round((home / total) * 100), away: Math.round((away / total) * 100) };
}

// Per-minute Pressure Index timeline (one home + one away value per minute).
function buildMomentum(points: any[], homeId: string): MomentumPoint[] | undefined {
  if (!points.length) return undefined;
  const byMin = new Map<number, { home: number; away: number }>();
  for (const p of points) {
    const m = Number(p.minute);
    if (!Number.isFinite(m)) continue;
    const slot = byMin.get(m) ?? { home: 0, away: 0 };
    const v = Number(p.pressure ?? 0);
    if (String(p.participant_id) === homeId) slot.home = v;
    else slot.away = v;
    byMin.set(m, slot);
  }
  const out = [...byMin.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minute, v]): MomentumPoint => ({ minute, home: round2(v.home), away: round2(v.away) }));
  return out.length ? out : undefined;
}

// Goals per side for a given Sportmonks score description (e.g. "1ST_HALF").
function scoreByDescription(
  scores: any[],
  description: string,
  homeId: string,
): { home: number; away: number } | null {
  let home: number | null = null;
  let away: number | null = null;
  for (const s of scores ?? []) {
    if (s.description !== description) continue;
    const goals = s.score?.goals ?? 0;
    if (String(s.participant_id) === homeId) home = goals;
    else away = goals;
  }
  if (home == null && away == null) return null;
  return { home: home ?? 0, away: away ?? 0 };
}

// Per-period score breakdown. First half from the provider; second half derived
// from the full-time (current) score so it's robust when "2ND_HALF_ONLY" is absent.
function buildPeriodScores(scores: any[], homeId: string, match: Match): PeriodScore[] | undefined {
  const first = scoreByDescription(scores, "1ST_HALF", homeId);
  if (!first) return undefined;
  const ftHome = match.home.score ?? first.home;
  const ftAway = match.away.score ?? first.away;
  const periods: PeriodScore[] = [
    { key: "1H", label: "الشوط الأول", home: first.home, away: first.away },
    {
      key: "2H",
      label: "الشوط الثاني",
      home: Math.max(0, ftHome - first.home),
      away: Math.max(0, ftAway - first.away),
    },
  ];
  return periods;
}

function buildLineups(raw: any[], coaches: any[], homeId: string): { home?: Lineup; away?: Lineup } {
  const coachFor = (teamId: string): string | null => {
    const c = coaches.find((x) => String(x.meta?.participant_id) === teamId);
    return c ? localizeCoach(c.id, c.display_name ?? c.common_name ?? c.name) : null;
  };
  // Read a single per-player stat (lineups.details) by its Sportmonks type id.
  const stat = (p: any, typeId: number): number | boolean | null => {
    const d = (p.details ?? []).find((x: any) => x.type_id === typeId);
    return d ? d.data?.value ?? null : null;
  };
  const toPlayer = (p: any): LineupPlayer => {
    const [line, slot] = String(p.formation_field ?? "").split(":");
    const rating = stat(p, 118); // RATING
    const goals = stat(p, 52); // GOALS
    return {
      id: p.player_id ? String(p.player_id) : undefined,
      number: p.jersey_number ?? null,
      name: p.player_name ? localizePlayer(p.player_id, p.player_name) : "",
      pos: POSITIONS[p.position_id] ?? null,
      photo: p.player?.image_path ?? undefined,
      captain: stat(p, 40) === true, // CAPTAIN
      rating: typeof rating === "number" ? rating : null,
      goals: typeof goals === "number" ? goals : 0,
      yellow: Boolean(stat(p, 84)) || Boolean(stat(p, 85)), // YELLOW / YELLOW-RED
      red: Boolean(stat(p, 83)) || Boolean(stat(p, 85)), // RED / YELLOW-RED
      line: line ? Number(line) : null,
      slot: slot ? Number(slot) : null,
    };
  };
  // Order starters keeper-first, then by pitch line and slot for a stable layout.
  const byPitch = (a: LineupPlayer, b: LineupPlayer) =>
    (a.line ?? 99) - (b.line ?? 99) || (a.slot ?? 99) - (b.slot ?? 99);

  const result: { home?: Lineup; away?: Lineup } = {};
  for (const side of ["home", "away"] as const) {
    // Group lineup rows by side using team_id vs homeId.
    const rows = raw.filter((p) =>
      side === "home" ? String(p.team_id) === homeId : String(p.team_id) !== homeId,
    );
    if (!rows.length) continue;
    const tid = String(rows[0].team_id);
    const formation = rows.find((p) => p.formation_field)?.formation_field
      ? deriveFormation(rows)
      : null;
    const coach = coaches.find((x) => String(x.meta?.participant_id) === tid);
    result[side] = {
      side,
      formation,
      startXI: rows.filter((p) => p.type_id === 11).map(toPlayer).sort(byPitch),
      substitutes: rows
        .filter((p) => p.type_id === 12)
        .map(toPlayer)
        .sort((a, b) => (a.number ?? 999) - (b.number ?? 999)),
      coach: coachFor(tid),
      coachId: coach ? String(coach.id) : null,
    };
  }
  return result;
}

// Group a flat fixtures list into per-competition buckets, live matches first.
function groupByCompetition(fixtures: any[]): MatchDayGroup[] {
  const buckets = new Map<string, MatchDayGroup>();
  for (const fx of fixtures ?? []) {
    const id = String(fx.league_id);
    let g = buckets.get(id);
    if (!g) {
      g = {
        competition: {
          id,
          name: localizeCompetitionName(id, fx.league?.name ?? "").name,
          logo: fx.league?.image_path,
        },
        matches: [],
      };
      buckets.set(id, g);
    }
    g.matches.push(toMatch(fx, id));
  }
  const rank = (m: MatchDayGroup) => {
    if (m.matches.some((x) => x.state === "live")) return 0;
    if (m.matches.some((x) => x.state === "scheduled")) return 1;
    return 2;
  };
  for (const g of buckets.values()) {
    g.matches.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return [...buckets.values()].sort(
    (a, b) => rank(a) - rank(b) || a.competition.name.localeCompare(b.competition.name, "ar"),
  );
}

function playerRef(player: any, fallbackId?: number | string): PlayerRef {
  const id = String(player?.id ?? fallbackId ?? "");
  const raw = player?.display_name ?? player?.common_name ?? player?.name ?? "";
  return { id, name: localizePlayer(player?.id ?? fallbackId, raw), photo: player?.image_path };
}

// Preferred foot from player metadata (type "preferred-foot" / type_id 229),
// localized to Arabic. Undefined when the player has no such metadata entry.
function preferredFoot(metadata: any[]): string | undefined {
  const m = (metadata ?? []).find(
    (x) => x?.type?.code === "preferred-foot" || x?.type_id === 229,
  );
  const v = typeof m?.values === "string" ? m.values.toLowerCase() : null;
  if (v === "left") return "اليسرى";
  if (v === "right") return "اليمنى";
  if (v === "both") return "كلتاهما";
  return undefined;
}

function ageFrom(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// Curated per-season player stats (Sportmonks type name → Arabic label), in display order.
const PLAYER_STAT_DEFS: { key: string; label: string; from?: "average"; pct?: boolean }[] = [
  { key: "Appearances", label: "مباريات" },
  { key: "Minutes Played", label: "الدقائق" },
  { key: "Goals", label: "أهداف" },
  { key: "Assists", label: "صناعة" },
  { key: "Shots Total", label: "التسديدات" },
  { key: "Shots On Target", label: "على المرمى" },
  { key: "Key Passes", label: "تمريرات مفتاحية" },
  { key: "Big Chances Created", label: "فرص صنعها" },
  { key: "Accurate Passes Percentage", label: "دقّة التمرير", pct: true },
  { key: "Duels Won", label: "التحامات رابحة" },
  { key: "Tackles", label: "عرقلات" },
  { key: "Yellowcards", label: "بطاقات صفراء" },
  { key: "Redcards", label: "بطاقات حمراء" },
  { key: "Rating", label: "التقييم", from: "average" },
];

function statValue(raw: any, from?: "average"): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return raw;
  if (from === "average" && raw.average != null) return raw.average;
  if (raw.total != null) return raw.total;
  if (raw.average != null) return raw.average;
  return null;
}

// Prefer the Saudi Pro League (944) season; else the most recent season that has data.
function pickPlayerStats(statistics: any[]): PlayerProfile["stats"] {
  const populated = statistics.filter((s) => (s.details ?? []).length);
  if (!populated.length) return undefined;
  const proLeague = populated.filter((s) => String(s.season?.league_id) === "944");
  const pool = proLeague.length ? proLeague : populated;
  const chosen = pool.slice().sort((a, b) => (b.season_id ?? 0) - (a.season_id ?? 0))[0];

  const byType = new Map<string, any>();
  for (const d of chosen.details ?? []) {
    if (d.type?.name) byType.set(d.type.name, d.value);
  }
  const items: PlayerStatItem[] = PLAYER_STAT_DEFS.flatMap((def) => {
    const v = statValue(byType.get(def.key), def.from);
    if (v == null) return [];
    const value = def.pct ? `${Math.round(Number(v))}%` : (def.from === "average" ? Number(Number(v).toFixed(2)) : v);
    return [{ key: def.key, label: def.label, value }];
  });
  return {
    seasonId: String(chosen.season_id ?? ""),
    seasonName: chosen.season?.name,
    competition: localizeCompetitionName(String(chosen.season?.league_id ?? ""), "").name || undefined,
    items,
  };
}

// Sportmonks gives a per-player "formation_field" like "2:2" (line:slot). Count the
// starting XI per line (excluding the keeper) to derive e.g. "4-3-3".
function deriveFormation(rows: any[]): string | null {
  const lines = new Map<number, number>();
  for (const p of rows) {
    if (p.type_id !== 11) continue;
    const field = p.formation_field;
    if (!field) continue;
    const line = Number(String(field).split(":")[0]);
    if (line === 1) continue; // keeper line
    lines.set(line, (lines.get(line) ?? 0) + 1);
  }
  if (lines.size === 0) return null;
  return [...lines.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, count]) => count)
    .join("-");
}
