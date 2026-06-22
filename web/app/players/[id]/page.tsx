import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { Logo } from "@/components/Logo";
import { InfoTiles } from "@/components/InfoTiles";
import { ErrorState, SectionTitle } from "@/components/States";
import {
  CareerTable,
  CareerTotals,
  Honours,
  RecentForm,
} from "@/components/player/PlayerSections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await vara.player(id);
    return { title: p.name, description: `${p.name} — الملف والأرقام.` };
  } catch {
    return { title: "لاعب" };
  }
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let player;
  try {
    player = await vara.player(id);
  } catch (e) {
    return (
      <div className="py-2">
        <ErrorState detail={(e as Error).message} />
      </div>
    );
  }

  const tags = [player.detailedPosition || player.position, player.nationality].filter(
    Boolean,
  ) as string[];

  return (
    <div className="py-2">
      <div className="mb-5 flex flex-col items-center gap-3 pt-2 text-center">
        <Logo url={player.photo} alt={player.name} size={100} />
        <h1 className="text-xl font-extrabold">{player.name}</h1>
        {player.currentTeam ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Logo url={player.currentTeam.logo} alt={player.currentTeam.name} size={22} />
            <span>{player.currentTeam.name}</span>
            {player.currentTeam.jerseyNumber != null ? (
              <span className="ltr rounded-md bg-surface2 px-1.5 py-0.5 text-[11px] font-black text-accent tabular-nums">
                #{player.currentTeam.jerseyNumber}
              </span>
            ) : null}
          </div>
        ) : null}
        {tags.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <InfoTiles
        tiles={[
          { label: "العمر", value: player.age != null ? String(player.age) : "—" },
          { label: "الطول", value: player.height ? `${player.height} سم` : "—" },
          { label: "الوزن", value: player.weight ? `${player.weight} كجم` : "—" },
          ...(player.preferredFoot
            ? [{ label: "القدم المفضّلة", value: player.preferredFoot }]
            : []),
        ]}
      />

      {player.careerTotals ? <CareerTotals totals={player.careerTotals} /> : null}

      {player.stats && player.stats.items.length ? (
        <>
          <div className="flex items-baseline justify-between">
            <SectionTitle>الأرقام</SectionTitle>
            <span className="text-xs text-muted">
              {[player.stats.competition, player.stats.seasonName].filter(Boolean).join(" · ")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {player.stats.items.map((it) => (
              <div key={it.key} className="card px-3 py-4 text-center">
                <div className="ltr text-lg font-extrabold text-accent tabular-nums">
                  {it.value}
                </div>
                <div className="mt-1 text-[11px] leading-tight text-muted">{it.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {player.recentMatches?.length ? <RecentForm matches={player.recentMatches} /> : null}

      {player.trophies?.length ? <Honours trophies={player.trophies} /> : null}

      {player.seasons?.length ? <CareerTable seasons={player.seasons} /> : null}
    </div>
  );
}
