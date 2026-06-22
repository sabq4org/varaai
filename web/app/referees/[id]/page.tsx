import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { Logo } from "@/components/Logo";
import { ErrorState, SectionTitle } from "@/components/States";
import { RefereeRecent, RefereeStats } from "@/components/referee/RefereeSections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const r = await vara.referee(id);
    return { title: r.name, description: `${r.name} — أرقام التحكيم.` };
  } catch {
    return { title: "حكم" };
  }
}

export default async function RefereePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let referee;
  try {
    referee = await vara.referee(id);
  } catch (e) {
    return (
      <div className="py-2">
        <ErrorState detail={(e as Error).message} />
      </div>
    );
  }

  const seasonLine = [referee.competition, referee.seasonName].filter(Boolean).join(" · ");

  return (
    <div className="py-2">
      <div className="mb-5 flex flex-col items-center gap-3 pt-2 text-center">
        <Logo url={referee.photo} alt={referee.name} size={100} />
        <h1 className="text-xl font-extrabold">{referee.name}</h1>
        <div className="text-xs font-semibold text-muted">حكم ساحة</div>
        {referee.country ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            {referee.countryFlag ? (
              <Logo url={referee.countryFlag} alt={referee.country} size={20} />
            ) : null}
            <span>{referee.country}</span>
          </div>
        ) : null}
      </div>

      {referee.stats.length ? (
        <>
          <div className="flex items-baseline justify-between">
            <SectionTitle>أرقام التحكيم</SectionTitle>
            {seasonLine ? <span className="text-xs text-muted">{seasonLine}</span> : null}
          </div>
          <RefereeStats stats={referee.stats} />
        </>
      ) : null}

      <RefereeRecent matches={referee.recentMatches} />
    </div>
  );
}
