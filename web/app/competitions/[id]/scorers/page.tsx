import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { competitionInfo } from "@/lib/competitions";
import type { ScorerMetric } from "@/lib/types";
import { ScorersList } from "@/components/ScorersList";
import { ErrorState } from "@/components/States";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await competitionInfo(id);
  return {
    title: `هدّافو ${info.name}`,
    description: `قائمة الهدّافين وصنّاع الأهداف في ${info.name}.`,
  };
}

export default async function ScorersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ metric?: string }>;
}) {
  const { id } = await params;
  const { metric: m } = await searchParams;
  const metric: ScorerMetric = m === "assists" ? "assists" : "goals";
  try {
    const scorers = await vara.topScorers(id, metric);
    return (
      <ScorersList scorers={scorers} metric={metric} basePath={`/competitions/${id}/scorers`} />
    );
  } catch (e) {
    return <ErrorState detail={(e as Error).message} />;
  }
}
