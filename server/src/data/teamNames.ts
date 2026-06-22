// Arabic team-name overrides keyed by API-Football team ID.
// VARA is Saudi-first, so localized names are the default display.
// `name` = full Arabic name, `short` = compact label for tight UI (badges, widgets).

export interface TeamNameOverride {
  name: string;
  short: string;
}

export const arabicTeamNames: Record<string, TeamNameOverride> = {
  // —— Saudi Pro League (Roshn) — 2025 season ——
  "2939": { name: "النصر", short: "النصر" },
  "2932": { name: "الهلال", short: "الهلال" },
  "2929": { name: "الأهلي", short: "الأهلي" },
  "2938": { name: "الاتحاد", short: "الاتحاد" },
  "2933": { name: "القادسية", short: "القادسية" },
  "2934": { name: "الاتفاق", short: "الاتفاق" },
  "2936": { name: "التعاون", short: "التعاون" },
  "2940": { name: "الشباب", short: "الشباب" },
  "2931": { name: "الفتح", short: "الفتح" },
  "2944": { name: "الفيحاء", short: "الفيحاء" },
  "2945": { name: "الحزم", short: "الحزم" },
  "2956": { name: "ضمك", short: "ضمك" },
  "2977": { name: "الأخدود", short: "الأخدود" },
  "2992": { name: "النجمة", short: "النجمة" },
  "2928": { name: "الخليج", short: "الخليج" },
  "10509": { name: "الخلود", short: "الخلود" },
  "10511": { name: "الرياض", short: "الرياض" },
  "10513": { name: "نيوم", short: "نيوم" },
};

// Name-keyed overrides for providers whose IDs differ from API-Football (e.g. Sportmonks).
// Keyed by a normalized root: lowercased, "al"/"fc"/"sc" stripped, non-letters removed.
const arabicTeamNamesByKey: Record<string, TeamNameOverride> = {
  nassr: { name: "النصر", short: "النصر" },
  hilal: { name: "الهلال", short: "الهلال" },
  ahli: { name: "الأهلي", short: "الأهلي" }, ahly: { name: "الأهلي", short: "الأهلي" },
  ittihad: { name: "الاتحاد", short: "الاتحاد" }, itthad: { name: "الاتحاد", short: "الاتحاد" },
  qadsiah: { name: "القادسية", short: "القادسية" }, qadisiyah: { name: "القادسية", short: "القادسية" }, qadisiya: { name: "القادسية", short: "القادسية" },
  taawoun: { name: "التعاون", short: "التعاون" }, taawon: { name: "التعاون", short: "التعاون" },
  ettifaq: { name: "الاتفاق", short: "الاتفاق" }, ittifaq: { name: "الاتفاق", short: "الاتفاق" },
  neom: { name: "نيوم", short: "نيوم" },
  hazm: { name: "الحزم", short: "الحزم" }, hazem: { name: "الحزم", short: "الحزم" },
  fayha: { name: "الفيحاء", short: "الفيحاء" }, feiha: { name: "الفيحاء", short: "الفيحاء" },
  khaleej: { name: "الخليج", short: "الخليج" }, khaleeg: { name: "الخليج", short: "الخليج" },
  fateh: { name: "الفتح", short: "الفتح" },
  shabab: { name: "الشباب", short: "الشباب" },
  kholood: { name: "الخلود", short: "الخلود" }, khulood: { name: "الخلود", short: "الخلود" },
  riyadh: { name: "الرياض", short: "الرياض" },
  damac: { name: "ضمك", short: "ضمك" }, dhamk: { name: "ضمك", short: "ضمك" }, damk: { name: "ضمك", short: "ضمك" },
  okhdoud: { name: "الأخدود", short: "الأخدود" }, akhdoud: { name: "الأخدود", short: "الأخدود" }, okhdood: { name: "الأخدود", short: "الأخدود" },
  najma: { name: "النجمة", short: "النجمة" }, nojoom: { name: "النجمة", short: "النجمة" },
  // Common lower-division / historic clubs for broader Saudi coverage.
  raed: { name: "الرائد", short: "الرائد" },
  batin: { name: "الباطن", short: "الباطن" },
  wehda: { name: "الوحدة", short: "الوحدة" }, wahda: { name: "الوحدة", short: "الوحدة" },
  jabalain: { name: "الجبلين", short: "الجبلين" },
  faisaly: { name: "الفيصلي", short: "الفيصلي" }, faisali: { name: "الفيصلي", short: "الفيصلي" },
  orobah: { name: "العروبة", short: "العروبة" }, arabi: { name: "العروبي", short: "العروبي" },
  bukayriyah: { name: "البكيرية", short: "البكيرية" },
};

// National teams (World Cup & international tournaments), keyed by exact lowercased name.
// Checked before the club key-normalizer (which would mangle "Algeria" → "geria", etc.).
const nationalTeams: Record<string, TeamNameOverride> = {
  "saudi arabia": ohne("السعودية"),
  "korea republic": ohne("كوريا الجنوبية"),
  "south korea": ohne("كوريا الجنوبية"),
  "czech republic": ohne("التشيك"),
  "south africa": ohne("جنوب أفريقيا"),
  mexico: ohne("المكسيك"),
  canada: ohne("كندا"),
  switzerland: ohne("سويسرا"),
  "bosnia and herzegovina": ohne("البوسنة والهرسك"),
  qatar: ohne("قطر"),
  brazil: ohne("البرازيل"),
  morocco: ohne("المغرب"),
  scotland: ohne("اسكتلندا"),
  haiti: ohne("هايتي"),
  "united states": ohne("الولايات المتحدة"),
  usa: ohne("الولايات المتحدة"),
  australia: ohne("أستراليا"),
  paraguay: ohne("الباراغواي"),
  "türkiye": ohne("تركيا"),
  turkiye: ohne("تركيا"),
  turkey: ohne("تركيا"),
  germany: ohne("ألمانيا"),
  "côte d'ivoire": ohne("ساحل العاج"),
  "cote d'ivoire": ohne("ساحل العاج"),
  "ivory coast": ohne("ساحل العاج"),
  ecuador: ohne("الإكوادور"),
  curacao: ohne("كوراساو"),
  "curaçao": ohne("كوراساو"),
  netherlands: ohne("هولندا"),
  japan: ohne("اليابان"),
  sweden: ohne("السويد"),
  tunisia: ohne("تونس"),
  "new zealand": ohne("نيوزيلندا"),
  iran: ohne("إيران"),
  egypt: ohne("مصر"),
  belgium: ohne("بلجيكا"),
  spain: ohne("إسبانيا"),
  uruguay: ohne("الأوروغواي"),
  "cape verde islands": ohne("الرأس الأخضر"),
  "cape verde": ohne("الرأس الأخضر"),
  norway: ohne("النرويج"),
  france: ohne("فرنسا"),
  senegal: ohne("السنغال"),
  iraq: ohne("العراق"),
  argentina: ohne("الأرجنتين"),
  austria: ohne("النمسا"),
  jordan: ohne("الأردن"),
  algeria: ohne("الجزائر"),
  colombia: ohne("كولومبيا"),
  "congo dr": ohne("الكونغو الديمقراطية"),
  "dr congo": ohne("الكونغو الديمقراطية"),
  portugal: ohne("البرتغال"),
  uzbekistan: ohne("أوزبكستان"),
  england: ohne("إنجلترا"),
  ghana: ohne("غانا"),
  panama: ohne("بنما"),
  croatia: ohne("كرواتيا"),
  // Other frequent nations.
  italy: ohne("إيطاليا"),
  serbia: ohne("صربيا"),
  poland: ohne("بولندا"),
  denmark: ohne("الدنمارك"),
  nigeria: ohne("نيجيريا"),
  cameroon: ohne("الكاميرون"),
  mali: ohne("مالي"),
  bahrain: ohne("البحرين"),
  kuwait: ohne("الكويت"),
  oman: ohne("عُمان"),
  "united arab emirates": ohne("الإمارات"),
  uae: ohne("الإمارات"),
  syria: ohne("سوريا"),
  yemen: ohne("اليمن"),
  lebanon: ohne("لبنان"),
  palestine: ohne("فلسطين"),
};

function ohne(name: string): TeamNameOverride {
  return { name, short: name };
}

function normalizeTeamKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\b(fc|sc|club)\b/g, "")
    .replace(/\s+/g, "")
    .replace(/^al/, "");
}

export function localizeTeamName(id: string, fallback: string): TeamNameOverride {
  return arabicTeamNames[id] ?? { name: fallback, short: fallback };
}

/** Localize by team name — used for providers (Sportmonks) whose IDs don't match the ID map. */
export function localizeTeamByName(fallback: string): TeamNameOverride {
  // National teams first (exact name), then the club key-normalizer.
  const national = nationalTeams[fallback.trim().toLowerCase()];
  if (national) return national;
  const hit = arabicTeamNamesByKey[normalizeTeamKey(fallback)];
  return hit ?? { name: fallback, short: fallback };
}
