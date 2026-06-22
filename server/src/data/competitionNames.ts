// Arabic competition-name overrides keyed by API-Football league ID.

export interface CompetitionNameOverride {
  name: string;
  short: string;
}

export const arabicCompetitionNames: Record<string, CompetitionNameOverride> = {
  // —— API-Football IDs ——
  "307": { name: "دوري روشن السعودي", short: "دوري روشن" },
  "308": { name: "دوري يلو (الدرجة الأولى)", short: "دوري يلو" },
  "309": { name: "الدرجة الثانية السعودية", short: "الدرجة الثانية" },
  "504": { name: "كأس الملك", short: "كأس الملك" },
  "826": { name: "كأس السوبر السعودي", short: "السوبر" },
  "1227": { name: "الدوري السعودي للسيدات", short: "دوري السيدات" },
  // —— Sportmonks league IDs ——
  "944": { name: "دوري روشن السعودي", short: "دوري روشن" },
  "947": { name: "دوري يلو (الدرجة الأولى)", short: "دوري يلو" },
  "2540": { name: "الدرجة الثانية السعودية", short: "الدرجة الثانية" },
  "950": { name: "كأس الملك", short: "كأس الملك" },
  "953": { name: "كأس ولي العهد", short: "كأس ولي العهد" },
  "1557": { name: "كأس السوبر السعودي", short: "السوبر" },
  "1678": { name: "ملحق دوري روشن", short: "الملحق" },
  "1085": { name: "دوري أبطال آسيا للنخبة", short: "أبطال آسيا" },
  "1088": { name: "دوري أبطال آسيا 2", short: "أبطال آسيا 2" },
  "3268": { name: "الدوري السعودي للسيدات", short: "دوري السيدات" },
  "3225": { name: "دوري أرامكو للرديف", short: "الرديف" },
  "1782": { name: "دوري الشباب", short: "الشباب" },
  "3569": { name: "دوري النخبة تحت 21", short: "تحت 21" },
  // —— International ——
  "732": { name: "كأس العالم", short: "المونديال" },
  "5": { name: "دوري أبطال أوروبا", short: "أبطال أوروبا" },
};

// Name-based fallback for providers whose competition IDs aren't mapped above.
const byName: Record<string, CompetitionNameOverride> = {
  "pro league": { name: "دوري روشن السعودي", short: "دوري روشن" },
  "division 1": { name: "دوري يلو (الدرجة الأولى)", short: "دوري يلو" },
  "division 2": { name: "الدرجة الثانية السعودية", short: "الدرجة الثانية" },
  "kings cup": { name: "كأس الملك", short: "كأس الملك" },
  "crown prince cup": { name: "كأس ولي العهد", short: "كأس ولي العهد" },
  "super cup": { name: "كأس السوبر السعودي", short: "السوبر" },
  "world cup": { name: "كأس العالم", short: "المونديال" },
  "world cup qualifiers": { name: "تصفيات كأس العالم", short: "التصفيات" },
  "wc qualification europe": { name: "تصفيات كأس العالم - أوروبا", short: "التصفيات" },
  "champions league": { name: "دوري أبطال أوروبا", short: "أبطال أوروبا" },
  "europa league": { name: "الدوري الأوروبي", short: "يوروبا ليغ" },
  "premier league": { name: "الدوري الإنجليزي الممتاز", short: "البريميرليغ" },
  "fa cup": { name: "كأس الاتحاد الإنجليزي", short: "كأس الاتحاد" },
};

export function localizeCompetitionName(id: string, fallback: string): CompetitionNameOverride {
  return (
    arabicCompetitionNames[id] ??
    byName[fallback.trim().toLowerCase()] ?? { name: fallback, short: fallback }
  );
}
