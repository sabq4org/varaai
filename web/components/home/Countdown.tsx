"use client";

import { useEffect, useState } from "react";

/** Live "time remaining" countdown to a kickoff ISO time. */
export function Countdown({ to, tone = "card" }: { to: string; tone?: "card" | "glass" }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(to).getTime();
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [to]);

  const glass = tone === "glass";
  const cell = glass ? "bg-white/10 text-white" : "bg-surface2";
  const lab = glass ? "text-white/55" : "text-muted";

  // Stable placeholder for SSR / pre-hydration.
  if (left == null) {
    return <div className="ltr h-[52px]" aria-hidden />;
  }
  if (left <= 0) {
    return (
      <div className={`text-sm font-semibold ${glass ? "text-[#00E0A4]" : "text-accent"}`}>
        على وشك البداية…
      </div>
    );
  }

  const s = Math.floor(left / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const cells = [
    { v: days, l: "يوم" },
    { v: hours, l: "ساعة" },
    { v: mins, l: "دقيقة" },
    { v: secs, l: "ثانية" },
  ].filter((c, i) => !(i === 0 && days === 0)); // hide "days" when zero

  return (
    <div className="ltr flex items-center justify-center gap-2">
      {cells.map((c, i) => (
        <div key={i} className={`min-w-[44px] rounded-lg px-2 py-1.5 text-center ${cell}`}>
          <div className="text-xl font-extrabold tabular-nums leading-none">
            {String(c.v).padStart(2, "0")}
          </div>
          <div className={`mt-1 text-[10px] ${lab}`}>{c.l}</div>
        </div>
      ))}
    </div>
  );
}
