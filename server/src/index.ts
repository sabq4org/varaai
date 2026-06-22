import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { config } from "./config.ts";
import { withCache } from "./cache.ts";
import { apiFootball } from "./providers/apiFootball.ts";
import { sportmonks } from "./providers/sportmonks.ts";
import type {
  BracketStage,
  CompetitionSummary,
  Match,
  MatchDayGroup,
  MatchDetail,
  PlayerProfile,
  RefereeProfile,
  SportsProvider,
  Standings,
  TeamFixtures,
  TeamProfile,
  TeamSchedule,
  TeamSquad,
  TopScorer,
  VaraResponse,
} from "./types.ts";

const CATALOG_TTL = 300_000; // catalog data (clubs, players, squads) changes slowly

const app = new Hono();
app.use("*", cors());

const providers: Record<string, SportsProvider> = {
  sportmonks,
  "api-football": apiFootball,
};

// Pick provider: ?provider=api-football overrides the configured primary.
function pick(c: Context): SportsProvider {
  const q = c.req.query("provider");
  return (q && providers[q]) || providers[config.primaryProvider] || apiFootball;
}

function wrap<T>(value: T, cached: boolean, source: string): VaraResponse<T> {
  return { source, fetchedAt: new Date().toISOString(), cached, data: value };
}

app.get("/health", (c) => c.json({ ok: true, service: "vara-edge", time: new Date().toISOString() }));

// GET /v1/competitions/:id/standings?season=2025
app.get("/v1/competitions/:id/standings", async (c) => {
  const id = c.req.param("id");
  const season = c.req.query("season");
  const p = pick(c);
  const key = `${p.name}:standings:${id}:${season ?? "default"}`;
  try {
    const { value, cached } = await withCache(key, config.cacheTtlMs, () =>
      p.getStandings(id, season),
    );
    return c.json(wrap<Standings>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/competitions/:id/matches?status=last|next|live&count=10&season=2025
app.get("/v1/competitions/:id/matches", async (c) => {
  const id = c.req.param("id");
  const status = c.req.query("status") ?? "last";
  const count = Number(c.req.query("count") ?? 10);
  const season = c.req.query("season");
  const p = pick(c);
  const key = `${p.name}:matches:${id}:${status}:${count}:${season ?? "default"}`;
  // Live data gets a short TTL; finished/upcoming can cache longer.
  const ttl = status === "live" ? 8_000 : config.cacheTtlMs;
  try {
    const { value, cached } = await withCache(key, ttl, () =>
      p.getFixtures({
        competitionId: id,
        season,
        live: status === "live",
        last: status === "last" ? count : undefined,
        next: status === "next" ? count : undefined,
      }),
    );
    return c.json(wrap<Match[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/matches/today — today's fixtures across all competitions, grouped.
// GET /v1/matches/date/:date — same, for an explicit YYYY-MM-DD.
async function matchDay(c: Context, date: string) {
  const p = pick(c);
  if (!p.getMatchesByDate) return c.json({ error: `${p.name} لا يدعم مباريات اليوم` }, 501);
  const key = `${p.name}:matchday:${date}`;
  try {
    const { value, cached } = await withCache(key, 30_000, () => p.getMatchesByDate!(date));
    return c.json(wrap<MatchDayGroup[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Audience timezone offset (minutes east of UTC). Defaults to KSA (+03:00) so
// "today" follows the local calendar day, not UTC. Override with VARA_TZ_OFFSET_MIN.
const TZ_OFFSET_MIN = Number(process.env.VARA_TZ_OFFSET_MIN ?? 180);

// [start, end) epoch-ms bounds of the current local calendar day.
function localDayWindow(offsetMin: number = TZ_OFFSET_MIN): { startMs: number; endMs: number } {
  const DAY = 86_400_000;
  const shifted = Date.now() + offsetMin * 60_000; // wall-clock as if UTC
  const startMs = Math.floor(shifted / DAY) * DAY - offsetMin * 60_000;
  return { startMs, endMs: startMs + DAY };
}

// GET /v1/matches/today — fixtures kicking off during the local calendar day.
app.get("/v1/matches/today", async (c) => {
  const p = pick(c);
  const { startMs, endMs } = localDayWindow();
  if (p.getMatchesToday) {
    const key = `${p.name}:today:${startMs}`;
    try {
      const { value, cached } = await withCache(key, 30_000, () => p.getMatchesToday!(startMs, endMs));
      return c.json(wrap<MatchDayGroup[]>(value, cached, p.name));
    } catch (e) {
      return c.json({ error: (e as Error).message }, 502);
    }
  }
  // Fallback: providers without a window query use the local-day's start date.
  return matchDay(c, new Date(startMs).toISOString().slice(0, 10));
});
app.get("/v1/matches/date/:date", (c) => matchDay(c, c.req.param("date")));

// GET /v1/matches/live — currently in-play fixtures across all competitions, grouped.
app.get("/v1/matches/live", async (c) => {
  const p = pick(c);
  if (!p.getLiveMatches) return c.json({ error: `${p.name} لا يدعم المباشر` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:live`, 8_000, () => p.getLiveMatches!());
    return c.json(wrap<MatchDayGroup[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/matches/:id — full match detail (header + events + stats + lineups)
app.get("/v1/matches/:id", async (c) => {
  const id = c.req.param("id");
  const p = pick(c);
  // Live matches change fast; finished ones are stable.
  const key = `${p.name}:match-detail:${id}`;
  try {
    const { value, cached } = await withCache(key, 10_000, () => p.getMatchDetail(id));
    const live = value.match.state === "live";
    return c.json(wrap<MatchDetail>(value, cached && !live, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// Convenience shortcut for the prototype: Saudi Pro League.
app.get("/v1/saudi-pro-league/overview", async (c) => {
  const p = pick(c);
  // Each provider has its own Saudi Pro League ID + season convention.
  const sm = p.name === "sportmonks";
  const id = sm ? config.sportmonks.saudiProLeague.id : config.defaults.saudiProLeague.id;
  const season = sm ? undefined : config.defaults.saudiProLeague.season;
  try {
    const [standings, results] = await Promise.all([
      withCache(`${p.name}:standings:${id}:${season ?? "auto"}`, config.cacheTtlMs, () =>
        p.getStandings(id, season),
      ),
      withCache(`${p.name}:matches:${id}:last:10:${season ?? "auto"}`, config.cacheTtlMs, () =>
        p.getFixtures({ competitionId: id, season, last: 10 }),
      ),
    ]);
    return c.json({
      source: p.name,
      fetchedAt: new Date().toISOString(),
      cached: standings.cached && results.cached,
      data: { standings: standings.value, results: results.value },
    });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/competitions — list of competitions (Saudi-first catalog).
app.get("/v1/competitions", async (c) => {
  const p = pick(c);
  if (!p.getCompetitions) return c.json({ error: `${p.name} لا يدعم سرد البطولات` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:competitions`, CATALOG_TTL, () =>
      p.getCompetitions!(),
    );
    return c.json(wrap<CompetitionSummary[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/competitions/:id/matchday?date=YYYY-MM-DD — one competition's fixtures that day.
app.get("/v1/competitions/:id/matchday", async (c) => {
  const id = c.req.param("id");
  const date = c.req.query("date") ?? todayISO();
  const p = pick(c);
  if (!p.getCompetitionMatchDay) return c.json({ error: `${p.name} لا يدعم مباريات اليوم للبطولة` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:cmatchday:${id}:${date}`, 30_000, () =>
      p.getCompetitionMatchDay!(id, date),
    );
    return c.json(wrap<Match[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/competitions/:id/bracket — knockout rounds + ties.
app.get("/v1/competitions/:id/bracket", async (c) => {
  const id = c.req.param("id");
  const season = c.req.query("season");
  const p = pick(c);
  if (!p.getBracket) return c.json({ error: `${p.name} لا يدعم الأدوار الإقصائية` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:bracket:${id}:${season ?? "auto"}`, 60_000, () =>
      p.getBracket!(id, season),
    );
    return c.json(wrap<BracketStage[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/teams/:id/fixtures?competition=732 — a team's fixtures + group standing.
app.get("/v1/teams/:id/fixtures", async (c) => {
  const id = c.req.param("id");
  const competition = c.req.query("competition") ?? config.sportmonks.saudiProLeague.id;
  const p = pick(c);
  if (!p.getTeamFixtures) return c.json({ error: `${p.name} لا يدعم مباريات المنتخب` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:teamfx:${id}:${competition}`, 60_000, () =>
      p.getTeamFixtures!(id, competition),
    );
    return c.json(wrap<TeamFixtures>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/teams/:id/schedule — a team's full schedule across every competition.
app.get("/v1/teams/:id/schedule", async (c) => {
  const id = c.req.param("id");
  const p = pick(c);
  if (!p.getTeamSchedule) return c.json({ error: `${p.name} لا يدعم جدول الفريق` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:teamsched:${id}`, 5 * 60_000, () =>
      p.getTeamSchedule!(id),
    );
    return c.json(wrap<TeamSchedule>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/competitions/:id/topscorers?metric=goals|assists&season=
app.get("/v1/competitions/:id/topscorers", async (c) => {
  const id = c.req.param("id");
  const metric = c.req.query("metric") === "assists" ? "assists" : "goals";
  const season = c.req.query("season");
  const p = pick(c);
  if (!p.getTopScorers) return c.json({ error: `${p.name} لا يدعم الهدّافين` }, 501);
  try {
    const { value, cached } = await withCache(
      `${p.name}:topscorers:${id}:${metric}:${season ?? "auto"}`,
      CATALOG_TTL,
      () => p.getTopScorers!(id, metric, season),
    );
    return c.json(wrap<TopScorer[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/competitions/:id/teams — clubs in the competition.
app.get("/v1/competitions/:id/teams", async (c) => {
  const id = c.req.param("id");
  const season = c.req.query("season");
  const p = pick(c);
  if (!p.getTeams) return c.json({ error: `${p.name} لا يدعم سرد الأندية` }, 501);
  try {
    const { value, cached } = await withCache(
      `${p.name}:teams:${id}:${season ?? "auto"}`,
      CATALOG_TTL,
      () => p.getTeams!(id, season),
    );
    return c.json(wrap<TeamProfile[]>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/teams/:id — club profile.
app.get("/v1/teams/:id", async (c) => {
  const id = c.req.param("id");
  const p = pick(c);
  if (!p.getTeam) return c.json({ error: `${p.name} لا يدعم بيانات النادي` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:team:${id}`, CATALOG_TTL, () =>
      p.getTeam!(id),
    );
    return c.json(wrap<TeamProfile>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/teams/:id/squad — club roster.
app.get("/v1/teams/:id/squad", async (c) => {
  const id = c.req.param("id");
  const p = pick(c);
  if (!p.getSquad) return c.json({ error: `${p.name} لا يدعم القائمة` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:squad:${id}`, CATALOG_TTL, () =>
      p.getSquad!(id),
    );
    return c.json(wrap<TeamSquad>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/players/:id — player profile + season stats.
app.get("/v1/players/:id", async (c) => {
  const id = c.req.param("id");
  const p = pick(c);
  if (!p.getPlayer) return c.json({ error: `${p.name} لا يدعم بيانات اللاعب` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:player:${id}`, CATALOG_TTL, () =>
      p.getPlayer!(id),
    );
    return c.json(wrap<PlayerProfile>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// GET /v1/referees/:id — referee profile: officiating stats + latest fixtures.
app.get("/v1/referees/:id", async (c) => {
  const id = c.req.param("id");
  const p = pick(c);
  if (!p.getReferee) return c.json({ error: `${p.name} لا يدعم بيانات الحكم` }, 501);
  try {
    const { value, cached } = await withCache(`${p.name}:referee:${id}`, CATALOG_TTL, () =>
      p.getReferee!(id),
    );
    return c.json(wrap<RefereeProfile>(value, cached, p.name));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

// Serve the static preview UI.
app.get("/", async (c) => {
  const file = Bun.file(new URL("../public/index.html", import.meta.url));
  return c.html(await file.text());
});

console.log(`VARA edge listening on http://localhost:${config.port}`);
export default { port: config.port, fetch: app.fetch };
