import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { competitionInfo } from "@/lib/competitions";
import { ClubsGrid } from "@/components/ClubsGrid";
import { ErrorState } from "@/components/States";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await competitionInfo(id);
  return {
    title: `أندية ${info.name}`,
    description: `الأندية المشاركة في ${info.name}.`,
  };
}

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const teams = await vara.teams(id);
    return <ClubsGrid teams={teams} />;
  } catch (e) {
    return <ErrorState detail={(e as Error).message} />;
  }
}
