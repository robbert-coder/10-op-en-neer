// De uitslag hardop, door Tineke. Na elke ronde zegt ze jouw uitslag: "Goed voorspeld! Twaalf punten erbij!" of
// "Twee voorspeld, drie gehaald. Geen punten." Aan het eind van het spel feliciteert ze de winnaar. Nodig omdat
// Robbert de inzet en de score wil horen, niet alleen zien.
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

/** De felicitatie aan het eind van het spel per taal: winnaar is een personage, jij, een andere mens of meer spelers. */
const WINNER_TEXTS = {
  nl: { character: (name) => `Gefeliciteerd, ${name}! Jij hebt gewonnen!`, me: "Gefeliciteerd! Jij hebt gewonnen!", other: "Gefeliciteerd met de winst!", shared: "Een gedeelde eerste plaats! Gefeliciteerd allemaal!" },
  en: { character: (name) => `Congratulations, ${name}! You're the winner!`, me: "Congratulations! You won!", other: "Congratulations on the win!", shared: "A shared first place! Congratulations, everyone!" },
  de: { character: (name) => `Herzlichen Glückwunsch, ${name}! Du hast gewonnen!`, me: "Herzlichen Glückwunsch! Du hast gewonnen!", other: "Herzlichen Glückwunsch zum Sieg!", shared: "Ein geteilter erster Platz! Herzlichen Glückwunsch an alle!" },
};

/**
 * De opname die de winnaar feliciteert. Nodig omdat de namen van mensen niet zijn ingesproken: een personage
 * krijgt zijn naam, jij krijgt "jij hebt gewonnen", een andere mens een algemene felicitatie.
 * @param {{ me: boolean, character: string|null }[]} winners iedereen op de eerste plaats
 * @param {string[]} characters de personages met een eigen opname
 */
export function winnerFile(winners, characters) {
  if (!Array.isArray(winners) || !winners.length) return null;
  if (winners.length > 1) return "winnaar_samen";
  const [w] = winners;
  if (w.me) return "winnaar_jij";
  return characters.includes(w.character) ? `winnaar_${w.character}` : "winnaar_ander";
}

/**
 * De felicitaties om in te spreken voor één taal (zie winnerFile).
 * @param {"nl"|"en"|"de"} language
 * @param {{ [id: string]: { name: string } }} characters de personages (characters.js)
 */
export function winnerSpeechJobs(language, characters) {
  const say = WINNER_TEXTS[language];
  return [
    ...Object.entries(characters).map(([id, c]) => ({ file: `winnaar_${id}`, text: say.character(c.name) })),
    { file: "winnaar_jij", text: say.me },
    { file: "winnaar_ander", text: say.other },
    { file: "winnaar_samen", text: say.shared },
  ].map((job) => ({ ...job, who: "tineke" }));
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
