"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCupModel } from "@/lib/featured";

/** Segmented tabs for a competition. Cup tournaments (World Cup) get a
 * groups + knockout model instead of the league's flat table + clubs. */
export function CompetitionTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/competitions/${id}`;
  const cup = isCupModel(id);

  const tabs = cup
    ? [
        { href: base, label: "المجموعات" },
        { href: `${base}/bracket`, label: "الأدوار الإقصائية" },
        { href: `${base}/scorers`, label: "الهدّافون" },
        { href: `${base}/results`, label: "النتائج" },
      ]
    : [
        { href: base, label: "الترتيب" },
        { href: `${base}/results`, label: "النتائج" },
        { href: `${base}/scorers`, label: "الهدّافون" },
        { href: `${base}/clubs`, label: "الأندية" },
      ];

  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-line/70 bg-surface/60 p-1 backdrop-blur">
      {tabs.map((t) => {
        const active = t.href === base ? pathname === base : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "flex-1 whitespace-nowrap rounded-xl px-2 py-2.5 text-center text-sm font-bold transition-all",
              active
                ? "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
                : "text-muted hover:bg-surface2/60 hover:text-text",
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
