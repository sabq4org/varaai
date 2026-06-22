import type { MatchDetail, MatchEvent, Team } from "@/lib/types";
import { Logo } from "@/components/Logo";
import {
  eventGlyph,
  eventMinute,
  localizeEventDetail,
  localizeReason,
  type EventGlyph,
} from "@/lib/events";

/** "VARA Moment" — the signature vertical event timeline with VAR highlights. */
export function EventsTimeline({ detail }: { detail: MatchDetail }) {
  const { events } = detail;
  if (!events.length) {
    return <div className="px-6 py-10 text-center text-muted">لا توجد أحداث</div>;
  }
  const home = detail.match.home.team;
  const away = detail.match.away.team;

  // Newest first: most recent minute (incl. stoppage) at the top.
  const ordered = events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const am = (a.e.minute ?? 0) * 100 + (a.e.extraMinute ?? 0);
      const bm = (b.e.minute ?? 0) * 100 + (b.e.extraMinute ?? 0);
      return bm - am || b.i - a.i;
    })
    .map(({ e }) => e);

  return (
    <ol className="card overflow-hidden px-4 py-2">
      {ordered.map((e, i) => {
        const glyph = eventGlyph(e);
        const team: Team = e.side === "home" ? home : away;
        const last = i === ordered.length - 1;
        return (
          <li key={i} className="flex gap-3">
            {/* Rail: icon + connector line */}
            <div className="flex flex-col items-center">
              <EventIcon glyph={glyph} />
              {!last ? <span className="w-px flex-1 bg-line" /> : null}
            </div>

            {/* Content */}
            <div className={`flex-1 ${last ? "pb-3" : "pb-5"} pt-1`}>
              <div className="flex items-center gap-2">
                <span
                  className={`ltr text-xs font-bold tabular-nums ${
                    e.isVar ? "text-draw" : "text-accent"
                  }`}
                >
                  {eventMinute(e)}
                </span>
                {e.isVar ? (
                  <span className="rounded bg-draw/20 px-1.5 py-0.5 text-[10px] font-bold text-draw">
                    لقطة VARA
                  </span>
                ) : null}
                <Logo url={team.logo} alt={team.name} size={16} />
              </div>
              {e.type === "subst" ? (
                <SubstitutionBody e={e} />
              ) : (
                <>
                  {e.player ? <div className="mt-0.5 font-semibold">{e.player}</div> : null}
                  <div className="text-sm text-muted">
                    {localizeEventDetail(e)}
                    {localizeReason(e.reason) ? (
                      <span className="text-muted/70"> · {localizeReason(e.reason)}</span>
                    ) : null}
                    {e.assist ? <span className="text-muted/70"> · صناعة {e.assist}</span> : null}
                  </div>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SubstitutionBody({ e }: { e: MatchEvent }) {
  return (
    <>
      <div className="mt-0.5 text-sm text-muted">تبديل</div>
      <div className="mt-0.5 space-y-0.5 text-sm">
        {e.player ? (
          <div className="flex items-center gap-1.5 font-semibold text-accent">
            <span className="ltr">▲</span>
            {e.player}
          </div>
        ) : null}
        {e.playerOut ? (
          <div className="flex items-center gap-1.5 text-muted">
            <span className="ltr text-lose">▼</span>
            {e.playerOut}
          </div>
        ) : null}
      </div>
    </>
  );
}

function EventIcon({ glyph }: { glyph: EventGlyph }) {
  const base = "mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold";
  switch (glyph) {
    case "goal":
      return <span className={`${base} bg-accent text-[#08110d]`}>⚽</span>;
    case "yellow":
      return <span className={`${base} bg-draw text-[#08110d]`}>▌</span>;
    case "red":
      return <span className={`${base} bg-lose text-white`}>▌</span>;
    case "subst":
      return <span className={`${base} bg-surface2 text-muted`}>⇄</span>;
    case "var":
      return <span className={`${base} bg-draw/20 text-[9px] text-draw`}>VAR</span>;
    default:
      return <span className={`${base} bg-surface2 text-muted`}>•</span>;
  }
}
