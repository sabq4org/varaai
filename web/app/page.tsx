import Link from "next/link";
import { vara } from "@/lib/vara";
import { FEATURED, pickHeroMatch, trulyLive, upcoming, teamGroupMap, groupForMatch, isInProgress } from "@/lib/featured";
import type { BracketStage, Match, MatchDayGroup, Standings, TopScorer } from "@/lib/types";
import { HeroMatch } from "@/components/home/HeroMatch";
import { NextUp } from "@/components/home/NextUp";
import { WorldCupGroups } from "@/components/home/WorldCupGroups";
import { TournamentPulse } from "@/components/home/TournamentPulse";
import { TopScorersRace } from "@/components/home/TopScorersRace";
import { LatestResults } from "@/components/home/LatestResults";
import { RoadToFinal } from "@/components/home/RoadToFinal";
import { hasLive } from "@/components/GroupedMatches";
import { TodayMatches } from "@/components/home/TodayMatches";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ErrorState } from "@/components/States";

export const dynamic = "force-dynamic";

function SectionHead({
  title,
  subtitle,
  href,
  cta,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-3 mt-10 flex items-end justify-between gap-3 px-1">
      <div className="flex items-center gap-2.5">
        <span className="rail" />
        <div className="flex flex-col leading-tight">
          <h2 className="text-base font-extrabold">{title}</h2>
          {subtitle ? <span className="text-[11px] text-muted">{subtitle}</span> : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 rounded-full border border-line/70 bg-surface/50 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent/10"
        >
          {cta ?? "الكل"}
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const id = FEATURED.competitionId;
  const [liveR, nextR, standR, todayR, resultsR, scorersR, bracketR] = await Promise.allSettled([
    vara.matches(id, "live"),
    vara.matches(id, "next", 8),
    vara.standings(id),
    vara.matchesToday(),
    vara.matches(id, "last", 12),
    vara.topScorers(id, "goals"),
    vara.bracket(id),
  ]);

  const live: Match[] = liveR.status === "fulfilled" ? liveR.value : [];
  const next: Match[] = nextR.status === "fulfilled" ? nextR.value : [];
  const standings: Standings | null = standR.status === "fulfilled" ? standR.value : null;
  const today: MatchDayGroup[] = todayR.status === "fulfilled" ? todayR.value : [];
  const results: Match[] = resultsR.status === "fulfilled" ? resultsR.value : [];
  const scorers: TopScorer[] = scorersR.status === "fulfilled" ? scorersR.value : [];
  const bracket: BracketStage[] = bracketR.status === "fulfilled" ? bracketR.value : [];

  if (!live.length && !next.length && !standings && !today.length && !results.length) {
    return (
      <div className="py-2">
        <ErrorState detail="تأكّد أن VARA Edge يعمل على المنفذ 8787 (cd server && bun run dev)." />
      </div>
    );
  }

  const liveNow = trulyLive(live);
  const upNext = upcoming(next);
  const hero = pickHeroMatch(live, next);
  const heroInProgress = hero ? hero.state !== "live" && isInProgress(hero) : false;
  const heroPlaying = hero ? hero.state === "live" || heroInProgress : false;
  const groupMap = standings ? teamGroupMap(standings) : new Map<string, string>();

  return (
    <div className="py-2">
      <AutoRefresh enabled={hasLive(today) || liveNow.length > 0 || heroInProgress} seconds={15} />

      {hero ? (
        <div className="mt-2 animate-rise">
          <HeroMatch
            match={hero}
            group={groupForMatch(hero, groupMap)}
            eventName={FEATURED.name}
            inProgress={heroInProgress}
          />
          {heroPlaying && upNext.length ? (
            <NextUp match={upNext[0]} group={groupForMatch(upNext[0], groupMap)} />
          ) : null}
        </div>
      ) : null}

      {/* نبض البطولة — vital signs computed from real data */}
      <TournamentPulse standings={standings} results={results} topScorer={scorers[0] ?? null} />

      {today.length ? (
        <section className="animate-rise">
          <SectionHead title="مباريات اليوم" subtitle="كل مباريات اليوم بالتوقيت المحلي" href="/live" cta="المباشر" />
          <TodayMatches groups={today} />
        </section>
      ) : null}

      {scorers.length ? (
        <section className="animate-rise">
          <SectionHead
            title="سباق الهدّافين"
            subtitle="ترتيب الهدّافين في البطولة"
            href={`/competitions/${id}/scorers`}
            cta="القائمة كاملة"
          />
          <TopScorersRace scorers={scorers} />
        </section>
      ) : null}

      {results.length ? (
        <section className="animate-rise">
          <SectionHead
            title="أحدث النتائج"
            subtitle="آخر المباريات المنتهية"
            href={`/competitions/${id}/results`}
            cta="كل النتائج"
          />
          <LatestResults matches={results} />
        </section>
      ) : null}

      {bracket.length ? (
        <section className="animate-rise">
          <SectionHead
            title="الطريق إلى النهائي"
            subtitle="الأدوار الإقصائية ومواجهاتها"
            href={`/competitions/${id}/bracket`}
            cta="كل الأدوار"
          />
          <RoadToFinal stages={bracket} />
        </section>
      ) : null}

      {standings && standings.grouped ? (
        <section className="animate-rise">
          <SectionHead
            title="ترتيب المجموعات"
            subtitle="المتأهلان الأولان من كل مجموعة"
            href={`/competitions/${id}`}
            cta="كامل البطولة"
          />
          <WorldCupGroups standings={standings} />
        </section>
      ) : null}
    </div>
  );
}
