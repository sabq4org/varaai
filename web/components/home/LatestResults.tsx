import Link from "next/link";
import type { Match } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { formatDayMonth } from "@/lib/format";

/**
 * "أحدث النتائج" — a horizontally scrollable rail of finished matches. Each card
 * highlights the winner's crest and dims the loser, so results scan instantly.
 */
export function LatestResults({ matches }: { matches: Match[] }) {
  const finished = matches
    .filter((m) => m.state === "finished" && m.home.score != null && m.away.score != null)
    .slice(0, 10);
  if (!finished.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {finished.map((m) => (
        <ResultCard key={m.id} match={m} />
      ))}
    </div>
  );
}

function ResultCard({ match }: { match: Match }) {
  const hs = match.home.score ?? 0;
  const as = match.away.score ?? 0;
  const homeWin = hs > as;
  const awayWin = as > hs;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="card card-hover px-3 py-3"
    >
      <div className="mb-2 text-center text-[10px] font-semibold text-muted">
        {formatDayMonth(match.startTime)}
      </div>
      <Side win={homeWin} logo={match.home.team.logo} name={match.home.team.name} score={hs} />
      <div className="my-1.5 h-px bg-line/50" />
      <Side win={awayWin} logo={match.away.team.logo} name={match.away.team.name} score={as} />
    </Link>
  );
}

function Side({
  win,
  logo,
  name,
  score,
}: {
  win: boolean;
  logo?: string;
  name: string;
  score: number;
}) {
  return (
    <div className={`flex items-center gap-2 ${win ? "" : "opacity-55"}`}>
      <Logo url={logo} alt={name} size={22} />
      <span className="flex-1 truncate text-[13px] font-bold">{name}</span>
      <span className={`ltr text-base font-black tabular-nums ${win ? "text-accent" : ""}`}>
        {score}
      </span>
    </div>
  );
}
