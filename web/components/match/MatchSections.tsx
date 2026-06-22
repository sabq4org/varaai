"use client";

import { useState } from "react";
import type { MatchDetail } from "@/lib/types";
import { EventsTimeline } from "./EventsTimeline";
import { StatsBars } from "./StatsBars";
import { Lineups } from "./Lineups";

type Tab = "events" | "stats" | "lineups";

/** Section picker for the match detail (الأحداث / الإحصائيات / التشكيلة). */
export function MatchSections({ detail }: { detail: MatchDetail }) {
  const [tab, setTab] = useState<Tab>("events");
  const tabs: { key: Tab; label: string }[] = [
    { key: "events", label: "الأحداث" },
    { key: "stats", label: "الإحصائيات" },
    { key: "lineups", label: "التشكيلة" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-2xl border border-line/70 bg-surface/60 p-1 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition-all",
              tab === t.key
                ? "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
                : "text-muted hover:bg-surface2/60 hover:text-text",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "events" ? <EventsTimeline detail={detail} /> : null}
      {tab === "stats" ? <StatsBars stats={detail.stats} /> : null}
      {tab === "lineups" ? <Lineups detail={detail} /> : null}
    </div>
  );
}
