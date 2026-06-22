// Arabic labels for positions and nationalities — provider-agnostic (matched by English name).

const POSITIONS: Record<string, string> = {
  goalkeeper: "حارس مرمى",
  defender: "مدافع",
  midfielder: "وسط",
  attacker: "مهاجم",
  forward: "مهاجم",
  // Detailed positions.
  "centre back": "قلب دفاع",
  "center back": "قلب دفاع",
  "left back": "ظهير أيسر",
  "right back": "ظهير أيمن",
  "defensive midfield": "ارتكاز",
  "central midfield": "وسط محوري",
  "attacking midfield": "صانع ألعاب",
  "left wing": "جناح أيسر",
  "right wing": "جناح أيمن",
  "centre forward": "رأس حربة",
  "center forward": "رأس حربة",
  "left midfield": "وسط أيسر",
  "right midfield": "وسط أيمن",
  "secondary striker": "مهاجم ثانٍ",
};

export function localizePosition(name?: string | null): string | undefined {
  if (!name) return undefined;
  return POSITIONS[name.trim().toLowerCase()] ?? name;
}

// Common nationalities for Saudi/Gulf football. Falls back to the source name.
const COUNTRIES: Record<string, string> = {
  "saudi arabia": "السعودية",
  brazil: "البرازيل",
  portugal: "البرتغال",
  france: "فرنسا",
  spain: "إسبانيا",
  argentina: "الأرجنتين",
  morocco: "المغرب",
  algeria: "الجزائر",
  tunisia: "تونس",
  egypt: "مصر",
  senegal: "السنغال",
  mali: "مالي",
  "ivory coast": "ساحل العاج",
  ghana: "غانا",
  nigeria: "نيجيريا",
  cameroon: "الكاميرون",
  serbia: "صربيا",
  croatia: "كرواتيا",
  italy: "إيطاليا",
  england: "إنجلترا",
  germany: "ألمانيا",
  belgium: "بلجيكا",
  netherlands: "هولندا",
  colombia: "كولومبيا",
  uruguay: "الأوروغواي",
  mexico: "المكسيك",
  "south korea": "كوريا الجنوبية",
  japan: "اليابان",
  australia: "أستراليا",
  jordan: "الأردن",
  syria: "سوريا",
  iraq: "العراق",
  "united arab emirates": "الإمارات",
  bahrain: "البحرين",
  kuwait: "الكويت",
  oman: "عُمان",
  qatar: "قطر",
  yemen: "اليمن",
  lebanon: "لبنان",
  ghana_: "غانا",
  greece: "اليونان",
  turkey: "تركيا",
  "türkiye": "تركيا",
  turkiye: "تركيا",
  poland: "بولندا",
  norway: "النرويج",
  sweden: "السويد",
  denmark: "الدنمارك",
  austria: "النمسا",
  switzerland: "سويسرا",
  ecuador: "الإكوادور",
  venezuela: "فنزويلا",
  paraguay: "الباراغواي",
  chile: "تشيلي",
  "burkina faso": "بوركينا فاسو",
  guinea: "غينيا",
  gabon: "الغابون",
  congo: "الكونغو",
  "dr congo": "الكونغو الديمقراطية",
  angola: "أنغولا",
};

export function localizeCountry(name?: string | null): string | undefined {
  if (!name) return undefined;
  return COUNTRIES[name.trim().toLowerCase()] ?? name;
}
