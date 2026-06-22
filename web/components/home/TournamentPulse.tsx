import Link from "next/link";
import type { Match, Standings, TopScorer } from "@/lib/types";
import { Logo } from "@/components/Logo";

/**
 * "نبض البطولة" — a live vital-signs bar computed entirely from real data
 * (standings + results + top scorer). Gives the hub a sense of a tournament
 * that is breathing, not a static table.
 */
export function TournamentPulse({
  standings,
  results,
  topScorer,
}: {
  standings: Standings | null;
  results: Match[];
  topScorer?: TopScorer | null;
}) {
  const rows = standings?.rows ?? [];
  const teams = rows.length;
  const played = Math.round(rows.reduce((s, r) => s + (r.played ?? 0), 0) / 2);
  const goals = rows.reduce((s, r) => s + (r.goalsFor ?? 0), 0);
  const avg = played ? (goals / played).toFixed(1) : "0.0";

  // Biggest win from the most recent finished matches.
  const finished = results.filter((m) => m.state === "finished" && m.home.score != null && m.away.score != null);
  let biggest: { match: Match; diff: number } | null = null;
  for (const m of finished) {
    const diff = Math.abs((m.home.score ?? 0) - (m.away.score ?? 0));
    if (!biggest || diff > biggest.diff) biggest = { match: m, diff };
  }

  if (!teams && !finished.length) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="منتخب" value={teams || "—"} icon={<IconFlag />} />
      <Stat label="مباراة أُقيمت" value={played || "—"} icon={<IconWhistle />} />
      <Stat label="هدف" value={goals || "—"} accent icon={<IconBall />} />
      <Stat label="متوسط الأهداف / مباراة" value={avg} icon={<IconChart />} />
      {topScorer ? (
        <ScorerStat scorer={topScorer} />
      ) : biggest ? (
        <BiggestWin match={biggest.match} />
      ) : (
        <Stat label="متوسط الأهداف" value={avg} icon={<IconChart />} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card relative overflow-hidden px-4 py-3.5">
      <div className="absolute -left-3 -top-3 text-line/60">{icon}</div>
      <div className={`ltr text-3xl font-black leading-none tabular-nums ${accent ? "text-accent-grad" : ""}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[11px] font-semibold text-muted">{label}</div>
    </div>
  );
}

function ScorerStat({ scorer }: { scorer: TopScorer }) {
  return (
    <Link
      href={`/players/${scorer.player.id}`}
      className="card card-hover relative col-span-2 flex items-center gap-3 overflow-hidden px-4 py-3.5 sm:col-span-1"
    >
      <span className="relative h-11 w-11 shrink-0">
        <span className="absolute inset-0 rounded-full bg-gold/15 blur-md" />
        {scorer.player.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scorer.player.photo}
            alt={scorer.player.name}
            className="relative h-11 w-11 rounded-full object-cover ring-1 ring-gold/40"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Logo url={scorer.team.logo} alt={scorer.team.name} size={44} />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gold">
          <IconBoot /> الهدّاف
        </div>
        <div className="truncate text-sm font-bold">{scorer.player.name}</div>
        <div className="ltr text-xs text-muted">
          <span className="font-extrabold text-accent">{scorer.total}</span> أهداف
        </div>
      </div>
    </Link>
  );
}

function BiggestWin({ match }: { match: Match }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="card card-hover relative col-span-2 flex items-center justify-between gap-2 overflow-hidden px-4 py-3.5 sm:col-span-1"
    >
      <div className="text-[10px] font-bold text-accent">أكبر فوز</div>
      <div className="flex items-center gap-1.5">
        <Logo url={match.home.team.logo} alt={match.home.team.name} size={20} />
        <span className="ltr text-lg font-black tabular-nums">
          {match.home.score}
          <span className="mx-0.5 text-muted">:</span>
          {match.away.score}
        </span>
        <Logo url={match.away.team.logo} alt={match.away.team.name} size={20} />
      </div>
    </Link>
  );
}

/* —— line icons (decorative) —— */
const ic = "h-12 w-12 opacity-50";
function IconFlag() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={ic}>
      <path d="M5 21V4m0 0 9 2-2 4 7 1-3 4-11-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconWhistle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={ic}>
      <circle cx="9" cy="14" r="5" />
      <path d="M14 12h7M9 9V6h4" strokeLinecap="round" />
    </svg>
  );
}
function IconBall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={ic}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 4 3-1.5 5h-5L8 10z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={ic}>
      <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" strokeLinecap="round" />
    </svg>
  );
}
function IconBoot() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M2 7h7l3 4 8 1v5H4a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
