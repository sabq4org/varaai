import Link from "next/link";
import type { BracketStage, Match } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { formatDayMonth, formatTime } from "@/lib/format";
import { seedName, isResolved } from "@/lib/bracket";

/**
 * "الطريق إلى النهائي" — the knockout path. A wrapped stepper of every round
 * (the road), then a grid of the opening round's actual ties. No horizontal
 * scrolling — everything wraps to fit.
 */
export function RoadToFinal({ stages }: { stages: BracketStage[] }) {
  if (!stages.length) return null;
  const first = stages.find((s) => s.matches.length) ?? stages[0];

  return (
    <div className="card overflow-hidden">
      {/* the road — rounds as a wrapped path */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
        {stages.map((s, i) => {
          const last = i === stages.length - 1;
          const active = s.id === first.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
                  last
                    ? "border-gold/50 bg-gold/15 text-gold"
                    : active
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-line/70 bg-surface2/40 text-muted"
                }`}
              >
                {last ? "🏆 " : ""}
                {s.name}
              </span>
              {!last ? <span className="text-line">—</span> : null}
            </div>
          );
        })}
      </div>

      {/* opening-round ties */}
      <div className="border-t border-line/50 bg-surface2/20 px-3 py-3.5 sm:px-4">
        <div className="mb-3 px-1 text-[11px] font-bold text-accent">{first.name} — المواجهات</div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {first.matches.map((m) => (
            <TieCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TieCard({ match }: { match: Match }) {
  return (
    <Link href={`/matches/${match.id}`} className="card card-hover px-3 py-2.5">
      <TieSide team={match.home.team} />
      <div className="my-1.5 flex items-center gap-2">
        <span className="h-px flex-1 bg-line/50" />
        <span className="text-[9px] font-bold text-muted">ضد</span>
        <span className="h-px flex-1 bg-line/50" />
      </div>
      <TieSide team={match.away.team} />
      <div className="mt-2 text-center text-[10px] font-semibold text-muted">
        {formatDayMonth(match.startTime)} · {formatTime(match.startTime)}
      </div>
    </Link>
  );
}

function TieSide({ team }: { team: { name: string; logo?: string } }) {
  const resolved = isResolved(team.name);
  return (
    <div className="flex items-center gap-2">
      {resolved ? (
        <Logo url={team.logo} alt={team.name} size={20} />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-[9px] text-muted">
          ?
        </span>
      )}
      <span className={`truncate text-[13px] ${resolved ? "font-bold" : "text-muted"}`}>
        {seedName(team.name)}
      </span>
    </div>
  );
}
