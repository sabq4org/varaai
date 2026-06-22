import Link from "next/link";
import type {
  PlayerCareerTotals,
  PlayerRecentMatch,
  PlayerSeasonRow,
  PlayerTrophy,
} from "@/lib/types";
import { Logo } from "@/components/Logo";
import { SectionTitle } from "@/components/States";
import { formatDayMonth } from "@/lib/format";

/** Headline career numbers: appearances, goals, assists. */
export function CareerTotals({ totals }: { totals: PlayerCareerTotals }) {
  const tiles = [
    { label: "مباريات", value: totals.appearances },
    { label: "أهداف", value: totals.goals },
    { label: "صناعة", value: totals.assists },
  ];
  return (
    <>
      <SectionTitle>المسيرة</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="card px-3 py-4 text-center">
            <div className="ltr text-2xl font-black text-accent tabular-nums">{t.value}</div>
            <div className="mt-1 text-[11px] text-muted">{t.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Last appearances: opponent, result, the player's rating and goals. */
export function RecentForm({ matches }: { matches: PlayerRecentMatch[] }) {
  if (!matches.length) return null;
  return (
    <>
      <SectionTitle>آخر المباريات</SectionTitle>
      <div className="card overflow-hidden divide-y divide-line/40">
        {matches.map((m) => (
          <RecentRow key={m.match.id} entry={m} />
        ))}
      </div>
    </>
  );
}

function RecentRow({ entry }: { entry: PlayerRecentMatch }) {
  const { match, teamId } = entry;
  const isHome = match.home.team.id === teamId;
  const us = isHome ? match.home : match.away;
  const them = isHome ? match.away : match.home;
  const ourScore = us.score ?? 0;
  const oppScore = them.score ?? 0;
  const outcome = ourScore > oppScore ? "win" : ourScore < oppScore ? "lose" : "draw";
  const oc = {
    win: { label: "ف", className: "bg-win/15 text-win" },
    draw: { label: "ت", className: "bg-draw/15 text-draw" },
    lose: { label: "خ", className: "bg-lose/15 text-lose" },
  }[outcome];

  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2/60"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${oc.className}`}
      >
        {oc.label}
      </span>

      <Logo url={them.team.logo} alt={them.team.name} size={26} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{them.team.name}</div>
        <div className="truncate text-[11px] text-muted">
          {[entry.competitionName, formatDayMonth(match.startTime)].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {entry.goals ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-muted">
            {entry.goals}
            <BallIcon />
          </span>
        ) : null}
        <span className="ltr text-sm font-black tabular-nums">
          {ourScore} : {oppScore}
        </span>
        {entry.rating != null ? <RatingBadge rating={entry.rating} /> : null}
      </div>
    </Link>
  );
}

/** Season-by-season table: competition, club, apps, goals, assists, rating. */
export function CareerTable({ seasons }: { seasons: PlayerSeasonRow[] }) {
  if (!seasons.length) return null;
  return (
    <>
      <SectionTitle>سجل المواسم</SectionTitle>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-4 py-2.5 text-[11px] font-bold text-muted">
          <span>الموسم</span>
          <span className="w-7 text-center">م</span>
          <span className="w-7 text-center">هـ</span>
          <span className="w-7 text-center">ص</span>
          <span className="w-10 text-center">تقييم</span>
        </div>
        <div className="divide-y divide-line/40">
          {seasons.map((s) => (
            <div
              key={`${s.seasonId}-${s.competition}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Logo url={s.competitionLogo} alt={s.competition ?? ""} size={20} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold leading-tight">
                    {s.competition ?? "—"}
                  </div>
                  <div className="ltr truncate text-[11px] text-muted">
                    {[s.seasonName, s.teamName].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <span className="ltr w-7 text-center text-sm tabular-nums">{s.appearances ?? 0}</span>
              <span className="ltr w-7 text-center text-sm font-bold tabular-nums">{s.goals ?? 0}</span>
              <span className="ltr w-7 text-center text-sm tabular-nums text-muted">{s.assists ?? 0}</span>
              <span className="flex w-10 justify-center">
                {s.rating != null ? <RatingBadge rating={s.rating} /> : <span className="text-muted">—</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** Honours won (or runner-up). */
export function Honours({ trophies }: { trophies: PlayerTrophy[] }) {
  if (!trophies.length) return null;
  const wins = trophies.filter((t) => t.winner).length;
  return (
    <>
      <div className="flex items-baseline justify-between">
        <SectionTitle>البطولات</SectionTitle>
        {wins ? <span className="text-xs text-muted">{wins} لقب</span> : null}
      </div>
      <div className="card overflow-hidden divide-y divide-line/40">
        {trophies.map((t, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Logo url={t.competitionLogo} alt={t.competition ?? ""} size={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{t.competition ?? "—"}</div>
              <div className="ltr truncate text-[11px] text-muted">
                {[t.seasonName, t.teamName].filter(Boolean).join(" · ")}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                t.winner ? "bg-win/15 text-win" : "bg-surface2 text-muted"
              }`}
            >
              {t.winner ? "بطل" : "وصيف"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const tone =
    rating >= 7.5
      ? "bg-win/15 text-win"
      : rating >= 6.5
        ? "bg-accent/12 text-accent"
        : "bg-lose/15 text-lose";
  return (
    <span className={`ltr rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums ${tone}`}>
      {rating.toFixed(1)}
    </span>
  );
}

function BallIcon() {
  return (
    <svg viewBox="0 0 24 24" width={11} height={11} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.2 2.7 2-1 3.1h-3.4l-1-3.1 2.7-2ZM5.3 8.6l2.5.2 1 3.1L6.5 14l-2.2-1.6a8 8 0 0 1 1-3.8Zm1.2 8 2.3-.1 1.1 3-.7 1.2a8 8 0 0 1-3-4.1Zm8.4 4.1-.7-1.2 1.1-3 2.3.1a8 8 0 0 1-2.7 4.1Zm2.6-6.7L15.2 12l1-3.1 2.5-.2a8 8 0 0 1 1 3.8L17.5 14Z" />
    </svg>
  );
}
