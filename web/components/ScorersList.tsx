import Link from "next/link";
import type { ScorerMetric, TopScorer } from "@/lib/types";
import { Logo } from "./Logo";

/** Top scorers/assists list with a metric toggle (mirrors iOS ScorersView). */
export function ScorersList({
  scorers,
  metric,
  basePath,
}: {
  scorers: TopScorer[];
  metric: ScorerMetric;
  basePath: string;
}) {
  const unit = metric === "assists" ? "صناعة" : "هدف";
  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        <Toggle href={basePath} active={metric === "goals"} label="الأهداف" />
        <Toggle href={`${basePath}?metric=assists`} active={metric === "assists"} label="صناعة الأهداف" />
      </div>

      {scorers.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted">لا توجد بيانات</div>
      ) : (
        <div className="card divide-y divide-line/60 overflow-hidden">
          {scorers.map((s) => (
            <Link
              key={`${s.player.id}-${s.rank}`}
              href={`/players/${s.player.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2/60"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${
                  s.rank <= 3 ? "bg-accentDim text-[#d8fff3]" : "bg-surface2 text-muted"
                }`}
              >
                {s.rank}
              </span>
              <Logo url={s.player.photo} alt={s.player.name} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.player.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Logo url={s.team.logo} alt={s.team.name} size={14} />
                  <span className="truncate">{s.team.name}</span>
                </div>
              </div>
              <div className="text-end">
                <span className="text-lg font-extrabold text-accent tabular-nums">{s.total}</span>
                <span className="ms-1 text-xs text-muted">{unit}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={[
        "flex-1 rounded-xl border py-2.5 text-center text-sm font-semibold transition-colors",
        active
          ? "border-accentDim bg-surface2 text-text"
          : "border-line bg-surface text-muted hover:text-text",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
