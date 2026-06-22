import Link from "next/link";
import type { MatchDayGroup } from "@/lib/types";
import { Logo } from "./Logo";
import { MatchRow } from "./MatchRow";

/** A list of competitions, each a card of match rows (Today / Live / Date views). */
export function GroupedMatches({ groups }: { groups: MatchDayGroup[] }) {
  if (!groups.length) {
    return <div className="px-6 py-12 text-center text-muted">لا توجد مباريات</div>;
  }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <section key={g.competition.id} className="card overflow-hidden">
          <header className="flex items-center gap-2.5 border-b border-line/70 bg-surface2/30 px-4 py-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line/70 bg-bg/40">
              <Logo url={g.competition.logo} alt={g.competition.name} size={20} />
            </span>
            <Link
              href={`/competitions/${g.competition.id}`}
              className="font-bold hover:text-accent"
            >
              {g.competition.name}
            </Link>
            <span className="ms-auto rounded-full border border-line/60 bg-bg/40 px-2.5 py-0.5 text-xs text-muted tabular-nums">
              {g.matches.length} مباريات
            </span>
          </header>
          <div className="divide-y divide-line/60">
            {g.matches.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** True if any match across the groups is currently live. */
export function hasLive(groups: MatchDayGroup[]): boolean {
  return groups.some((g) => g.matches.some((m) => m.state === "live"));
}
