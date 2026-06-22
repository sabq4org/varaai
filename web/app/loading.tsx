export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="text-sm">جارٍ التحميل…</span>
    </div>
  );
}
