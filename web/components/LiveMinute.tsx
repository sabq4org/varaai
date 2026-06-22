"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { isBreakPhase, liveMinuteLabel, phaseLabel } from "@/lib/live";

/**
 * Real-time live minute. Ticks locally every second from the server-provided
 * `liveStartedAt` + `liveBase` so the clock stays accurate between polls (no lag).
 * Phase-aware: shows stoppage time ("45+2′"), the half name, and break states
 * like "بين الشوطين" / "ركلات الترجيح".
 *
 * `withHalf` prefixes the ticking clock with the half name, e.g. "الشوط الثاني · 67′".
 */
export function LiveMinute({
  match,
  className,
  withHalf = false,
}: {
  match: Match;
  className?: string;
  withHalf?: boolean;
}) {
  const canTick = match.liveStartedAt != null && match.liveBase != null;
  const [minute, setMinute] = useState<number | null>(match.minute ?? null);

  useEffect(() => {
    if (!canTick) {
      setMinute(match.minute ?? null);
      return;
    }
    const compute = () =>
      match.liveBase! + Math.max(0, Math.floor((Date.now() / 1000 - match.liveStartedAt!) / 60));
    setMinute(compute());
    const id = setInterval(() => setMinute(compute()), 1000);
    return () => clearInterval(id);
  }, [canTick, match.liveStartedAt, match.liveBase, match.minute]);

  const clock = liveMinuteLabel(minute, match.phase);
  const half = withHalf && !isBreakPhase(match.phase) ? phaseLabel(match.phase) : null;

  return (
    <span className={`ltr ${className ?? ""}`}>
      {half ? <span className="opacity-80">{half} · </span> : null}
      {clock}
    </span>
  );
}
