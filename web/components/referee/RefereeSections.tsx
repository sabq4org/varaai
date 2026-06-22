import Link from "next/link";
import type { RefereeRecentMatch, RefereeStatItem } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { MatchScore } from "@/components/MatchScore";
import { SectionTitle } from "@/components/States";

/** Officiating numbers: a card per stat with its total and per-match rate. */
export function RefereeStats({ stats }: { stats: RefereeStatItem[] }) {
  if (!stats.length) return null;
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.key} className="card px-3 py-4 text-center">
          <div className="ltr text-2xl font-black text-accent tabular-nums">{s.total}</div>
          <div className="mt-1 text-[11px] leading-tight text-muted">{s.label}</div>
          {s.perMatch != null ? (
            <div className="ltr mt-1 text-[10px] font-semibold text-muted/80 tabular-nums">
              {s.perMatch} / مباراة
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Latest fixtures the referee officiated, most recent first. */
export function RefereeRecent({ matches }: { matches: RefereeRecentMatch[] }) {
  if (!matches.length) return null;
  return (
    <>
      <SectionTitle>آخر المباريات التي أدارها</SectionTitle>
      <div className="card overflow-hidden divide-y divide-line/40">
        {matches.map((m) => (
          <Link
            key={m.match.id}
            href={`/matches/${m.match.id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface2/60"
          >
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
              <span className="truncate text-sm font-semibold">{m.match.home.team.name}</span>
              <Logo url={m.match.home.team.logo} alt={m.match.home.team.name} size={26} />
            </div>

            <MatchScore match={m.match} />

            <div className="flex min-w-0 flex-1 items-center justify-start gap-2.5">
              <Logo url={m.match.away.team.logo} alt={m.match.away.team.name} size={26} />
              <span className="truncate text-sm font-semibold">{m.match.away.team.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
