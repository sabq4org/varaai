import Link from "next/link";
import type { Lineup, LineupPlayer, MatchDetail, Team } from "@/lib/types";
import { Logo } from "@/components/Logo";

/** Lineups per team: formation pitch, starting XI, substitutes, coach. */
export function Lineups({ detail }: { detail: MatchDetail }) {
  const { lineups } = detail;
  if (!lineups.home && !lineups.away) {
    return <div className="px-6 py-10 text-center text-muted">التشكيلة غير متاحة</div>;
  }
  return (
    <div className="flex flex-col gap-4">
      {lineups.home ? <TeamLineup lineup={lineups.home} team={detail.match.home.team} /> : null}
      {lineups.away ? <TeamLineup lineup={lineups.away} team={detail.match.away.team} /> : null}
      {detail.referee ? <RefereeCard referee={detail.referee} /> : null}
    </div>
  );
}

/** Match official: links to the referee's officiating profile. */
function RefereeCard({ referee }: { referee: { id: string; name: string } }) {
  return (
    <Link
      href={`/referees/${referee.id}`}
      className="card flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-surface2/60"
    >
      <WhistleIcon />
      <span className="text-muted">الحكم:</span>
      <span className="font-semibold">{referee.name}</span>
      <ChevronIcon />
    </Link>
  );
}

function TeamLineup({ lineup, team }: { lineup: Lineup; team: Team }) {
  const hasGrid = lineup.startXI.some((p) => p.line != null);
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <Logo url={team.logo} alt={team.name} size={24} />
        <span className="font-bold">{team.name}</span>
        {lineup.formation ? (
          <span className="ltr ms-auto rounded-md bg-surface2 px-2 py-0.5 text-xs font-bold text-accent">
            {lineup.formation}
          </span>
        ) : null}
      </header>

      {hasGrid ? (
        <Pitch players={lineup.startXI} />
      ) : (
        <ul className="divide-y divide-line/50">
          {lineup.startXI.map((p, i) => (
            <SubRow key={i} player={p} starter />
          ))}
        </ul>
      )}

      {lineup.substitutes.length ? (
        <>
          <div className="border-y border-line bg-surface2/40 px-4 py-1.5 text-xs font-semibold text-muted">
            البدلاء
          </div>
          <ul className="divide-y divide-line/50">
            {lineup.substitutes.map((p, i) => (
              <SubRow key={i} player={p} />
            ))}
          </ul>
        </>
      ) : null}

      {lineup.coach ? (
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-sm">
          <CoachIcon />
          <span className="text-muted">المدرّب:</span>
          <span className="font-semibold">{lineup.coach}</span>
        </div>
      ) : null}
    </section>
  );
}

/** Green formation board placing the starting XI by pitch line/slot. */
function Pitch({ players }: { players: LineupPlayer[] }) {
  // Distinct lines, attack at the top → keeper at the bottom.
  const lines = [...new Set(players.map((p) => p.line ?? 0))].sort((a, b) => b - a);
  return (
    <div
      className="relative flex flex-col justify-between gap-2 px-3 py-6"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(52,211,153,0.18) 0, transparent 60%), repeating-linear-gradient(0deg, #0f3d2e 0 36px, #0d3528 36px 72px)",
      }}
    >
      {/* Pitch markings */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/15" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-3 h-16 w-28 -translate-x-1/2 rounded-b-lg border border-t-0 border-white/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-3 left-1/2 h-16 w-28 -translate-x-1/2 rounded-t-lg border border-b-0 border-white/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12"
        aria-hidden
      />

      {lines.map((line) => {
        const row = players
          .filter((p) => (p.line ?? 0) === line)
          .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
        return (
          <div key={line} className="relative flex items-start justify-around gap-1">
            {row.map((p, i) => (
              <PitchToken key={i} player={p} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PitchToken({ player }: { player: LineupPlayer }) {
  const token = (
    <>
      <div className="relative">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black tabular-nums text-[#0d2c22] shadow-md ring-1 ring-black/20">
          {player.number ?? "—"}
        </span>
        {player.captain ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-[#06231a] ring-1 ring-black/20">
            C
          </span>
        ) : null}
        {player.goals ? (
          <span className="absolute -left-1 -top-1 flex items-center gap-0.5 rounded-full bg-[#06231a]/85 px-1 text-[9px] font-black text-white ring-1 ring-white/20">
            {player.goals > 1 ? player.goals : null}
            <BallIcon />
          </span>
        ) : null}
        {player.red ? (
          <span className="absolute -bottom-0.5 -left-1 h-3 w-2 rounded-[2px] bg-lose ring-1 ring-black/30" />
        ) : player.yellow ? (
          <span className="absolute -bottom-0.5 -left-1 h-3 w-2 rounded-[2px] bg-draw ring-1 ring-black/30" />
        ) : null}
      </div>
      <span className="max-w-[64px] truncate text-[11px] font-semibold text-white drop-shadow">
        {shortName(player.name)}
      </span>
      {player.rating != null ? <RatingPill rating={player.rating} /> : null}
    </>
  );

  const cls = "flex w-16 flex-col items-center gap-1";
  return player.id ? (
    <Link href={`/players/${player.id}`} className={`${cls} transition-transform hover:scale-105`}>
      {token}
    </Link>
  ) : (
    <div className={cls}>{token}</div>
  );
}

/** Richer bench / fallback row: number, name, position, rating, goals. */
function SubRow({ player, starter }: { player: LineupPlayer; starter?: boolean }) {
  const inner = (
    <>
      <span
        className={`flex h-6 w-7 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
          starter ? "bg-accentDim text-[#d8fff3]" : "bg-surface2 text-muted"
        }`}
      >
        {player.number ?? "—"}
      </span>
      <span className="flex-1 truncate text-sm font-semibold">
        {player.name}
        {player.captain ? <span className="ms-1 text-[10px] font-black text-accent">(C)</span> : null}
      </span>
      {player.goals ? (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-muted">
          {player.goals > 1 ? player.goals : null}
          <BallIcon dark />
        </span>
      ) : null}
      {player.red ? (
        <span className="h-3.5 w-2.5 rounded-[2px] bg-lose" />
      ) : player.yellow ? (
        <span className="h-3.5 w-2.5 rounded-[2px] bg-draw" />
      ) : null}
      {player.pos ? <span className="text-xs text-muted">{player.pos}</span> : null}
      {player.rating != null ? <RatingPill rating={player.rating} /> : null}
    </>
  );
  return (
    <li>
      {player.id ? (
        <Link
          href={`/players/${player.id}`}
          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface2/60"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2.5">{inner}</div>
      )}
    </li>
  );
}

function RatingPill({ rating }: { rating: number }) {
  const tone =
    rating >= 7.5
      ? "bg-win/90 text-white"
      : rating >= 6.5
        ? "bg-accent/90 text-[#06231a]"
        : "bg-lose/90 text-white";
  return (
    <span className={`ltr rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums ${tone}`}>
      {rating.toFixed(1)}
    </span>
  );
}

/** Last word of a name, to fit pitch tokens. */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function BallIcon({ dark }: { dark?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={11}
      height={11}
      fill="currentColor"
      className={dark ? "text-text" : "text-white"}
      aria-hidden
    >
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.2 2.7 2-1 3.1h-3.4l-1-3.1 2.7-2ZM5.3 8.6l2.5.2 1 3.1L6.5 14l-2.2-1.6a8 8 0 0 1 1-3.8Zm1.2 8 2.3-.1 1.1 3-.7 1.2a8 8 0 0 1-3-4.1Zm8.4 4.1-.7-1.2 1.1-3 2.3.1a8 8 0 0 1-2.7 4.1Zm2.6-6.7L15.2 12l1-3.1 2.5-.2a8 8 0 0 1 1 3.8L17.5 14Z" />
    </svg>
  );
}

function CoachIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} className="text-muted" fill="currentColor" aria-hidden>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.5-8 5.5V21h16v-1.5c0-3-3.6-5.5-8-5.5Z" />
    </svg>
  );
}

function WhistleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} className="text-muted" fill="currentColor" aria-hidden>
      <path d="M21 9h-7.1a5.5 5.5 0 1 0-3.4 6.9V18a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h2.5a4 4 0 0 0 4-4V10a1 1 0 0 0-1-1Zm-13 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} className="ms-auto text-muted" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
