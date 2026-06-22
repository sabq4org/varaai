import Link from "next/link";
import type { Match } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Countdown } from "./Countdown";

/** Compact "next match" card with a countdown — shown under a live hero. */
export function NextUp({ match, group }: { match: Match; group?: string }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="card card-hover mt-3 flex flex-wrap items-center justify-between gap-4 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent">القادمة</span>
        {group ? <span>{group}</span> : null}
      </div>

      <div className="flex items-center gap-2.5">
        <Logo url={match.home.team.logo} alt={match.home.team.name} size={24} />
        <span className="text-sm font-bold">{match.home.team.name}</span>
        <span className="text-muted">×</span>
        <span className="text-sm font-bold">{match.away.team.name}</span>
        <Logo url={match.away.team.logo} alt={match.away.team.name} size={24} />
      </div>

      <Countdown to={match.startTime} />
    </Link>
  );
}
