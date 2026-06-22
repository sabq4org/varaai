import type { MatchDetail } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { LiveMinute } from "@/components/LiveMinute";
import { fmt2, formatFullDate, formatTime, matchStatusText } from "@/lib/format";

/**
 * Broadcast-style match header — a fixed dark "stage" (same language as the home
 * hero) so the match page opens with presence in both themes. Score / live
 * minute / status, big crests, xG lower-third and venue.
 */
export function MatchHeader({ detail }: { detail: MatchDetail }) {
  const { match } = detail;
  const live = match.state === "live";
  const scheduled = match.state === "scheduled";
  const hasXg = detail.xg && (detail.xg.home != null || detail.xg.away != null);

  return (
    <div className="hero-stage relative overflow-hidden rounded-3xl border border-white/10">
      {/* hairline highlight + soft spotlight (toned down vs. the home hero) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="hero-spot pointer-events-none absolute left-1/2 top-1/2 h-52 w-[55%] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-3xl" />

      <div className="relative px-5 py-6 text-white sm:px-8 sm:py-7">
        <div className="text-center text-xs font-bold text-white/70">{detail.competitionName}</div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <TeamCol logo={match.home.team.logo} name={match.home.team.name} />

          <div className="flex flex-col items-center gap-2 text-center">
            {scheduled ? (
              <div className="ltr text-3xl font-black tabular-nums sm:text-4xl">
                {formatTime(match.startTime)}
              </div>
            ) : (
              <div
                className="ltr text-5xl font-black tabular-nums sm:text-6xl"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,.35)" }}
              >
                {match.away.score ?? 0}
                <span className="mx-2 text-white/35">:</span>
                {match.home.score ?? 0}
              </div>
            )}
            {live ? (
              <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-bold text-white ring-1 ring-inset ring-white/15">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF7A88]" />
                <LiveMinute match={match} withHalf />
              </div>
            ) : (
              <div className="text-sm font-bold text-white/60">
                {matchStatusText(match.state, match.minute)}
              </div>
            )}
          </div>

          <TeamCol logo={match.away.team.logo} name={match.away.team.name} />
        </div>

        {hasXg ? (
          <div className="mt-5 flex justify-center">
            <span className="ltr inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-inset ring-white/10 backdrop-blur">
              {fmt2(detail.xg!.away)}
              <span className="text-[#7CF5D7]">xG</span>
              {fmt2(detail.xg!.home)}
            </span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-white/55">
          {scheduled ? <span>{formatFullDate(match.startTime)}</span> : null}
          {match.venue ? <span>{match.venue}</span> : null}
        </div>
      </div>
    </div>
  );
}

function TeamCol({ logo, name }: { logo?: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-110 rounded-full bg-white/5 blur-md" />
        <div className="relative grid h-[76px] w-[76px] place-items-center rounded-full bg-white/8 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
          <Logo url={logo} alt={name} size={52} />
        </div>
      </div>
      <span className="line-clamp-2 text-sm font-extrabold sm:text-base">{name}</span>
    </div>
  );
}
