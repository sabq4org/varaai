import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-line/60 pt-8 text-center text-xs text-muted">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-accent/30 to-transparent" />
      <div className="flex items-center justify-center">
        <Brand size={20} withMark />
      </div>
      <p className="mt-3 font-semibold text-text/80">دقّة الرياضة</p>
      <p className="mt-1 text-[11px] text-muted/70">البيانات عبر VARA Edge</p>
    </footer>
  );
}
