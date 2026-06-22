import { config } from "../config.ts";
import { localizeCompetitionName } from "../data/competitionNames.ts";
import { localizeCoach, localizePlayer } from "../data/playerNames.ts";
import { localizeTeamName } from "../data/teamNames.ts";
import type {
  Lineup,
  LineupPlayer,
  Match,
  MatchDetail,
  MatchEvent,
  MatchEventType,
  MatchSide,
  MatchState,
  MatchStat,
  SportsProvider,
  Standings,
  StandingRow,
  Team,
} from "../types.ts";

// Curated, ordered subset of stats with Arabic labels. Anything not listed is dropped.
const STAT_LABELS: Record<string, string> = {
  "Ball Possession": "الاستحواذ",
  "expected_goals": "الأهداف المتوقّعة (xG)",
  "Total Shots": "إجمالي التسديدات",
  "Shots on Goal": "على المرمى",
  "Corner Kicks": "الركلات الركنية",
  "Fouls": "الأخطاء",
  "Offsides": "التسلل",
  "Yellow Cards": "البطاقات الصفراء",
  "Red Cards": "البطاقات الحمراء",
  "Goalkeeper Saves": "تصدّيات الحارس",
  "Passes %": "دقّة التمرير",
};
const STAT_ORDER = Object.keys(STAT_LABELS);

function mapEventType(raw: string): { type: MatchEventType; isVar: boolean } {
  const t = raw.toLowerCase();
  if (t === "var") return { type: "var", isVar: true };
  if (t === "goal") return { type: "goal", isVar: false };
  if (t === "card") return { type: "card", isVar: false };
  if (t === "subst") return { type: "subst", isVar: false };
  return { type: "other", isVar: false };
}

const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);
const POSTPONED = new Set(["PST", "TBD"]);
const CANCELLED = new Set(["CANC", "ABD", "AWD", "WO"]);

function mapState(short: string): MatchState {
  if (LIVE.has(short)) return "live";
  if (FINISHED.has(short)) return "finished";
  if (POSTPONED.has(short)) return "postponed";
  if (CANCELLED.has(short)) return "cancelled";
  return "scheduled";
}

async function call<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(config.apiFootball.baseUrl + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "x-apisports-key": config.apiFootball.key } });
  if (!res.ok) throw new Error(`API-Football ${path} -> HTTP ${res.status}`);
  const json = (await res.json()) as { response: T; errors?: unknown };
  if (json.errors && Array.isArray(json.errors) ? json.errors.length : Object.keys(json.errors ?? {}).length) {
    throw new Error(`API-Football ${path} errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

function toTeam(t: { id: number; name: string; logo?: string }): Team {
  const id = String(t.id);
  const localized = localizeTeamName(id, t.name);
  return { id, name: localized.name, shortName: localized.short, logo: t.logo };
}

export const apiFootball: SportsProvider = {
  name: "api-football",

  async getStandings(competitionId, season): Promise<Standings> {
    const yr = season ?? config.defaults.saudiProLeague.season;
    const response = await call<any[]>("/standings", { league: competitionId, season: yr });
    const league = response[0]?.league;
    const table = league?.standings?.[0] ?? [];
    const rows: StandingRow[] = table.map((r: any) => ({
      rank: r.rank,
      team: toTeam(r.team),
      played: r.all.played,
      win: r.all.win,
      draw: r.all.draw,
      lose: r.all.lose,
      goalsFor: r.all.goals.for,
      goalsAgainst: r.all.goals.against,
      goalsDiff: r.goalsDiff,
      points: r.points,
      form: r.form ?? undefined,
    }));
    return {
      competition: {
        id: competitionId,
        sport: "football",
        name: localizeCompetitionName(competitionId, league?.name ?? "Competition").name,
        country: league?.country,
        logo: league?.logo,
        season: yr,
      },
      rows,
    };
  },

  async getFixtures({ competitionId, season, last, next, live }): Promise<Match[]> {
    const params: Record<string, string | number> = { league: competitionId };
    if (live) {
      params.live = "all";
    } else {
      params.season = season ?? config.defaults.saudiProLeague.season;
      if (last) params.last = last;
      if (next) params.next = next;
    }
    const response = await call<any[]>("/fixtures", params);
    return response.map((x: any): Match => ({
      id: String(x.fixture.id),
      competitionId,
      sport: "football",
      state: mapState(x.fixture.status.short),
      minute: x.fixture.status.elapsed ?? null,
      startTime: x.fixture.date,
      round: x.league?.round,
      venue: x.fixture.venue?.name ?? undefined,
      home: { team: toTeam(x.teams.home), score: x.goals.home },
      away: { team: toTeam(x.teams.away), score: x.goals.away },
    }));
  },

  async getMatchDetail(matchId): Promise<MatchDetail> {
    // One call returns fixture + events + lineups + statistics.
    const response = await call<any[]>("/fixtures", { id: matchId });
    const x = response[0];
    if (!x) throw new Error(`Match ${matchId} not found`);

    const homeId = String(x.teams.home.id);
    const competitionId = String(x.league.id);
    const sideOf = (teamId: number | string) => (String(teamId) === homeId ? "home" : "away");

    const match: Match = {
      id: String(x.fixture.id),
      competitionId,
      sport: "football",
      state: mapState(x.fixture.status.short),
      minute: x.fixture.status.elapsed ?? null,
      startTime: x.fixture.date,
      round: x.league?.round,
      venue: x.fixture.venue?.name ?? undefined,
      home: { team: toTeam(x.teams.home), score: x.goals.home } satisfies MatchSide,
      away: { team: toTeam(x.teams.away), score: x.goals.away } satisfies MatchSide,
    };

    const events: MatchEvent[] = (x.events ?? []).map((e: any): MatchEvent => {
      const { type, isVar } = mapEventType(e.type);
      return {
        minute: e.time.elapsed ?? 0,
        extraMinute: e.time.extra ?? null,
        side: sideOf(e.team.id),
        type,
        detail: e.detail ?? e.type,
        player: e.player?.name ? localizePlayer(e.player.id, e.player.name) : undefined,
        assist: e.assist?.name ? localizePlayer(e.assist.id, e.assist.name) : undefined,
        isVar,
      };
    });

    const stats = buildStats(x.statistics ?? [], homeId);
    const lineups = buildLineups(x.lineups ?? [], homeId);

    return {
      match,
      competitionName: localizeCompetitionName(competitionId, x.league?.name ?? "").name,
      events,
      stats,
      lineups,
    };
  },
};

function buildStats(raw: any[], homeId: string): MatchStat[] {
  const home = raw.find((s) => String(s.team.id) === homeId);
  const away = raw.find((s) => String(s.team.id) !== homeId);
  const get = (block: any, type: string) =>
    block?.statistics?.find((s: any) => s.type === type)?.value ?? null;

  return STAT_ORDER.map((type): MatchStat => ({
    key: type,
    label: STAT_LABELS[type]!,
    home: get(home, type),
    away: get(away, type),
  })).filter((s) => s.home !== null || s.away !== null);
}

function buildLineups(raw: any[], homeId: string): { home?: Lineup; away?: Lineup } {
  const toLineup = (block: any): Lineup => {
    const map = (p: any): LineupPlayer => ({
      number: p.player?.number ?? null,
      name: p.player?.name ? localizePlayer(p.player.id, p.player.name) : "",
      pos: p.player?.pos ?? null,
    });
    return {
      side: String(block.team.id) === homeId ? "home" : "away",
      formation: block.formation ?? null,
      startXI: (block.startXI ?? []).map(map),
      substitutes: (block.substitutes ?? []).map(map),
      coach: block.coach?.name ? localizeCoach(block.coach.id, block.coach.name) : null,
    };
  };
  const result: { home?: Lineup; away?: Lineup } = {};
  for (const block of raw) {
    const lineup = toLineup(block);
    result[lineup.side] = lineup;
  }
  return result;
}
