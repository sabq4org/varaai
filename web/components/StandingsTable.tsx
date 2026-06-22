import Link from "next/link";
import type { Standings, StandingRow } from "@/lib/types";
import { Logo } from "./Logo";
import { FormDots } from "./FormDots";

/** League table mirroring the iOS StandingsView, including group support. */
export function StandingsTable({ standings }: { standings: Standings }) {
  if (!standings.rows.length) {
    return <div className="px-6 py-12 text-center text-muted">لا يوجد ترتيب لهذه البطولة</div>;
  }

  if (standings.grouped) {
    const groups = new Map<string, StandingRow[]>();
    for (const r of standings.rows) {
      const key = r.group ?? "—";
      const bucket = groups.get(key) ?? [];
      bucket.push(r);
      groups.set(key, bucket);
    }
    return (
      <div className="flex flex-col gap-5">
        {[...groups.entries()].map(([name, rows]) => (
          <div key={name} className="card overflow-hidden">
            <div className="border-b border-line px-4 py-2.5 text-sm font-bold text-accent">
              {name}
            </div>
            <Table rows={rows} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <Table rows={standings.rows} />
    </div>
  );
}

function Table({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <Th className="w-10">#</Th>
            <Th className="text-start">الفريق</Th>
            <Th>لعب</Th>
            <Th className="hidden sm:table-cell">ف-ت-خ</Th>
            <Th className="hidden sm:table-cell">+/-</Th>
            <Th className="hidden sm:table-cell">الأخيرة</Th>
            <Th>نقاط</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team.id} className="border-t border-line/70">
              <Td>
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${
                    r.rank <= 3 ? "bg-accentDim text-[#d8fff3]" : "bg-surface2 text-text"
                  }`}
                >
                  {r.rank}
                </span>
              </Td>
              <Td className="text-start">
                <Link
                  href={`/teams/${r.team.id}`}
                  className="flex items-center gap-2.5 font-semibold hover:text-accent"
                >
                  <Logo url={r.team.logo} alt={r.team.name} size={24} />
                  <span className="truncate">{r.team.name}</span>
                </Link>
              </Td>
              <Td className="tabular-nums">{r.played}</Td>
              <Td className="ltr hidden tabular-nums sm:table-cell">
                {r.win}-{r.draw}-{r.lose}
              </Td>
              <Td className="ltr hidden tabular-nums sm:table-cell">
                {r.goalsDiff > 0 ? "+" : ""}
                {r.goalsDiff}
              </Td>
              <Td className="hidden sm:table-cell">
                <FormDots form={r.form} />
              </Td>
              <Td>
                <span className="font-extrabold text-accent tabular-nums">{r.points}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-2.5 py-3 text-center font-semibold ${className}`}>{children}</th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2.5 py-3 text-center ${className}`}>{children}</td>;
}
