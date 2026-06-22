// Typed client for the VARA Edge API. The site reads ONLY from Edge — never
// from data providers directly (same contract as the iOS VaraClient).
import "server-only";
import type {
  BracketStage,
  CompetitionSummary,
  Match,
  MatchDayGroup,
  MatchDetail,
  OverviewResponse,
  PlayerProfile,
  RefereeProfile,
  ScorerMetric,
  Standings,
  TeamProfile,
  TeamSchedule,
  TeamSquad,
  TopScorer,
  VaraResponse,
} from "./types";

const BASE = (process.env.VARA_EDGE_URL ?? "http://localhost:8787").replace(/\/$/, "");

/** Default Saudi Pro League id on the primary provider (Sportmonks). */
export const DEFAULT_COMPETITION_ID = "944";
export const DEFAULT_COMPETITION_NAME = "دوري روشن السعودي";

type FetchOpts = {
  /** ISR window in seconds. Live endpoints use a short value; catalog data longer. */
  revalidate?: number;
};

async function get<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate: opts.revalidate ?? 30 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { error?: string };
      detail = j.error ? `: ${j.error}` : "";
    } catch {
      /* ignore */
    }
    throw new VaraEdgeError(`VARA Edge ${path} -> HTTP ${res.status}${detail}`, res.status);
  }
  return (await res.json()) as T;
}

export class VaraEdgeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "VaraEdgeError";
    this.status = status;
  }
}

/** Unwrap a VaraResponse envelope into its data payload. */
async function getData<T>(path: string, opts?: FetchOpts): Promise<T> {
  const env = await get<VaraResponse<T>>(path, opts);
  return env.data;
}

// ——— Endpoints (mirror ios/VARA/Networking/VaraClient.swift) ———

export const vara = {
  overview: () => get<OverviewResponse>(`/v1/saudi-pro-league/overview`, { revalidate: 30 }),

  standings: (competitionId: string) =>
    getData<Standings>(`/v1/competitions/${competitionId}/standings`, { revalidate: 60 }),

  matches: (
    competitionId: string,
    status: "last" | "next" | "live" = "last",
    count = 12,
  ) =>
    getData<Match[]>(
      `/v1/competitions/${competitionId}/matches?status=${status}&count=${count}`,
      { revalidate: status === "live" ? 8 : 30 },
    ),

  matchesToday: () => getData<MatchDayGroup[]>(`/v1/matches/today`, { revalidate: 30 }),

  matchesOnDate: (date: string) =>
    getData<MatchDayGroup[]>(`/v1/matches/date/${date}`, { revalidate: 60 }),

  matchesLive: () => getData<MatchDayGroup[]>(`/v1/matches/live`, { revalidate: 8 }),

  matchDetail: (id: string) =>
    getData<MatchDetail>(`/v1/matches/${id}`, { revalidate: 15 }),

  competitions: () =>
    getData<CompetitionSummary[]>(`/v1/competitions`, { revalidate: 300 }),

  topScorers: (competitionId: string, metric: ScorerMetric = "goals") =>
    getData<TopScorer[]>(
      `/v1/competitions/${competitionId}/topscorers?metric=${metric}`,
      { revalidate: 300 },
    ),

  bracket: (competitionId: string) =>
    getData<BracketStage[]>(`/v1/competitions/${competitionId}/bracket`, { revalidate: 120 }),

  teams: (competitionId: string) =>
    getData<TeamProfile[]>(`/v1/competitions/${competitionId}/teams`, { revalidate: 300 }),

  team: (id: string) => getData<TeamProfile>(`/v1/teams/${id}`, { revalidate: 300 }),

  squad: (teamId: string) => getData<TeamSquad>(`/v1/teams/${teamId}/squad`, { revalidate: 300 }),

  teamSchedule: (teamId: string) =>
    getData<TeamSchedule>(`/v1/teams/${teamId}/schedule`, { revalidate: 120 }),

  player: (id: string) => getData<PlayerProfile>(`/v1/players/${id}`, { revalidate: 300 }),

  referee: (id: string) => getData<RefereeProfile>(`/v1/referees/${id}`, { revalidate: 300 }),

  /** Raw envelope variant for callers that need source/cached metadata. */
  standingsEnvelope: (competitionId: string) =>
    get<VaraResponse<Standings>>(`/v1/competitions/${competitionId}/standings`, { revalidate: 60 }),
};
