// Recent form as colored squares (W=win, D=draw, L=lose) — mirrors iOS form dots.
const COLOR: Record<string, string> = {
  W: "bg-win text-[#08110d]",
  D: "bg-draw text-[#08110d]",
  L: "bg-lose text-white",
};

export function FormDots({ form }: { form?: string }) {
  if (!form) return null;
  // Most-recent-first; show up to the latest 5.
  const chars = form.slice(0, 5).split("");
  return (
    <span className="ltr inline-flex gap-[3px]">
      {chars.map((ch, i) => (
        <span
          key={i}
          className={`flex h-4 w-4 items-center justify-center rounded-[5px] text-[10px] font-extrabold ${
            COLOR[ch] ?? "bg-surface2 text-muted"
          }`}
          title={ch}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
