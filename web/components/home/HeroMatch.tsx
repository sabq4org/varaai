import Link from "next/link";
import type { Match } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { LiveMinute } from "@/components/LiveMinute";
import { Countdown } from "./Countdown";
import { formatFullDate, formatTime } from "@/lib/format";

/**
 * Broadcast-style hero ("بلك كبير"): a dark cinematic stage (fixed dark in both
 * themes, like a TV screen on the page). Live → huge glowing score + ticking
 * minute; upcoming → countdown. Big crests, group/round lower-third, venue.
 */
export function HeroMatch({
  match,
  group,
  eventName,
  inProgress = false,
}: {
  match: Match;
  group?: string;
  eventName: string;
  /** Kicked off but the provider hasn't flipped it to "live" yet. */
  inProgress?: boolean;
}) {
  const live = match.state === "live";
  const playing = live || inProgress;
  const knowScore = match.home.score != null || match.away.score != null;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="hero-stage group relative block overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]"
    >
      {/* hairline highlight + soft spotlight behind the center */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="hero-spot pointer-events-none absolute left-1/2 top-1/2 h-64 w-[60%] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-3xl" />

      <div className="relative px-5 py-7 text-white sm:px-8 sm:py-9">
        {/* lower-third */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-white ring-1 ring-inset ring-white/15 backdrop-blur">
            {eventName}
          </span>
          {group ? (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/75 ring-1 ring-inset ring-white/10">
              {group}
            </span>
          ) : null}
          {match.round ? (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/75 ring-1 ring-inset ring-white/10">
              الجولة {match.round}
            </span>
          ) : null}
          {playing ? <LiveTag /> : null}
        </div>

        {/* teams + center */}
        <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          <TeamSide name={match.home.team.name} logo={match.home.team.logo} />

          <div className="flex flex-col items-center gap-2.5 text-center">
            {live || (inProgress && knowScore) ? (
              <>
                <div
                  className="ltr text-5xl font-black tabular-nums sm:text-7xl"
                  style={{ textShadow: "0 2px 18px rgba(0,0,0,.45)" }}
                >
                  {match.away.score ?? 0}
                  <span className="mx-2 text-white/35">:</span>
                  {match.home.score ?? 0}
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-bold text-white ring-1 ring-inset ring-white/15">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF7A88]" />
                  {live ? <LiveMinute match={match} withHalf /> : "جارية الآن"}
                </div>
              </>
            ) : inProgress ? (
              <>
                <div className="ltr text-4xl font-black tracking-[0.2em] text-white/85 sm:text-5xl">
                  VS
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-bold text-white ring-1 ring-inset ring-white/15">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF7A88]" />
                  جارية الآن
                </div>
              </>
            ) : (
              <>
                <Countdown to={match.startTime} tone="glass" />
                <div className="mt-1 text-xs text-white/70">{formatTime(match.startTime)}</div>
              </>
            )}
          </div>

          <TeamSide name={match.away.team.name} logo={match.away.team.logo} />
        </div>

        {/* footer */}
        <div className="mt-8 flex items-center justify-center gap-3 text-xs text-white/55">
          {!playing ? <span>{formatFullDate(match.startTime)}</span> : null}
          {match.venue ? <span>{match.venue}</span> : null}
          <span className="font-semibold text-white/85 transition group-hover:text-white">
            {playing ? "تابِع التفاصيل ←" : "تفاصيل المباراة ←"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TeamSide({ name, logo }: { name: string; logo?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-125 rounded-full bg-white/10 blur-lg" />
        <div className="relative grid h-[88px] w-[88px] place-items-center rounded-full bg-white/8 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
          <Logo url={logo} alt={name} size={60} />
        </div>
      </div>
      <span className="line-clamp-2 text-sm font-extrabold sm:text-lg">{name}</span>
    </div>
  );
}

function LiveTag() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[#FF7A88]/20 px-2.5 py-1 text-[#FFD7DC] ring-1 ring-inset ring-[#FF7A88]/30">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF7A88] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF7A88]" />
      </span>
      مباشر
    </span>
  );
}
