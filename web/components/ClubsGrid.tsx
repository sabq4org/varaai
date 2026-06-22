import Link from "next/link";
import type { TeamProfile } from "@/lib/types";
import { Logo } from "./Logo";

/** 2-column club grid (mirrors iOS ClubsView). */
export function ClubsGrid({ teams }: { teams: TeamProfile[] }) {
  if (!teams.length) {
    return <div className="px-6 py-12 text-center text-muted">لا توجد أندية</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {teams.map(({ team }) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="card flex flex-col items-center gap-2.5 px-3 py-5 text-center transition-colors hover:border-accentDim"
        >
          <Logo url={team.logo} alt={team.name} size={48} />
          <span className="truncate text-sm font-bold">{team.name}</span>
        </Link>
      ))}
    </div>
  );
}
