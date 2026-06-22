import type { Match } from "@/lib/types";
import { formatDayMonth, formatTime, matchStatusText } from "@/lib/format";
import { LiveMinute } from "./LiveMinute";

/**
 * Center score box for a match row. For scheduled matches shows the kickoff
 * time; otherwise the score (LTR) with a date/minute/state caption underneath.
 * Live matches get an accent-colored score and a ticking minute.
 */
export function MatchScore({ match }: { match: Match }) {
  const live = match.state === "live";
  const scheduled = match.state === "scheduled";

  return (
    <div
      className={`w-[84px] shrink-0 rounded-xl border px-2 py-1.5 text-center ${
        live
          ? "border-accent/40 bg-accent/10 shadow-[0_0_18px_-6px_rgb(var(--c-accent)/0.6)]"
          : "border-line bg-surface2"
      }`}
    >
      {scheduled ? (
        <div className="ltr whitespace-nowrap text-sm font-bold tabular-nums">
          {formatTime(match.startTime)}
        </div>
      ) : (
        <div className={`ltr text-lg font-extrabold tabular-nums ${live ? "text-accent" : ""}`}>
          {match.away.score ?? "-"} : {match.home.score ?? "-"}
        </div>
      )}
      <div
        className={`mt-0.5 text-[9px] font-semibold tracking-wide ${
          live ? "text-accent" : "text-muted"
        }`}
      >
        {scheduled ? (
          "بدء"
        ) : live ? (
          <LiveMinute match={match} />
        ) : (
          `${matchStatusText(match.state, match.minute)} · ${formatDayMonth(match.startTime)}`
        )}
      </div>
    </div>
  );
}
