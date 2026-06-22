import type { MatchStat } from "@/lib/types";

/** Comparative home/away stat bars (mirrors iOS StatsSection). */
export function StatsBars({ stats }: { stats: MatchStat[] }) {
  if (!stats.length) {
    return <div className="px-6 py-10 text-center text-muted">لا توجد إحصائيات</div>;
  }
  return (
    <div className="card flex flex-col gap-4 px-4 py-5">
      {stats.map((s) => (
        <StatRow key={s.key} stat={s} />
      ))}
    </div>
  );
}

function toNumber(v: number | string | null): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function StatRow({ stat }: { stat: MatchStat }) {
  const h = toNumber(stat.home);
  const a = toNumber(stat.away);
  const total = (h ?? 0) + (a ?? 0);
  const homePct = total > 0 ? ((h ?? 0) / total) * 100 : 50;
  const awayPct = 100 - homePct;
  const homeLeads = (h ?? 0) >= (a ?? 0);
  const display = (v: number | string | null) => (v == null ? "—" : String(v));

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className={`ltr font-bold tabular-nums ${homeLeads ? "text-text" : "text-muted"}`}>
          {display(stat.home)}
        </span>
        <span className="text-xs text-muted">{stat.label}</span>
        <span className={`ltr font-bold tabular-nums ${!homeLeads ? "text-text" : "text-muted"}`}>
          {display(stat.away)}
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <div
          style={{ width: `${homePct}%` }}
          className={homeLeads ? "bg-accent" : "bg-surface2"}
        />
        <div
          style={{ width: `${awayPct}%` }}
          className={!homeLeads ? "bg-accent" : "bg-surface2"}
        />
      </div>
    </div>
  );
}
