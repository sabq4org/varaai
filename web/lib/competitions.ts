import { vara, DEFAULT_COMPETITION_NAME } from "./vara";
import type { CompetitionSummary } from "./types";

/** Resolve a competition's display info (name/logo) from the cached catalog. */
export async function competitionInfo(
  id: string,
): Promise<{ name: string; logo?: string; country?: string }> {
  try {
    const list = await vara.competitions();
    const found = list.find((c: CompetitionSummary) => c.id === id);
    if (found) return { name: found.name, logo: found.logo, country: found.country };
  } catch {
    /* fall through to default */
  }
  return { name: id === "944" ? DEFAULT_COMPETITION_NAME : `بطولة ${id}` };
}
