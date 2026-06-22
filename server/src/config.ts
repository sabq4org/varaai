// Loads config from the repo-root .env (Bun auto-loads .env, but we also read parent dir).

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.warn(`[config] Missing env var: ${name} — related provider will be disabled.`);
    return "";
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  apiFootball: {
    key: required("API_FOOTBALL_KEY"),
    baseUrl: "https://v3.football.api-sports.io",
  },
  sportmonks: {
    token: process.env.SPORTMONKS_API_TOKEN ?? "",
    baseUrl: "https://api.sportmonks.com/v3/football",
    // Sportmonks IDs for the Saudi Pro League (Roshn). Season auto-resolves at runtime.
    saudiProLeague: { id: "944" },
  },
  // Primary provider for Saudi data. Sportmonks now covers all Saudi competitions
  // with deeper stats + explicit VAR events; API-Football stays as fallback.
  primaryProvider: (process.env.PRIMARY_PROVIDER ?? "sportmonks") as "sportmonks" | "api-football",
  // Saudi-first defaults so the prototype works out of the box.
  defaults: {
    // API-Football IDs (fallback provider).
    saudiProLeague: { id: "307", season: 2025 },
  },
  cacheTtlMs: Number(process.env.CACHE_TTL_MS ?? 30_000),
} as const;
