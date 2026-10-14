// Gesproken extra's naast de voorspellingen (voices.js): de begroeting bij het openen, de snelle zinnen die je
// bij samen spelen hardop kunt laten zeggen, en de uitleg van Tineke (tineke.js). Opnames: sounds/<naam>.mp3,
// gemaakt met tools/elevenlabs.py (stap "extra"), dat speechJobs() via node uitleest.
import { spokenLines, speechFile } from "./tineke.js";

/** Wat de omroeper roept als je het spel opent; elke keer een andere. */
export const OPENERS = [
  "Tien op en neeer!",
  "Welkom aan tafel! Schud de kaarten maar!",
  "Daar zijn we weer: tien op en neeer!",
  "Kaarten op tafel, het gaat beginnen!",
  "Tien op en neer! Wie haalt vandaag de meeste slagen?",
];

/** Zinnen die je bij samen spelen in je eigen stem kunt laten zeggen (hoogstens één per 30 seconden). */
export const PHRASES = [
  "Ben je er nog?",
  "Schiet eens op!",
  "Niet rond maken!",
  "Goed gespeeld!",
  "Pech gehad!",
  "Oeps!",
  "Dat was op het nippertje!",
  "Nog een potje?",
];
export const PHRASE_VOICES = ["man", "vrouw", "neutraal"];
export const PHRASE_GAP_MS = 30000;

export const openerFile = (k) => `open_${k}`;
export const phraseFile = (voice, k) => `zin_${voice}_${k}`;
export { speechFile as tinekeFile };

/** Alles wat ingesproken moet worden: { file, text, who }, met who = tineke, omroeper of speler_<stem>. */
export function speechJobs() {
  return [
    ...spokenLines().map((text) => ({ file: speechFile(text), text, who: "tineke" })),
    ...OPENERS.map((text, k) => ({ file: openerFile(k), text, who: "omroeper" })),
    ...PHRASE_VOICES.flatMap((v) => PHRASES.map((text, k) => ({ file: phraseFile(v, k), text, who: `speler_${v}` }))),
  ];
}
