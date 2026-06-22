import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { competitionInfo } from "@/lib/competitions";
import { MatchList } from "@/components/MatchList";
import { ErrorState } from "@/components/States";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await competitionInfo(id);
  return {
    title: `نتائج ${info.name}`,
    description: `أحدث نتائج ومباريات ${info.name}.`,
  };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const matches = await vara.matches(id, "last", 20);
    return <MatchList matches={matches} />;
  } catch (e) {
    return <ErrorState detail={(e as Error).message} />;
  }
}
