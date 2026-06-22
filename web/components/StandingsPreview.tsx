import Link from "next/link";
import type { Standings } from "@/lib/types";
import { Logo } from "./Logo";

/** Compact top-N standings teaser for the home page. */
export function StandingsPreview({
  standings,
  limit = 6,
}: {
  standings: Standings;
  limit?: number;
}) {
  const rows = standings.rows.slice(0, limit);
  if (!rows.length) return null;
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <Logo url={standings.competition.logo} alt={standings.competition.name} size={22} />
        <span className="font-bold">{standings.competition.name}</span>
        <Link
          href={`/competitions/${standings.competition.id}`}
          className="ms-auto text-xs font-semibold text-accent hover:underline"
        >
          الترتيب الكامل
        </Link>
      </header>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.team.id} className="border-t border-line/60">
              <td className="w-10 py-2.5 text-center">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                    r.rank <= 3 ? "bg-accentDim text-[#d8fff3]" : "bg-surface2 text-muted"
                  }`}
                >
                  {r.rank}
                </span>
              </td>
              <td className="py-2.5">
                <Link
                  href={`/teams/${r.team.id}`}
                  className="flex items-center gap-2 font-semibold hover:text-accent"
                >
                  <Logo url={r.team.logo} alt={r.team.name} size={22} />
                  <span className="truncate">{r.team.name}</span>
                </Link>
              </td>
              <td className="px-2 py-2.5 text-center text-xs text-muted tabular-nums">
                {r.played} لعب
              </td>
              <td className="px-3 py-2.5 text-center font-extrabold text-accent tabular-nums">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
