/** "المصدر: sportmonks · مباشر/من الكاش" — mirrors the iOS SourceFooter. */
export function SourceFooter({ source, cached }: { source: string; cached: boolean }) {
  return (
    <p className="mt-4 text-center text-[11px] text-muted/70">
      المصدر: {source} · {cached ? "من الكاش" : "مباشر"}
    </p>
  );
}
