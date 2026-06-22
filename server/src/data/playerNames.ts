// Arabic name overrides for stars & notable players, keyed by API-Football player ID.
// Curated for confidence — any unmapped player falls back to the source name.

export const arabicPlayerNames: Record<string, string> = {
  // —— Al-Nassr ——
  "874": "كريستيانو رونالدو",
  "304": "ساديو ماني",
  "508": "كينغسلي كومان",
  "583": "جواو فيليكس",
  "10111": "بينتو",
  "22250": "موكتار سيماكان",
  "2670": "إنيغو مارتينيز",
  "44475": "عبدالإله العمري",
  "44315": "عبدالله الخيبري",
  "44447": "عبدالرحمن غريب",
  "44382": "عبدالله الحمدان",
  // —— Damac ——
  "4476": "عبدالقادر بدران",
};

// Coaches keyed by API-Football coach ID.
export const arabicCoachNames: Record<string, string> = {
  "123": "جورجي جيزوس",
  "3114": "أرماندو إيفانجيليستا",
};

// Name-keyed overrides — provider-agnostic (works across API-Football & Sportmonks).
// Mainly foreign stars whose names transliteration intentionally won't touch.
const arabicPlayerNamesByName: Record<string, string> = {
  "cristiano ronaldo": "كريستيانو رونالدو",
  "c. ronaldo": "كريستيانو رونالدو",
  "sadio mane": "ساديو ماني",
  "sadio mané": "ساديو ماني",
  "karim benzema": "كريم بنزيمة",
  "neymar": "نيمار",
  "neymar jr": "نيمار",
  "joão félix": "جواو فيليكس",
  "joao felix": "جواو فيليكس",
  "ivan toney": "إيفان توني",
  "julián quiñones": "خوليان كينيونيس",
  "julian quinones": "خوليان كينيونيس",
  "roger martínez": "روجر مارتينيز",
  "roger martinez": "روجر مارتينيز",
  "joshua king": "جوشوا كينغ",
  "kalidou koulibaly": "كاليدو كوليبالي",
  "yassine bounou": "ياسين بونو",
  "bono": "ياسين بونو",
  "riyad mahrez": "رياض محرز",
  "aleksandar mitrovic": "ألكسندر ميتروفيتش",
  "aleksandar mitrović": "ألكسندر ميتروفيتش",
  "sergej milinkovic-savic": "سيرغي ميلينكوفيتش-سافيتش",
  "ruben neves": "روبن نيفيز",
  "rúben neves": "روبن نيفيز",
  "marcos leonardo": "ماركوس ليوناردو",
  "malcom": "مالكوم",
  "theo hernández": "تيو هيرنانديز",
  "theo hernandez": "تيو هيرنانديز",
  "moussa diaby": "موسى ديابي",
  "roger ibañez": "روجر إيبانيز",
  "roger ibanez": "روجر إيبانيز",
  "pablo marí": "بابلو ماري",
  "pablo mari": "بابلو ماري",
  "yannick carrasco": "يانيك كاراسكو",
};

import { transliterateName } from "./transliterate.ts";

export function localizePlayer(id: string | number | null | undefined, fallback: string): string {
  // 1) Curated override by provider ID (API-Football stars) wins.
  if (id != null && arabicPlayerNames[String(id)]) return arabicPlayerNames[String(id)]!;
  // 2) Name-based override (foreign stars, any provider).
  const byName = arabicPlayerNamesByName[fallback.trim().toLowerCase()];
  if (byName) return byName;
  // 3) Auto-transliterate Arab names (all-or-nothing).
  const auto = transliterateName(fallback);
  if (auto) return auto;
  // 4) Keep the original name.
  return fallback;
}

export function localizeCoach(id: string | number | null | undefined, fallback: string): string {
  if (id == null) return fallback;
  return arabicCoachNames[String(id)] ?? fallback;
}
