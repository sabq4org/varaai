import Link from "next/link";
import type { Match, TeamScheduleEntry } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { formatDayMonth, formatTime } from "@/lib/format";

/**
 * Opponent-centric schedule for a single team: who they play, where (home/away),
 * the kickoff for upcoming games and the result (win/draw/loss) for past ones.
 */
export function TeamScheduleView({
  teamId,
  upcoming,
  recent,
}: {
  teamId: string;
  upcoming: TeamScheduleEntry[];
  recent: TeamScheduleEntry[];
}) {
  if (!upcoming.length && !recent.length) return null;

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length ? (
        <ScheduleSection title="المباريات القادمة" entries={upcoming} teamId={teamId} />
      ) : null}
      {recent.length ? (
        <ScheduleSection title="النتائج الأخيرة" entries={recent} teamId={teamId} past />
      ) : null}
    </div>
  );
}

function ScheduleSection({
  title,
  entries,
  teamId,
  past = false,
}: {
  title: string;
  entries: TeamScheduleEntry[];
  teamId: string;
  past?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-sm font-bold text-muted">{title}</h2>
      <div className="card overflow-hidden divide-y divide-line/40">
        {entries.map((e) => (
          <ScheduleRow key={e.match.id} entry={e} teamId={teamId} past={past} />
        ))}
      </div>
    </section>
  );
}

function ScheduleRow({
  entry,
  teamId,
  past,
}: {
  entry: TeamScheduleEntry;
  teamId: string;
  past: boolean;
}) {
  const { match, competitionName } = entry;
  const isHome = match.home.team.id === teamId;
  const us = isHome ? match.home : match.away;
  const them = isHome ? match.away : match.home;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2/60"
    >
      <div className="w-12 shrink-0 text-center">
        <div className="text-xs font-bold tabular-nums">{formatDayMonth(match.startTime)}</div>
        {!past ? (
          <div className="ltr text-[11px] text-muted tabular-nums">{formatTime(match.startTime)}</div>
        ) : null}
      </div>

      <span
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          isHome ? "bg-accent/15 text-accent" : "bg-surface2 text-muted"
        }`}
      >
        {isHome ? "أرضه" : "خارج"}
      </span>

      <Logo url={them.team.logo} alt={them.team.name} size={26} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{them.team.name}</div>
        {competitionName ? (
          <div className="truncate text-[11px] text-muted">{competitionName}</div>
        ) : null}
      </div>

      {past ? <ResultCell us={us} them={them} /> : null}
    </Link>
  );
}

function ResultCell({
  us,
  them,
}: {
  us: Match["home"];
  them: Match["home"];
}) {
  const ourScore = us.score ?? 0;
  const oppScore = them.score ?? 0;
  const outcome = ourScore > oppScore ? "win" : ourScore < oppScore ? "lose" : "draw";
  const config = {
    win: { label: "ف", className: "bg-win/15 text-win" },
    draw: { label: "ت", className: "bg-draw/15 text-draw" },
    lose: { label: "خ", className: "bg-lose/15 text-lose" },
  }[outcome];

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="ltr text-sm font-black tabular-nums">
        {ourScore} : {oppScore}
      </span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${config.className}`}
      >
        {config.label}
      </span>
    </div>
  );
}
