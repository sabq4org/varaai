// VARA unified schema (client copy).
// Mirrors the data shapes from server/src/types.ts — the canonical source.
// Only the response/data types are mirrored here (not the SportsProvider contract).

export type Sport = "football" | "esports";

export type MatchState =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

/** Live phase for in-play matches. Undefined unless live. */
export type MatchPhase = "1H" | "HT" | "2H" | "ET" | "BREAK" | "PEN";

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

export interface Competition {
  id: string;
  sport: Sport;
  name: string;
  country?: string;
  logo?: string;
  season?: number | string;
}

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  /** Recent form, most-recent-first, e.g. "WWDLW". */
  form?: string;
  /** Group / pool name for tournaments with a group stage. */
  group?: string;
}

export interface Standings {
  competition: Competition;
  rows: StandingRow[];
  grouped?: boolean;
}

export interface MatchSide {
  team: Team;
  score: number | null;
}

export interface Match {
  id: string;
  competitionId: string;
  sport: Sport;
  state: MatchState;
  /** Live phase (1st/2nd half, half-time, …). Undefined unless in play. */
  phase?: MatchPhase;
  /** Live minute for in-play matches (server snapshot). */
  minute?: number | null;
  /** Unix seconds when the current ticking period started — lets the client tick locally. */
  liveStartedAt?: number | null;
  /** Absolute match-minute at which the current period begins (0/45/90/105). */
  liveBase?: number | null;
  startTime: string; // ISO 8601
  round?: string;
  venue?: string;
  home: MatchSide;
  away: MatchSide;
}

export type MatchEventType = "goal" | "card" | "subst" | "var" | "other";

export interface MatchEvent {
  minute: number;
  extraMinute?: number | null;
  side: "home" | "away";
  type: MatchEventType;
  detail: string;
  player?: string;
  assist?: string;
  /** For substitutions: the player going off (`player` is the one coming on). */
  playerOut?: string;
  /** For cards: the raw reason keyword (e.g. "Foul"), localized on the client. */
  reason?: string;
  isVar: boolean;
}

export interface MatchStat {
  key: string;
  label: string;
  home: number | string | null;
  away: number | string | null;
}

export interface LineupPlayer {
  id?: string;
  number?: number | null;
  name: string;
  pos?: string | null;
  photo?: string;
  captain?: boolean;
  rating?: number | null;
  goals?: number;
  yellow?: boolean;
  red?: boolean;
  line?: number | null;
  slot?: number | null;
}

export interface Lineup {
  side: "home" | "away";
  formation?: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach?: string | null;
  coachId?: string | null;
}

export interface TeamPair {
  home: number | null;
  away: number | null;
}

/** One minute on the Pressure Index timeline (raw values per team). */
export interface MomentumPoint {
  minute: number;
  home: number;
  away: number;
}

/** Score accrued within a single period. */
export interface PeriodScore {
  key: "1H" | "2H" | "ET" | "PEN";
  label: string;
  home: number;
  away: number;
}

export interface MatchDetail {
  match: Match;
  competitionName: string;
  events: MatchEvent[];
  stats: MatchStat[];
  lineups: { home?: Lineup; away?: Lineup };
  /** Expected Goals (post-match add-on). Null when unavailable. */
  xg?: TeamPair | null;
  /** Dominance share derived from the Pressure Index (percentages). */
  pressure?: TeamPair | null;
  /** Per-minute Pressure Index timeline for the momentum chart. */
  momentum?: MomentumPoint[];
  /** Per-period score breakdown (1st half, 2nd half, …). */
  periodScores?: PeriodScore[];
  /** Main referee (linkable to the referee profile). Null when unknown. */
  referee?: { id: string; name: string } | null;
}

// ——— Discovery / catalog types ———

export interface CompetitionSummary {
  id: string;
  sport: Sport;
  name: string;
  shortName?: string;
  country?: string;
  logo?: string;
  currentSeason?: string | number;
}

export interface PlayerRef {
  id: string;
  name: string;
  photo?: string;
}

export type ScorerMetric = "goals" | "assists";

export interface TopScorer {
  rank: number;
  player: PlayerRef;
  team: Team;
  total: number;
  metric: ScorerMetric;
}

export interface PlayerStatItem {
  key: string;
  label: string;
  value: number | string;
}

export interface PlayerSeasonStats {
  seasonId: string;
  seasonName?: string;
  competition?: string;
  items: PlayerStatItem[];
}

export interface PlayerCurrentTeam {
  id: string;
  name: string;
  logo?: string;
  jerseyNumber?: number | null;
}

export interface PlayerCareerTotals {
  appearances: number;
  goals: number;
  assists: number;
}

export interface PlayerSeasonRow {
  seasonId: string;
  seasonName?: string;
  competition?: string;
  competitionLogo?: string;
  teamName?: string;
  teamLogo?: string;
  appearances?: number;
  goals?: number;
  assists?: number;
  rating?: number | null;
}

export interface PlayerTrophy {
  competition?: string;
  competitionLogo?: string;
  seasonName?: string;
  teamName?: string;
  teamLogo?: string;
  /** true = winner, false = runner-up. */
  winner: boolean;
}

export interface PlayerRecentMatch {
  match: Match;
  teamId: string;
  competitionName?: string;
  rating?: number | null;
  goals?: number;
  assists?: number;
  minutes?: number | null;
  started?: boolean;
}

export interface PlayerProfile {
  id: string;
  name: string;
  photo?: string;
  position?: string;
  detailedPosition?: string;
  nationality?: string;
  dateOfBirth?: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  /** Preferred foot, localized (e.g. "اليمنى" / "اليسرى"). */
  preferredFoot?: string;
  teams: string[];
  currentTeam?: PlayerCurrentTeam;
  stats?: PlayerSeasonStats;
  careerTotals?: PlayerCareerTotals;
  seasons?: PlayerSeasonRow[];
  trophies?: PlayerTrophy[];
  recentMatches?: PlayerRecentMatch[];
}

/** One officiating statistic for a referee (matches, fouls, cards, …). */
export interface RefereeStatItem {
  key: string;
  label: string;
  total: number;
  perMatch?: number | null;
}

/** A fixture a referee recently officiated (most recent first). */
export interface RefereeRecentMatch {
  match: Match;
  competitionName?: string;
}

export interface RefereeProfile {
  id: string;
  name: string;
  photo?: string;
  country?: string;
  countryFlag?: string;
  seasonName?: string;
  competition?: string;
  competitionLogo?: string;
  stats: RefereeStatItem[];
  recentMatches: RefereeRecentMatch[];
}

export interface Venue {
  name?: string;
  city?: string;
  capacity?: number | null;
}

export interface TeamProfile {
  team: Team;
  founded?: number | null;
  country?: string;
  venue?: Venue;
}

export interface SquadPlayer {
  player: PlayerRef;
  number?: number | null;
  position?: string;
  nationality?: string;
  captain?: boolean;
}

export interface TeamSquad {
  team: Team;
  players: SquadPlayer[];
}

/** One entry in a team's cross-competition schedule (carries its competition label). */
export interface TeamScheduleEntry {
  match: Match;
  competitionName?: string;
}

/** A team's full season schedule across all competitions, split into next + past. */
export interface TeamSchedule {
  team: Team;
  upcoming: TeamScheduleEntry[];
  recent: TeamScheduleEntry[];
}

/** A given day's fixtures, grouped by competition. */
export interface MatchDayGroup {
  competition: { id: string; name: string; logo?: string };
  matches: Match[];
}

/** One knockout round (e.g. "دور الـ16") and its ties. */
export interface BracketStage {
  id: string;
  name: string;
  matches: Match[];
}

/** Wraps every Edge response with provenance + freshness metadata. */
export interface VaraResponse<T> {
  source: string;
  fetchedAt: string;
  cached: boolean;
  data: T;
}

/** Shape of the /v1/saudi-pro-league/overview convenience endpoint. */
export interface OverviewResponse {
  source: string;
  fetchedAt: string;
  cached: boolean;
  data: { standings: Standings; results: Match[] };
}
