import type { MatchDetail } from "@/lib/types";

/** Compact per-half score breakdown, e.g. "الشوط الأول 0:1 · الشوط الثاني 0:0". */
export function PeriodScores({ detail }: { detail: MatchDetail }) {
  const periods = detail.periodScores;
  if (!periods?.length) return null;

  return (
    <div className="card flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3">
      {periods.map((p) => (
        <div key={p.key} className="flex items-center gap-2 text-sm">
          <span className="text-muted">{p.label}</span>
          {/* away : home keeps the home team's score on the right (RTL). */}
          <span className="ltr font-bold tabular-nums">
            {p.away} : {p.home}
          </span>
        </div>
      ))}
    </div>
  );
}
