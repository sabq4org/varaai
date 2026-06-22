import Link from "next/link";
import type { SquadPlayer } from "@/lib/types";
import { Logo } from "./Logo";

/** Team roster list (mirrors iOS TeamDetailView squad section). */
export function SquadList({ players }: { players: SquadPlayer[] }) {
  if (!players.length) {
    return <div className="px-6 py-10 text-center text-muted">القائمة غير متاحة</div>;
  }
  return (
    <div className="card divide-y divide-line/60 overflow-hidden">
      {players.map((p) => (
        <Link
          key={p.player.id}
          href={`/players/${p.player.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2/60"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface2 text-xs font-bold text-muted tabular-nums">
            {p.number ?? "—"}
          </span>
          <Logo url={p.player.photo} alt={p.player.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{p.player.name}</span>
              {p.captain ? (
                <span className="rounded bg-accentDim px-1 text-[10px] font-bold text-[#d8fff3]">
                  C
                </span>
              ) : null}
            </div>
            <div className="text-xs text-muted">
              {[p.position, p.nationality].filter(Boolean).join(" · ")}
            </div>
          </div>
          <span className="text-muted">‹</span>
        </Link>
      ))}
    </div>
  );
}
