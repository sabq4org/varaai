import type { Match } from "@/lib/types";
import { MatchRow } from "./MatchRow";

/** A flat card list of matches (Results view). */
export function MatchList({ matches }: { matches: Match[] }) {
  if (!matches.length) {
    return <div className="px-6 py-12 text-center text-muted">لا توجد نتائج</div>;
  }
  return (
    <div className="card divide-y divide-line/60 overflow-hidden">
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} />
      ))}
    </div>
  );
}
