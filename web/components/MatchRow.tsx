import Link from "next/link";
import type { Match } from "@/lib/types";
import { Logo } from "./Logo";
import { MatchScore } from "./MatchScore";

/**
 * One match row: home (right) — score (center) — away (left), with both crests
 * hugging the central score. The whole row links to the match detail page.
 */
export function MatchRow({ match }: { match: Match }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface2/60"
    >
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
        <span className="truncate text-sm font-semibold">{match.home.team.name}</span>
        <Logo url={match.home.team.logo} alt={match.home.team.name} size={26} />
      </div>

      <MatchScore match={match} />

      <div className="flex min-w-0 flex-1 items-center justify-start gap-2.5">
        <Logo url={match.away.team.logo} alt={match.away.team.name} size={26} />
        <span className="truncate text-sm font-semibold">{match.away.team.name}</span>
      </div>
    </Link>
  );
}
