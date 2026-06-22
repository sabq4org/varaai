import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { competitionInfo } from "@/lib/competitions";
import { Bracket } from "@/components/Bracket";
import { ErrorState } from "@/components/States";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await competitionInfo(id);
  return {
    title: `الأدوار الإقصائية — ${info.name}`,
    description: `مسار الأدوار الإقصائية ومواجهات ${info.name} حتى النهائي.`,
  };
}

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const stages = await vara.bracket(id);
    return <Bracket stages={stages} />;
  } catch (e) {
    return <ErrorState detail={(e as Error).message} />;
  }
}
