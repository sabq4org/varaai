"use client";

import { useMemo, useState } from "react";
import type { Match, MatchDayGroup } from "@/lib/types";
import { GroupedMatches } from "@/components/GroupedMatches";

type Filter = "live" | "all" | "upcoming";

/** Keep only matches that pass `keep`, dropping competitions left empty. */
function filterGroups(groups: MatchDayGroup[], keep: (m: Match) => boolean): MatchDayGroup[] {
  return groups
    .map((g) => ({ ...g, matches: g.matches.filter(keep) }))
    .filter((g) => g.matches.length > 0);
}

function LiveDot() {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
    </span>
  );
}

const EMPTY: Record<Filter, string> = {
  live: "لا توجد مباريات مباشرة الآن",
  all: "لا توجد مباريات اليوم",
  upcoming: "لا توجد مباريات قادمة اليوم",
};

/**
 * Today's fixtures with a segmented filter: مباشر (live) / اليوم (all) /
 * القادمة (upcoming). Filtering is state-based (no clock) to stay
 * hydration-safe. Defaults to the live tab when matches are in play.
 */
export function TodayMatches({ groups }: { groups: MatchDayGroup[] }) {
  const live = useMemo(() => filterGroups(groups, (m) => m.state === "live"), [groups]);
  const upcoming = useMemo(
    () => filterGroups(groups, (m) => m.state === "scheduled"),
    [groups],
  );

  const liveCount = useMemo(
    () => live.reduce((n, g) => n + g.matches.length, 0),
    [live],
  );
  const upcomingCount = useMemo(
    () => upcoming.reduce((n, g) => n + g.matches.length, 0),
    [upcoming],
  );
  const allCount = useMemo(
    () => groups.reduce((n, g) => n + g.matches.length, 0),
    [groups],
  );

  const [filter, setFilter] = useState<Filter>(liveCount > 0 ? "live" : "all");

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "live", label: "مباشر", count: liveCount },
    { key: "all", label: "اليوم", count: allCount },
    { key: "upcoming", label: "القادمة", count: upcomingCount },
  ];

  const shown = filter === "live" ? live : filter === "upcoming" ? upcoming : groups;

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-2xl border border-line/70 bg-surface/60 p-1 backdrop-blur">
        {tabs.map((t) => {
          const active = filter === t.key;
          const isLive = t.key === "live";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-center text-sm font-bold transition-all",
                active
                  ? "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
                  : "text-muted hover:bg-surface2/60 hover:text-text",
              ].join(" ")}
            >
              {isLive && t.count > 0 ? <LiveDot /> : null}
              <span>{t.label}</span>
              {t.count > 0 ? (
                <span
                  className={[
                    "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums",
                    isLive
                      ? "bg-red-500 text-white"
                      : active
                        ? "bg-accent/20 text-accent"
                        : "bg-surface2/70 text-muted",
                  ].join(" ")}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {shown.length ? (
        <GroupedMatches groups={shown} />
      ) : (
        <div className="card px-6 py-12 text-center text-muted">{EMPTY[filter]}</div>
      )}
    </div>
  );
}
