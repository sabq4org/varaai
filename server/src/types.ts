// VARA unified schema — the single shape the iOS app consumes, regardless of provider.
// Every external provider (API-Football, Sportmonks, PandaScore, ...) is normalized into these types.

export type Sport = "football" | "esports";

export type MatchState = "scheduled" | "live" | "finished" | "postponed" | "cancelled";

/** Live phase for in-play matches: 1st half, half-time, 2nd half, extra time,
 * a generic break, or penalty shoot-out. Undefined when not live. */
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
  /** Group / pool name for tournaments with a group stage (e.g. "المجموعة A"). */
  group?: string;
}

export interface Standings {
  competition: Competition;
  rows: StandingRow[];
  /** True when rows span multiple groups (World Cup, AFC group stage, …). */
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

/** One comparative statistic row (home vs away). */
export interface MatchStat {
  key: string;
  label: string;
  home: number | string | null;
  away: number | string | null;
}

export interface LineupPlayer {
  /** Player id (for linking to the player profile). */
  id?: string;
  number?: number | null;
  name: string;
  pos?: string | null;
  /** Headshot URL. */
  photo?: string;
  /** Wore the captain's armband. */
  captain?: boolean;
  /** Match rating (e.g. 7.8). */
  rating?: number | null;
  /** Goals scored in this fixture. */
  goals?: number;
  /** Booked / sent off in this fixture. */
  yellow?: boolean;
  red?: boolean;
  /** Pitch grid line (1 = keeper) parsed from Sportmonks formation_field. */
  line?: number | null;
  /** Slot within the pitch line. */
  slot?: number | null;
}

export interface Lineup {
  side: "home" | "away";
  formation?: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach?: string | null;
  /** Coach id (for future linking). */
  coachId?: string | null;
}

/** A home-vs-away numeric pair (xG, pressure share, …). */
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
  /** Dominance share derived from the Pressure Index (percentages, ~sum 100). */
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

/** The player's current club + shirt number, for the profile header. */
export interface PlayerCurrentTeam {
  id: string;
  name: string;
  logo?: string;
  jerseyNumber?: number | null;
}

/** Career totals summed across every competition that returned data. */
export interface PlayerCareerTotals {
  appearances: number;
  goals: number;
  assists: number;
}

/** One season+competition row of a player's career history. */
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

/** A trophy/honour won (or runner-up) by the player. */
export interface PlayerTrophy {
  competition?: string;
  competitionLogo?: string;
  seasonName?: string;
  teamName?: string;
  teamLogo?: string;
  /** true = winner, false = runner-up. */
  winner: boolean;
}

/** A recent appearance with the player's per-match contribution. */
export interface PlayerRecentMatch {
  match: Match;
  /** The player's team in this fixture (to resolve their side + result). */
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
  /** Preferred foot, localized (e.g. "اليمنى" / "اليسرى"). From player metadata. */
  preferredFoot?: string;
  teams: string[];
  /** Current club + shirt number. */
  currentTeam?: PlayerCurrentTeam;
  stats?: PlayerSeasonStats;
  /** Career totals across all competitions. */
  careerTotals?: PlayerCareerTotals;
  /** Per-season career history (most recent first). */
  seasons?: PlayerSeasonRow[];
  /** Honours won (winners first). */
  trophies?: PlayerTrophy[];
  /** Latest appearances with rating/goals. */
  recentMatches?: PlayerRecentMatch[];
}

/** One officiating statistic for a referee (matches, fouls, cards, …). */
export interface RefereeStatItem {
  key: string;
  label: string;
  /** Season total. */
  total: number;
  /** Per-match average, when meaningful (null for plain season counts). */
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
  /** Country flag URL. */
  countryFlag?: string;
  /** Season label these statistics describe (e.g. "2024/2025"). */
  seasonName?: string;
  /** Competition the statistics are scoped to. */
  competition?: string;
  competitionLogo?: string;
  /** Officiating numbers for the season (matches, cards, fouls, …). */
  stats: RefereeStatItem[];
  /** Latest fixtures officiated. */
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

/** Today's / a given day's fixtures, grouped by competition. */
export interface MatchDayGroup {
  competition: { id: string; name: string; logo?: string };
  matches: Match[];
}

/** One knockout round (e.g. "دور الـ16") with its ties. */
export interface BracketStage {
  id: string;
  name: string;
  matches: Match[];
}

/** A team's fixtures within a competition + its group standing (for the favourite-team card). */
export interface TeamFixtures {
  team: Team;
  competition?: string;
  group?: string;
  rank?: number | null;
  fixtures: Match[];
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

/** Wraps every response with provenance + freshness metadata. */
export interface VaraResponse<T> {
  source: string;
  fetchedAt: string;
  cached: boolean;
  data: T;
}

/** Contract every data provider must implement so VARA stays provider-agnostic. */
export interface SportsProvider {
  readonly name: string;
  getStandings(competitionId: string, season?: string | number): Promise<Standings>;
  getFixtures(params: {
    competitionId: string;
    season?: string | number;
    last?: number;
    next?: number;
    live?: boolean;
  }): Promise<Match[]>;
  getMatchDetail(matchId: string): Promise<MatchDetail>;

  // —— Optional richer catalog features (implemented where the provider/plan supports them) ——
  getCompetitions?(): Promise<CompetitionSummary[]>;
  /** Fixtures on a given day (YYYY-MM-DD), grouped by competition. */
  getMatchesByDate?(date: string): Promise<MatchDayGroup[]>;
  /** Fixtures within a local calendar day window [startMs, endMs) — kickoff in
   * the audience's timezone, not UTC. Grouped by competition. */
  getMatchesToday?(startMs: number, endMs: number): Promise<MatchDayGroup[]>;
  /** Currently in-play fixtures across all competitions, grouped by competition. */
  getLiveMatches?(): Promise<MatchDayGroup[]>;
  /** A single competition's fixtures on a given day (YYYY-MM-DD). */
  getCompetitionMatchDay?(competitionId: string, date: string): Promise<Match[]>;
  /** Knockout bracket (rounds + ties) for a competition. */
  getBracket?(competitionId: string, season?: string | number): Promise<BracketStage[]>;
  /** A team's fixtures in a competition + its group standing. */
  getTeamFixtures?(teamId: string, competitionId: string, season?: string | number): Promise<TeamFixtures>;
  /** A team's full schedule across every competition (next fixtures + recent results). */
  getTeamSchedule?(teamId: string): Promise<TeamSchedule>;
  getTopScorers?(
    competitionId: string,
    metric: ScorerMetric,
    season?: string | number,
  ): Promise<TopScorer[]>;
  /** Clubs taking part in a competition's season. */
  getTeams?(competitionId: string, season?: string | number): Promise<TeamProfile[]>;
  getTeam?(teamId: string): Promise<TeamProfile>;
  getSquad?(teamId: string): Promise<TeamSquad>;
  getPlayer?(playerId: string): Promise<PlayerProfile>;
  /** Referee profile: officiating stats + latest fixtures. */
  getReferee?(refereeId: string): Promise<RefereeProfile>;
}
