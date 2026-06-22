# 📄 VARA — The Precision of Sport: Master Project Brief

**Project Title:** VARA
**Last Updated:** 2026-06-21
**Status:** Saudi Pro League + World Cup Hub live (standings, results, match detail, xG/Pressure, knockout bracket, live minute, Live Activities)
**Target Platform:** iOS Native (Swift/SwiftUI) + VARA Edge (Bun/TypeScript)

---

## 1. 🎯 Vision & Strategy
VARA is a premium, data-driven, multi-sport application. The name continues from VAR technology — evoking **precision and a trusted final verdict**. Global in ambition, but **Saudi-first** in execution.

- **Brand Essence:** Precision, Speed, and Technical Depth.
- **Motto:** "The Precision of Sport."
- **Audience priority:** 🇸🇦 Saudi → Gulf → Global.
- **Sports priority (Phase 1):** Football + Esports. More sports added later.

---

## 2. 🏗️ Information Architecture (revised priority order)
Ordered by the validated product priority — foundation first, then live, then the growth engine:

1. **LEVEL 1 — The Foundation (Results & Standings)** ✅ *prototype done*
   - Live scores, results, fixtures, league tables, top scorers.
   - Personalized onboarding (favorite teams/competitions).
   - Home-screen Widgets (WidgetKit).
2. **LEVEL 2 — The Pulse (Real-Time)**
   - Live Match Center, Live Activities & Dynamic Island.
   - **"VARA Moment":** signature interactive timeline of every VAR decision.
   - Smart contextual notifications (momentum shifts, VAR checks, key subs/injuries).
3. **LEVEL 3 — The Engine (Community)** *— the retention driver*
   - Predictions & community voting, discussions, fan challenges, leaderboards.

> Depth analytics (xG, heatmaps, player ratings) and the Transfer Hub layer onto Levels 1–2 as data plans allow.

---

## 3. ⚙️ Technical Stack & Architecture

### VARA Edge — Aggregation Layer (KEY DECISION)
The iOS app **never talks to data providers directly**. It talks only to **VARA Edge**, which:
1. Aggregates multiple providers and normalizes them into the **VARA unified schema**.
2. Caches (in-memory now → Redis/Edge KV in production) so the poller is the only process hitting providers — protecting rate limits and giving sub-second open times.
3. Exposes one fast, provider-agnostic API (REST now → SSE/WebSocket for live).
4. Lets us **swap any provider without touching the app**.

- **Runtime:** Bun + TypeScript + Hono. Deploy target: Edge (Vercel/Cloudflare).
- **iOS:** Native SwiftUI (iOS 17+), Swift 6, SwiftData (offline-first), WidgetKit, Live Activities.

### Data Sources (validated 2026-06-21)
| Provider | Role | Status |
| --- | --- | --- |
| **Sportmonks** | **Primary (football)** | ✅ Saudi Pro League (id 944) + World Cup (id 732). Includes squads, player profiles, top scorers, live events, **xG & Pressure Index add-on enabled**, real-time live minute via `periods`. |
| **API-Football** | Secondary / fallback | ✅ Saudi Pro League (id 307) + others; selectable via `?provider=apifootball`. |
| **PandaScore** | Primary (esports) | Planned — LoL/CS2/Dota/Valorant, 300ms latency |
| **GRID** | Official esports (scale) | Future — enterprise |

Provider selection: `config.primaryProvider` (Sportmonks) with per-request override via `?provider=`.

---

## 4. 🔌 VARA Edge API (current)

**Core**
- `GET /health`
- `GET /` — prototype preview UI (dark, RTL Arabic)
- `GET /v1/saudi-pro-league/overview` — convenience (standings + recent results)

**Competitions & catalog**
- `GET /v1/competitions` — competition list (World Cup prioritized in season)
- `GET /v1/competitions/:id/standings?season=` — table; supports **grouped** standings (`grouped:true`, `group` per row) for the World Cup's 12 groups
- `GET /v1/competitions/:id/matches?status=last|next|live&count=&season=`
- `GET /v1/competitions/:id/topscorers?metric=goals|assists`
- `GET /v1/competitions/:id/teams`

**Match day, live & World Cup**
- `GET /v1/matches/today` · `GET /v1/matches/date/:date` · `GET /v1/matches/live` — grouped by competition
- `GET /v1/competitions/:id/matchday?date=YYYY-MM-DD` — **one competition's** fixtures that day (scopes the "Today" tab so leagues never mix)
- `GET /v1/competitions/:id/bracket` — knockout rounds + ties (Arabic round names, ordered Round-of-32 → Final)
- `GET /v1/teams/:id/fixtures?competition=732` — a team's fixtures + its group & rank (favourite-team card)
- `GET /v1/matches/:id` — full match detail (header + events + stats + lineups + xG + Pressure + **real-time live minute**)

**Teams & players**
- `GET /v1/teams/:id` · `GET /v1/teams/:id/squad` · `GET /v1/players/:id`

### Live minute (real-time, lag-free)
The ticking `period` from Sportmonks gives `started` (unix) + `type_id`. The edge computes the absolute minute = `base(0/45/90/105) + floor((now − started)/60)` and returns `minute`, `liveStartedAt`, `liveBase`. The iOS app recomputes `currentMinute` locally each second via `TimelineView`, so the clock is accurate regardless of cache/poll timing.

Run locally: `cd server && bun run dev` → http://localhost:8787

---

## 4b. 🏆 World Cup Hub (iOS)
The World Cup is a **dedicated hub experience**, not squeezed into the league layout:
- **Onboarding** — `FavoriteTeamPicker` (48 nations, Arabic names + flags, search). Persisted in `FavoritesModel` (`UserDefaults`).
- **`WorldCupHubView`** — live/next hero with the real-time minute + "تابِع مباشرة"; "منتخبي" card (next fixture, group, rank, last result); section tiles (Groups / Bracket / Top scorers); today's World Cup fixtures only.
- **`BracketView`** — round chips + tie cards (Arabic round names).
- **Grouped standings** — reuses `StandingsView` group bucketing for the 12 groups.
- **Default landing** — the active competition defaults to the World Cup (id 732) during the tournament; switchable to Roshn from the header.
- **Today tab** — scoped to the active competition only (no cross-league mixing).
- **Live match screen** — `MatchDetailView` polls every ~10s; events shown **newest-first**.
- **Live Activities** — `VARAWidgets` extension + shared `MatchActivityAttributes`; lock-screen + Dynamic Island card (teams, score, live minute). Updated locally while the app runs (APNs push = next step).

---

## 5. 🔐 Security Notes
- API keys live in repo-root `.env` (gitignored). `.env.example` is the template.
- **Action required:** the keys shared during setup were exposed in chat — **regenerate them** in each provider dashboard before launch.

---

## 6. 🗺️ Next Steps
1. **APNs push** for Live Activities — update the lock screen / Dynamic Island while the app is closed (currently local updates only).
2. Goal/VAR notifications for the favourite national team.
3. Arabic transliteration coverage for international squad players (national-team stars).
4. Smart default landing — auto-show the World Cup only while it's active, then fall back to Roshn.
5. Wire PandaScore for esports (same unified schema).
6. Add SSE/WebSocket live layer to replace polling for Level 2.

---

**Authorized by:** Ali Alhazmi (Abu Mohammed)
**Build partner:** صحبة (Digital Editorial Partner)
