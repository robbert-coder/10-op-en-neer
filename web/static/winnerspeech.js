// Aan het eind van het spel feliciteert Tineke de winnaar hardop: een personage bij naam, jou, een andere mens of
// iedereen bij een gedeelde eerste plaats. Nodig omdat Robbert de uitslag wil horen, niet alleen zien.
// Elke zin is een losse opname in elke taal (sounds/winnaar_*.mp3, en in sounds/en/ en sounds/de/), ingesproken
// met de stem van Tineke (tools/elevenlabs.py, stap "opnames:winnaar").

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
