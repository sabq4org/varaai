/** A row of label/value tiles (team bio, player bio). */
export function InfoTiles({
  tiles,
}: {
  tiles: { label: string; value: string }[];
}) {
  return (
    <div
      className="card grid divide-x divide-line/60 overflow-hidden [direction:rtl]"
      style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}
    >
      {tiles.map((t, i) => (
        <div key={i} className="px-3 py-4 text-center">
          <div className="text-lg font-extrabold text-text">{t.value}</div>
          <div className="mt-1 text-xs text-muted">{t.label}</div>
        </div>
      ))}
    </div>
  );
}
