import Link from "next/link";

/** Precision/target mark — concentric ring + crosshair, the VARA "verdict" dot. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10"
      style={{ width: size + 8, height: size + 8 }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-xl opacity-60 blur-md"
        style={{ background: "radial-gradient(closest-side, rgb(var(--c-accent)/.35), transparent)" }}
      />
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="relative">
        <circle cx="12" cy="12" r="8.5" stroke="rgb(var(--c-accent))" strokeWidth="1.5" opacity="0.45" />
        <circle cx="12" cy="12" r="4.5" stroke="rgb(var(--c-accent))" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.6" fill="rgb(var(--c-accent))" />
        <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" stroke="rgb(var(--c-accent))" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </svg>
    </span>
  );
}

/** The VARA wordmark — "VA<R>A" with the R in accent, forced LTR. */
export function Brand({ size = 26, withMark = false }: { size?: number; withMark?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="VARA — الرئيسية">
      {withMark ? <BrandMark size={size} /> : null}
      <span
        className="ltr font-extrabold tracking-wide"
        style={{ fontSize: size, fontFamily: "var(--font-brand, inherit)" }}
      >
        <span className="text-text">VA</span>
        <span className="text-accent">R</span>
        <span className="text-text">A</span>
      </span>
    </Link>
  );
}
