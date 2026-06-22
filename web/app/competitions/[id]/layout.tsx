import { Logo } from "@/components/Logo";
import { CompetitionTabs } from "@/components/CompetitionTabs";
import { competitionInfo } from "@/lib/competitions";

export default async function CompetitionLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const info = await competitionInfo(id);

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center gap-3">
        <Logo url={info.logo} alt={info.name} size={34} />
        <div>
          <h1 className="text-lg font-extrabold">{info.name}</h1>
          {info.country ? <p className="text-xs text-muted">{info.country}</p> : null}
        </div>
      </div>
      <CompetitionTabs id={id} />
      {children}
    </div>
  );
}
