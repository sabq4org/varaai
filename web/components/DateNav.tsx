import Link from "next/link";
import { isoDate, relativeDayLabel } from "@/lib/format";

/**
 * Prev/next day navigation as links (SSR + SEO friendly — no client fetching).
 * `date` is the YYYY-MM-DD currently shown; today routes to "/", others to
 * "/date/<iso>".
 */
export function DateNav({ date }: { date: string }) {
  const current = new Date(`${date}T12:00:00Z`);
  const today = new Date();
  const prev = isoDate(new Date(current.getTime() - 86_400_000));
  const next = isoDate(new Date(current.getTime() + 86_400_000));
  const isToday = date === isoDate(today);

  const href = (d: string) => (d === isoDate(today) ? "/" : `/date/${d}`);

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link
        href={href(prev)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-text"
        aria-label="اليوم السابق"
      >
        ›
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-base font-bold">{relativeDayLabel(current, today)}</span>
        {!isToday && (
          <Link href="/" className="text-xs font-semibold text-accent hover:underline">
            العودة لليوم
          </Link>
        )}
      </div>

      <Link
        href={href(next)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-text"
        aria-label="اليوم التالي"
      >
        ‹
      </Link>
    </div>
  );
}
