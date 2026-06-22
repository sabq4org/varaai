// Conservative Latin→Arabic transliterator for Arab (mostly Saudi) player names.
//
// Philosophy (VARA = precision): ALL-OR-NOTHING per name. We only return Arabic
// if every meaningful token is recognized. Single-letter initials are dropped.
// Otherwise we return null so the caller keeps the original name — we never emit
// a half-broken mixed name.

// Given names — many Latin spellings map to one Arabic form.
const GIVEN: Record<string, string> = {
  abdullah: "عبدالله", abdallah: "عبدالله", abdulla: "عبدالله",
  abdulrahman: "عبدالرحمن", abdelrahman: "عبدالرحمن", abdurrahman: "عبدالرحمن", abdulrhman: "عبدالرحمن",
  abdulaziz: "عبدالعزيز", abdelaziz: "عبدالعزيز",
  abdulelah: "عبدالإله", abdullelah: "عبدالإله", abdulilah: "عبدالإله",
  abdulmalik: "عبدالملك", abdulmajeed: "عبدالمجيد", abdulmajid: "عبدالمجيد",
  mohammed: "محمد", mohamed: "محمد", muhammad: "محمد", mohammad: "محمد", muhammed: "محمد",
  ahmed: "أحمد", ahmad: "أحمد",
  ali: "علي", omar: "عمر", osama: "أسامة", oussama: "أسامة",
  saud: "سعود", saad: "سعد", sand: "سعد",
  sultan: "سلطان", fahad: "فهد", fahd: "فهد", faisal: "فيصل", faysal: "فيصل",
  khalid: "خالد", khaled: "خالد",
  nasser: "ناصر", naser: "ناصر", nawaf: "نواف",
  salem: "سالم", salim: "سالم", saleh: "صالح", salah: "صلاح",
  turki: "تركي", yasser: "ياسر", yasir: "ياسر",
  hassan: "حسن", hasan: "حسن", hussain: "حسين", hussein: "حسين", husain: "حسين",
  hamad: "حمد", hamed: "حامد", hamid: "حامد",
  majed: "ماجد", majid: "ماجد", marwan: "مروان", mansour: "منصور", mansoor: "منصور",
  mukhtar: "مختار", riyadh: "رياض", riyad: "رياض",
  sami: "سامي", talal: "طلال", walid: "وليد", waleed: "وليد",
  yahya: "يحيى", ziyad: "زياد", zeyad: "زياد", bandar: "بندر", badr: "بدر",
  raed: "رائد", rakan: "راكان", hattan: "حطان", meshal: "مشعل", mishal: "مشعل",
  dhari: "ضاري", sanousi: "سنوسي", firas: "فراس", anas: "أنس", ayman: "أيمن",
  ibrahim: "إبراهيم", yousef: "يوسف", yusuf: "يوسف", youssef: "يوسف",
  karim: "كريم", kareem: "كريم", sattam: "سطام", moteb: "متعب", mutaib: "متعب",
  naif: "نايف", nayef: "نايف", nayif: "نايف", meshari: "مشاري",
  hamdan: "حمدان", sanad: "سند", maan: "معن", motaz: "معتز", muath: "معاذ",
  zakaria: "زكريا", musaab: "مصعب", waad: "وعد", thamer: "ثامر", saif: "سيف",
};

// Family/last names — usually after the "Al" article. Keyed by the post-"Al" root.
const SURNAME: Record<string, string> = {
  dawsari: "الدوسري", dosari: "الدوسري",
  shehri: "الشهري", shahri: "الشهري", shahrani: "الشهراني",
  ghamdi: "الغامدي", otaibi: "العتيبي", oteibi: "العتيبي",
  qahtani: "القحطاني", harbi: "الحربي", zahrani: "الزهراني",
  mutairi: "المطيري", muteiri: "المطيري",
  enezi: "العنزي", anazi: "العنزي", anezi: "العنزي", enazi: "العنزي",
  subaie: "السبيعي", subaiei: "السبيعي", sabiei: "السبيعي",
  hawsawi: "الهوساوي", hwsawi: "الهوساوي", khaibari: "الخيبري", khaibre: "الخيبري",
  amri: "العمري", hamdan: "الحمدان", faraj: "الفرج", owais: "العويس",
  malki: "المالكي", buraikan: "البريكان", buraik: "البريك", breik: "البريك",
  rashidi: "الرشيدي", saadi: "السعدي", saedi: "السعدي", samiri: "السميري",
  najdi: "النجدي", aqidi: "العقيدي", aqeedi: "العقيدي", sharari: "الشراري",
  obaid: "العبيد", ghannam: "الغنام", nasser: "الناصر", najei: "الناجعي",
  sahlawi: "السهلاوي", sahli: "السهلي", dossari: "الدوسري",
};

function clean(token: string): string {
  return token.toLowerCase().replace(/[._]/g, "").replace(/[^a-z]/g, "");
}

function resolveRoot(root: string): string | null {
  if (SURNAME[root]) return SURNAME[root];
  if (GIVEN[root]) return "ال" + GIVEN[root];
  return null;
}

/** Returns Arabic name, or null if not fully recognized. */
export function transliterateName(input: string): string | null {
  const tokens = input.trim().split(/\s+/);
  if (tokens.length === 0) return null;

  const out: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    // Drop initials like "S." or "A".
    if (raw.replace(/[.]/g, "").length === 1) continue;

    const token = clean(raw);
    if (!token) continue;

    // Standalone definite article "Al" → merge with the following surname.
    if (token === "al") {
      const next = tokens[i + 1] ? clean(tokens[i + 1]) : "";
      const resolved = next ? resolveRoot(next) : null;
      if (!resolved) return null;
      out.push(resolved);
      i++; // consume the surname token too
      continue;
    }

    // Glued "Alhwsawi" / hyphen-stripped "Alenezi".
    if (token.startsWith("al") && token.length > 3) {
      const resolved = resolveRoot(token.slice(2));
      if (!resolved) return null;
      out.push(resolved);
      continue;
    }

    if (GIVEN[token]) { out.push(GIVEN[token]); continue; }
    if (SURNAME[token]) { out.push(SURNAME[token]); continue; }

    return null; // unknown token → keep original name
  }

  if (out.length === 0) return null;
  return out.join(" ");
}
