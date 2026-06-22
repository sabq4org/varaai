import type { Match, TeamPair } from "@/lib/types";
import { Logo } from "@/components/Logo";

/** Dominance share from the Pressure Index (mirrors iOS "مؤشّر السيطرة"). */
export function PressureBar({ pressure, match }: { pressure: TeamPair; match: Match }) {
  const home = pressure.home ?? 0;
  const away = pressure.away ?? 0;
  if (home + away <= 0) return null;
  const homeLeads = home >= away;

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="rail !h-3.5" />
        <span className="font-bold">مؤشّر السيطرة</span>
        <span className="text-muted/70">— من نحو الهجوم على المرمى</span>
      </div>

      <div className="flex items-center justify-between text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <Logo url={match.home.team.logo} alt="" size={18} />
          <span className={`ltr text-lg ${homeLeads ? "text-accent" : "text-muted"}`}>{home}%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`ltr text-lg ${!homeLeads ? "text-accent" : "text-muted"}`}>{away}%</span>
          <Logo url={match.away.team.logo} alt="" size={18} />
        </span>
      </div>

      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-surface2 ring-1 ring-inset ring-line/60">
        <div
          style={{ width: `${home}%` }}
          className={homeLeads ? "bg-gradient-to-l from-accent to-accentDim" : "bg-line"}
        />
        <div className="w-px bg-bg/40" />
        <div
          style={{ width: `${away}%` }}
          className={!homeLeads ? "bg-gradient-to-r from-accent to-accentDim" : "bg-line"}
        />
      </div>
    </div>
  );
}
