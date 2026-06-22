import Link from "next/link";
import type { TopScorer } from "@/lib/types";
import { Logo } from "@/components/Logo";

/**
 * "سباق الهدّافين" — the marquee leaderboard. Player photos, nation crest and a
 * relative bar (goals ÷ leader's goals) so the race reads at a glance. The
 * leader wears a gold treatment; the rest fall into the accent rhythm.
 */
export function TopScorersRace({ scorers }: { scorers: TopScorer[] }) {
  const top = scorers.slice(0, 6);
  if (!top.length) return null;
  const max = top[0]?.total || 1;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-1 divide-y divide-line/40">
        {top.map((s, i) => {
          const leader = i === 0;
          const pct = Math.max(8, Math.round((s.total / max) * 100));
          return (
            <Link
              key={s.player.id}
              href={`/players/${s.player.id}`}
              className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface2/40 sm:px-4"
            >
              {/* rank */}
              <span
                className={`ltr w-6 shrink-0 text-center text-sm font-black tabular-nums ${
                  leader ? "text-gold" : "text-muted"
                }`}
              >
                {leader ? "★" : s.rank}
              </span>

              {/* photo */}
              <span className="relative h-12 w-12 shrink-0">
                <span
                  className={`absolute inset-0 rounded-full blur-md ${leader ? "bg-gold/25" : "bg-accent/15"}`}
                />
                {s.player.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.player.photo}
                    alt={s.player.name}
                    className={`relative h-12 w-12 rounded-full object-cover object-top ring-1 ${
                      leader ? "ring-gold/50" : "ring-line"
                    }`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface2">
                    <Logo url={s.team.logo} alt={s.team.name} size={28} />
                  </span>
                )}
              </span>

              {/* name + nation + bar */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold group-hover:text-accent">
                    {s.player.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                    <Logo url={s.team.logo} alt={s.team.name} size={16} />
                    <span className="hidden truncate sm:inline">{s.team.name}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                  <div
                    className={`h-full rounded-full ${
                      leader
                        ? "bg-gradient-to-l from-gold to-gold/40"
                        : "bg-gradient-to-l from-accent to-accentDim"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* goals */}
              <div className="ltr flex shrink-0 flex-col items-center">
                <span className={`text-2xl font-black tabular-nums ${leader ? "text-gold" : "text-accent"}`}>
                  {s.total}
                </span>
                <span className="text-[9px] font-semibold text-muted">هدف</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
