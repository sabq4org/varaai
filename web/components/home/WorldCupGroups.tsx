import Link from "next/link";
import type { Standings, StandingRow } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { FormDots } from "@/components/FormDots";

/** Responsive grid of compact group tables with form + goal difference. */
export function WorldCupGroups({ standings }: { standings: Standings }) {
  if (!standings.rows.length) return null;

  const groups = new Map<string, StandingRow[]>();
  for (const r of standings.rows) {
    const key = r.group ?? "—";
    const bucket = groups.get(key) ?? [];
    bucket.push(r);
    groups.set(key, bucket);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...groups.entries()].map(([name, rows]) => (
        <div key={name} className="card card-hover overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 bg-surface2/30 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-bold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--c-accent))]" />
              {name}
            </span>
            <span className="ltr flex gap-2 pe-0.5 text-[9px] font-bold text-muted/80">
              <span className="w-9 text-center">آخر 5</span>
              <span className="w-6 text-center">±</span>
              <span className="w-5 text-center">نقاط</span>
            </span>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {rows.slice(0, 4).map((r, i) => {
                const qualifies = i < 2;
                const gd = r.goalsDiff ?? 0;
                return (
                  <tr
                    key={r.team.id}
                    className={`border-t border-line/40 transition-colors hover:bg-surface2/40 ${
                      qualifies ? "bg-accent/[0.04]" : ""
                    }`}
                  >
                    <td className="relative w-7 py-2 text-center">
                      {qualifies ? (
                        <span className="absolute inset-y-1.5 right-0 w-0.5 rounded-full bg-accent/70" />
                      ) : null}
                      <span className={`tabular-nums ${qualifies ? "font-bold text-accent" : "text-xs text-muted"}`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-1.5">
                      <Link
                        href={`/teams/${r.team.id}`}
                        className="flex items-center gap-2 font-medium hover:text-accent"
                      >
                        <Logo url={r.team.logo} alt={r.team.name} size={20} />
                        <span className="truncate">{r.team.name}</span>
                      </Link>
                    </td>
                    <td className="px-1 py-1.5">
                      <span className="flex w-9 justify-center">
                        {r.form ? <FormDots form={r.form} /> : <span className="text-muted">—</span>}
                      </span>
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <span
                        className={`ltr w-6 text-xs tabular-nums ${
                          gd > 0 ? "text-win" : gd < 0 ? "text-lose" : "text-muted"
                        }`}
                      >
                        {gd > 0 ? `+${gd}` : gd}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold tabular-nums">
                      <span className={qualifies ? "text-accent" : "text-text"}>{r.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
