import Link from "next/link";
import type { BracketStage, Match, Team } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { formatDayMonth, formatTime } from "@/lib/format";
import { seedName, isResolved } from "@/lib/bracket";

/** Full knockout bracket — every round as a section with a grid of ties. */
export function Bracket({ stages }: { stages: BracketStage[] }) {
  const withMatches = stages.filter((s) => s.matches.length);
  if (!withMatches.length) {
    return <div className="px-6 py-12 text-center text-muted">لم تُحدَّد الأدوار الإقصائية بعد</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {withMatches.map((stage, i) => {
        const last = i === withMatches.length - 1;
        return (
          <section key={stage.id}>
            <div className="mb-3 flex items-center gap-2.5 px-1">
              <span className="rail" />
              <h2 className="text-base font-extrabold">
                {last ? "🏆 " : ""}
                {stage.name}
              </h2>
              <span className="ms-auto rounded-full border border-line/60 bg-surface/50 px-2.5 py-0.5 text-xs text-muted tabular-nums">
                {stage.matches.length} مواجهات
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {stage.matches.map((m) => (
                <TieCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TieCard({ match }: { match: Match }) {
  const finished = match.state === "finished";
  const live = match.state === "live";
  const showScore = finished || live;

  return (
    <Link href={`/matches/${match.id}`} className="card card-hover px-3.5 py-3">
      <TieSide team={match.home.team} score={match.home.score} showScore={showScore} />
      <div className="my-2 flex items-center gap-2">
        <span className="h-px flex-1 bg-line/50" />
        <span className={`text-[9px] font-bold ${live ? "text-lose" : "text-muted"}`}>
          {live ? "مباشر" : finished ? "انتهت" : "ضد"}
        </span>
        <span className="h-px flex-1 bg-line/50" />
      </div>
      <TieSide team={match.away.team} score={match.away.score} showScore={showScore} />
      {!showScore ? (
        <div className="mt-2.5 text-center text-[10px] font-semibold text-muted">
          {formatDayMonth(match.startTime)} · {formatTime(match.startTime)}
        </div>
      ) : null}
    </Link>
  );
}

function TieSide({
  team,
  score,
  showScore,
}: {
  team: Team;
  score: number | null;
  showScore: boolean;
}) {
  const resolved = isResolved(team.name);
  return (
    <div className="flex items-center gap-2">
      {resolved ? (
        <Logo url={team.logo} alt={team.name} size={22} />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-[9px] text-muted">
          ?
        </span>
      )}
      <span className={`flex-1 truncate text-sm ${resolved ? "font-bold" : "text-muted"}`}>
        {seedName(team.name)}
      </span>
      {showScore ? (
        <span className="ltr text-lg font-black tabular-nums">{score ?? 0}</span>
      ) : null}
    </div>
  );
}
