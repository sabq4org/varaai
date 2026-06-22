import type { Metadata } from "next";
import Link from "next/link";
import { vara } from "@/lib/vara";
import { Logo } from "@/components/Logo";
import { ErrorState } from "@/components/States";

export const metadata: Metadata = {
  title: "البطولات",
  description: "كل البطولات المتاحة على VARA — السعودية أولاً ثم العالمية.",
};

export default async function CompetitionsPage() {
  let competitions;
  try {
    competitions = await vara.competitions();
  } catch (e) {
    return (
      <div className="py-2">
        <ErrorState detail={(e as Error).message} />
      </div>
    );
  }

  return (
    <div className="py-2">
      <h1 className="mb-4 mt-2 text-lg font-extrabold">البطولات</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {competitions.map((c) => (
          <Link
            key={c.id}
            href={`/competitions/${c.id}`}
            className="card flex items-center gap-3 px-4 py-3.5 transition-colors hover:border-accentDim"
          >
            <Logo url={c.logo} alt={c.name} size={36} />
            <div className="min-w-0">
              <div className="truncate font-bold">{c.name}</div>
              {c.country ? <div className="text-xs text-muted">{c.country}</div> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
