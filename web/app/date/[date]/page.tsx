import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { vara } from "@/lib/vara";
import { GroupedMatches, hasLive } from "@/components/GroupedMatches";
import { DateNav } from "@/components/DateNav";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ErrorState } from "@/components/States";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return { title: `مباريات ${date}`, description: `جدول مباريات يوم ${date}.` };
}

export default async function DatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();

  try {
    const groups = await vara.matchesOnDate(date);
    return (
      <div className="py-2">
        <AutoRefresh enabled={hasLive(groups)} seconds={15} />
        <DateNav date={date} />
        <GroupedMatches groups={groups} />
      </div>
    );
  } catch (e) {
    return (
      <div className="py-2">
        <ErrorState detail={(e as Error).message} />
      </div>
    );
  }
}
