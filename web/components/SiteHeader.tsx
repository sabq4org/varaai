import { BrandMark, Brand } from "./Brand";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-line/60 bg-bg/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/55">
      {/* accent hairline along the very top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex max-w-wide flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <BrandMark size={26} />
          <div className="flex flex-col leading-tight">
            <Brand />
            <span className="text-[11px] tracking-wide text-muted">دقّة الرياضة</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-line/70 bg-surface/50 p-1 backdrop-blur">
          <NavLinks />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
