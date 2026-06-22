import type { MetadataRoute } from "next";
import { vara, DEFAULT_COMPETITION_ID } from "@/lib/vara";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${SITE_URL}${path}`;
  const entries: MetadataRoute.Sitemap = [
    { url: url("/"), priority: 1 },
    { url: url("/competitions"), priority: 0.8 },
    { url: url("/live"), priority: 0.6 },
  ];

  // Competition hubs + their sub-pages.
  try {
    const comps = await vara.competitions();
    for (const c of comps) {
      for (const sub of ["", "/results", "/scorers", "/clubs"]) {
        entries.push({ url: url(`/competitions/${c.id}${sub}`), priority: 0.7 });
      }
    }
  } catch {
    /* keep static entries only */
  }

  // Saudi Pro League clubs (the priority audience).
  try {
    const teams = await vara.teams(DEFAULT_COMPETITION_ID);
    for (const { team } of teams) {
      entries.push({ url: url(`/teams/${team.id}`), priority: 0.6 });
    }
  } catch {
    /* ignore */
  }

  return entries;
}
