import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import { GroupedMatches, hasLive } from "@/components/GroupedMatches";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ErrorState, SectionTitle } from "@/components/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المباريات المباشرة",
  description: "كل المباريات الجارية الآن مباشرةً عبر VARA.",
};

export default async function LivePage() {
  try {
    const groups = await vara.matchesLive();
    const live = hasLive(groups);
    return (
      <div className="py-2">
        <AutoRefresh enabled seconds={10} />
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${live ? "animate-pulse bg-lose" : "bg-muted"}`} />
          <SectionTitle>المباريات المباشرة</SectionTitle>
        </div>
        {groups.length ? (
          <GroupedMatches groups={groups} />
        ) : (
          <div className="card px-6 py-12 text-center text-muted">
            لا توجد مباريات مباشرة الآن
          </div>
        )}
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
