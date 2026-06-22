import type { Metadata } from "next";
import { vara } from "@/lib/vara";
import type { TeamProfile, TeamSchedule, TeamSquad } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { InfoTiles } from "@/components/InfoTiles";
import { SquadList } from "@/components/SquadList";
import { TeamScheduleView } from "@/components/team/TeamSchedule";
import { ErrorState, SectionTitle } from "@/components/States";
import { fmtInt } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const t = await vara.team(id);
    return {
      title: t.team.name,
      description: `${t.team.name} — معلومات النادي، الملعب، والقائمة.`,
    };
  } catch {
    return { title: "نادٍ" };
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: TeamProfile | null = null;
  let squad: TeamSquad | null = null;
  let schedule: TeamSchedule | null = null;
  const [p, s, sc] = await Promise.allSettled([
    vara.team(id),
    vara.squad(id),
    vara.teamSchedule(id),
  ]);
  if (p.status === "fulfilled") profile = p.value;
  if (s.status === "fulfilled") squad = s.value;
  if (sc.status === "fulfilled") schedule = sc.value;

  if (!profile && !squad) {
    return (
      <div className="py-2">
        <ErrorState detail="تعذّر تحميل بيانات النادي." />
      </div>
    );
  }

  const team = profile?.team ?? squad!.team;

  return (
    <div className="py-2">
      <div className="mb-5 flex flex-col items-center gap-3 pt-2 text-center">
        <Logo url={team.logo} alt={team.name} size={84} />
        <h1 className="text-xl font-extrabold">{team.name}</h1>
      </div>

      {profile ? (
        <InfoTiles
          tiles={[
            { label: "التأسيس", value: profile.founded ? String(profile.founded) : "—" },
            { label: "السعة", value: fmtInt(profile.venue?.capacity ?? null) },
            { label: "الدولة", value: profile.country ?? "—" },
          ]}
        />
      ) : null}

      {profile?.venue?.name ? (
        <p className="mt-2 text-center text-sm text-muted">📍 {profile.venue.name}</p>
      ) : null}

      {schedule && (schedule.upcoming.length || schedule.recent.length) ? (
        <div className="mt-6">
          <TeamScheduleView
            teamId={id}
            upcoming={schedule.upcoming}
            recent={schedule.recent}
          />
        </div>
      ) : null}

      <SectionTitle>القائمة {squad ? `(${squad.players.length})` : ""}</SectionTitle>
      {squad ? <SquadList players={squad.players} /> : null}
    </div>
  );
}
