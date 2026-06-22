import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import type { MatchDetail } from "@/lib/types";
import { MatchHeader } from "@/components/match/MatchHeader";
import { Momentum } from "@/components/match/Momentum";
import { PeriodScores } from "@/components/match/PeriodScores";
import { MatchSections } from "@/components/match/MatchSections";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ErrorState } from "@/components/States";

export const dynamic = "force-dynamic";

function title(d: MatchDetail): string {
  const { home, away } = d.match;
  const score =
    d.match.state === "scheduled"
      ? ""
      : ` ${home.score ?? "-"}-${away.score ?? "-"}`;
  return `${home.team.name} × ${away.team.name}${score}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const d = await vara.matchDetail(id);
    const verb = d.match.state === "scheduled" ? "موعد" : "نتيجة";
    return {
      title: `${verb} ${title(d)}`,
      description: `${verb} مباراة ${d.match.home.team.name} و${d.match.away.team.name} — ${d.competitionName}، مع الأحداث والإحصائيات و xG.`,
    };
  } catch {
    return { title: "مباراة" };
  }
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: MatchDetail;
  try {
    detail = await vara.matchDetail(id);
  } catch (e) {
    return (
      <div className="py-2">
        <ErrorState detail={(e as Error).message} />
      </div>
    );
  }

  const live = detail.match.state === "live";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${detail.match.home.team.name} vs ${detail.match.away.team.name}`,
    startDate: detail.match.startTime,
    sport: "Soccer",
    location: detail.match.venue ? { "@type": "Place", name: detail.match.venue } : undefined,
    competitor: [
      { "@type": "SportsTeam", name: detail.match.home.team.name },
      { "@type": "SportsTeam", name: detail.match.away.team.name },
    ],
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <AutoRefresh enabled={live} seconds={12} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MatchHeader detail={detail} />
      <PeriodScores detail={detail} />
      <Momentum detail={detail} />
      <MatchSections detail={detail} />
    </div>
  );
}
