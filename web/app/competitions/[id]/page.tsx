import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { competitionInfo } from "@/lib/competitions";
import { StandingsTable } from "@/components/StandingsTable";
import { ErrorState } from "@/components/States";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await competitionInfo(id);
  return {
    title: `ترتيب ${info.name}`,
    description: `جدول ترتيب ${info.name} — النقاط، الفوز، الفارق، والحالة الأخيرة لكل فريق.`,
  };
}

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const standings = await vara.standings(id);
    return <StandingsTable standings={standings} />;
  } catch (e) {
    return <ErrorState detail={(e as Error).message} />;
  }
}
