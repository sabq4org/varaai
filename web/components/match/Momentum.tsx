import type { MatchDetail, MatchEvent } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { eventGlyph, localizeEventDetail } from "@/lib/events";

type Marker = {
  minute: number;
  glyph: "goal" | "yellow" | "red" | "var";
  label: string;
  player?: string;
};

/**
 * Attack-momentum chart: per-minute Pressure Index as diverging bars
 * (home above the midline, away below), with goal/card/VAR markers above
 * (home) and below (away) the timeline. Falls back to a compact dominance bar
 * when only the aggregate share is available.
 */
export function Momentum({ detail }: { detail: MatchDetail }) {
  const { momentum, pressure, match } = detail;
  const hasTimeline = (momentum?.length ?? 0) > 1;
  if (!hasTimeline && !(pressure && (pressure.home ?? 0) + (pressure.away ?? 0) > 0)) {
    return null;
  }

  const home = match.home.team;
  const away = match.away.team;

  const toMarker = (e: MatchEvent): Marker | null => {
    const g = eventGlyph(e);
    if (g !== "goal" && g !== "yellow" && g !== "red" && g !== "var") return null;
    return { minute: e.minute, glyph: g, label: localizeEventDetail(e), player: e.player };
  };
  const homeMarkers = detail.events
    .filter((e) => e.side === "home")
    .map(toMarker)
    .filter((m): m is Marker => m != null);
  const awayMarkers = detail.events
    .filter((e) => e.side === "away")
    .map(toMarker)
    .filter((m): m is Marker => m != null);

  const share = pressure ? { home: pressure.home ?? 0, away: pressure.away ?? 0 } : null;
  const homeLeads = (share?.home ?? 0) >= (share?.away ?? 0);

  const maxMinute = hasTimeline ? momentum![momentum!.length - 1].minute : 90;

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="rail !h-3.5" />
        <span className="font-bold">مؤشّر الزخم</span>
        <span className="text-muted/70">— ضغط الهجوم دقيقة بدقيقة</span>
      </div>

      {/* Dominance summary */}
      {share ? (
        <>
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-1.5">
              <Logo url={home.logo} alt="" size={18} />
              <span className={`ltr text-lg ${homeLeads ? "text-accent" : "text-muted"}`}>
                {share.home}%
              </span>
            </span>
            <span className="text-[11px] font-semibold text-muted/70">نسبة السيطرة</span>
            <span className="flex items-center gap-1.5">
              <span className={`ltr text-lg ${!homeLeads ? "text-accent" : "text-muted"}`}>
                {share.away}%
              </span>
              <Logo url={away.logo} alt="" size={18} />
            </span>
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-surface2 ring-1 ring-inset ring-line/60">
            <div
              style={{ width: `${share.home}%` }}
              className={homeLeads ? "bg-gradient-to-l from-accent to-accentDim" : "bg-line"}
            />
            <div className="w-px bg-bg/40" />
            <div
              style={{ width: `${share.away}%` }}
              className={!homeLeads ? "bg-gradient-to-r from-accent to-accentDim" : "bg-line"}
            />
          </div>
        </>
      ) : null}

      {hasTimeline ? (
        <MomentumChart
          points={momentum!}
          maxMinute={maxMinute}
          homeMarkers={homeMarkers}
          awayMarkers={awayMarkers}
        />
      ) : null}
    </div>
  );
}

function MomentumChart({
  points,
  maxMinute,
  homeMarkers,
  awayMarkers,
}: {
  points: { minute: number; home: number; away: number }[];
  maxMinute: number;
  homeMarkers: Marker[];
  awayMarkers: Marker[];
}) {
  // Net pressure per minute: positive → home attacking, negative → away.
  const bars = points.map((p) => ({ minute: p.minute, net: p.home - p.away }));
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.net)));
  const leftFor = (minute: number) =>
    `${Math.min(100, Math.max(0, (minute / maxMinute) * 100))}%`;

  return (
    <div className="mt-4">
      {/* home markers (above) */}
      <MarkerRow markers={homeMarkers} leftFor={leftFor} side="home" />

      <div className="relative flex h-24 items-stretch gap-px">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line/70" />
        {bars.map((b) => {
          const h = (Math.abs(b.net) / max) * 50; // % of half-height
          const isHome = b.net >= 0;
          return (
            <div key={b.minute} className="flex flex-1 flex-col justify-center">
              <div className="flex h-1/2 flex-col justify-end">
                {isHome ? (
                  <div
                    style={{ height: `${h}%` }}
                    className="rounded-t-sm bg-gradient-to-t from-accentDim to-accent"
                  />
                ) : null}
              </div>
              <div className="flex h-1/2 flex-col justify-start">
                {!isHome ? (
                  <div
                    style={{ height: `${h}%` }}
                    className="rounded-b-sm bg-gradient-to-b from-lose/80 to-lose"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* away markers (below) */}
      <MarkerRow markers={awayMarkers} leftFor={leftFor} side="away" />

      {/* minute axis */}
      <div className="ltr mt-1 flex justify-between text-[10px] tabular-nums text-muted/60">
        <span>0′</span>
        <span>45′</span>
        <span>90′</span>
      </div>
    </div>
  );
}

function MarkerRow({
  markers,
  leftFor,
  side,
}: {
  markers: Marker[];
  leftFor: (m: number) => string;
  side: "home" | "away";
}) {
  if (!markers.length) return <div className="h-5" />;
  return (
    <div className={`relative h-5 ${side === "home" ? "mb-0.5" : "mt-0.5"}`}>
      {markers.map((m, i) => (
        <div
          key={`${m.minute}-${i}`}
          className="group/mk absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: leftFor(m.minute) }}
        >
          <MarkerIcon glyph={m.glyph} />
          {/* tooltip */}
          <div
            className={`pointer-events-none absolute left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-lg group-hover/mk:block ${
              side === "home" ? "top-full mt-1.5" : "bottom-full mb-1.5"
            }`}
          >
            <span className="ltr font-bold tabular-nums text-accent">{m.minute}′</span>
            <span className="mx-1 text-muted">·</span>
            <span className="font-semibold">{m.label}</span>
            {m.player ? <span className="text-muted"> — {m.player}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function MarkerIcon({ glyph }: { glyph: Marker["glyph"] }) {
  switch (glyph) {
    case "goal":
      return <span className="text-[13px] leading-none">⚽</span>;
    case "yellow":
      return <span className="block h-3.5 w-2.5 rounded-[2px] bg-draw shadow" />;
    case "red":
      return <span className="block h-3.5 w-2.5 rounded-[2px] bg-lose shadow" />;
    case "var":
      return (
        <span className="rounded bg-draw/20 px-1 text-[8px] font-bold leading-tight text-draw">
          VAR
        </span>
      );
  }
}
