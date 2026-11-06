// De uitslag van jouw ronde hardop, door Tineke: "Goed voorspeld! Twaalf punten erbij!" of "Twee voorspeld, drie
// gehaald. Geen punten." Nodig omdat Robbert de inzet en de score wil horen, niet alleen zien.
// Elke zin is een losse opname in elke taal (sounds/uitslag_*.mp3, en in sounds/en/ en sounds/de/), ingesproken
// met de stem van Tineke (tools/elevenlabs.py, stap "opnames:uitslag"). Een foute ronde is drie opnames na
// elkaar (voorspeld, gehaald, punten), zodat niet elke combinatie apart hoeft.

/** Getallen als woord per taal, met hoofdletter (de zinnen beginnen ermee). */
const WORDS = {
  nl: ["Nul", "Eén", "Twee", "Drie", "Vier", "Vijf", "Zes", "Zeven", "Acht", "Negen", "Tien", "Elf", "Twaalf", "Dertien"],
  en: ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"],
  de: ["Null", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun", "Zehn", "Elf", "Zwölf", "Dreizehn"],
};

/** De zinnen per taal; {n} is een getal als woord (klein) of als cijfers bij punten. */
const TEXTS = {
  nl: { good: (x) => `Goed voorspeld! ${x} punten erbij!`, bid: (w) => `${w} voorspeld,`, tricks: (w) => `${w.toLowerCase()} gehaald.`, some: (x) => `${x} punten erbij.`, none: "Geen punten." },
  en: { good: (x) => `Spot on! ${x} points for you!`, bid: (w) => `${w} bid,`, tricks: (w) => `${w.toLowerCase()} taken.`, some: (x) => `${x} points for you.`, none: "No points." },
  de: { good: (x) => `Genau richtig! ${x} Punkte dazu!`, bid: (w) => `${w} angesagt,`, tricks: (w) => `${w.toLowerCase()} gemacht.`, some: (x) => `${x} Punkte dazu.`, none: "Keine Punkte." },
};

/**
 * Alle punten die je met een goede voorspelling kunt krijgen: 10 plus 1 of 3 per slag (10 op en neer en
 * Boerenbridge, ook gemengd), bij 0 tot en met 13 slagen.
 */
export const GOOD_POINTS = [...new Set([1, 3].flatMap((perTrick) => [...Array(14).keys()].map((bid) => 10 + perTrick * bid)))].sort((a, b) => a - b);
/** Punten bij een foute voorspelling als die niet 0 zijn (Boerenbridge: 10 min 3 per slag verschil). */
export const WRONG_POINTS = [7, 4, 1];

/**
 * De opnames (bestandsnamen zonder map) die samen jouw uitslag zeggen, of [] als er niets te zeggen valt.
 * @param {number} bid je voorspelling (0 t/m 13)
 * @param {number} tricks je slagen (0 t/m 13)
 * @param {number} points je punten deze ronde
 * @param {boolean} good of je voorspelling klopte
 */
export function roundResultFiles(bid, tricks, points, good) {
  const ok = (n) => Number.isInteger(n) && n >= 0 && n <= 13;
  if (!ok(bid) || !ok(tricks)) return [];
  if (good) return GOOD_POINTS.includes(points) ? [`uitslag_goed_${points}`] : [];
  const end = points > 0 ? (WRONG_POINTS.includes(points) ? `uitslag_erbij_${points}` : null) : "uitslag_geen";
  return end ? [`uitslag_bod_${bid}`, `uitslag_slagen_${tricks}`, end] : [];
}

/**
 * Alles om in te spreken voor één taal: { file, text, who }, met who = tineke.
 * @param {"nl"|"en"|"de"} language
 */
export function scoreSpeechJobs(language) {
  const words = WORDS[language];
  const say = TEXTS[language];
  return [
    ...GOOD_POINTS.map((x) => ({ file: `uitslag_goed_${x}`, text: say.good(x) })),
    ...words.map((w, n) => ({ file: `uitslag_bod_${n}`, text: say.bid(w) })),
    ...words.map((w, n) => ({ file: `uitslag_slagen_${n}`, text: say.tricks(w) })),
    ...WRONG_POINTS.map((x) => ({ file: `uitslag_erbij_${x}`, text: say.some(x) })),
    { file: "uitslag_geen", text: say.none },
  ].map((job) => ({ ...job, who: "tineke" }));
}
