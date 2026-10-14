// Gesproken extra's naast de voorspellingen (voices.js): de begroeting bij het openen, de snelle zinnen die je
// bij samen spelen hardop kunt laten zeggen, en de uitleg van Tineke (tineke.js). Opnames: sounds/<naam>.mp3,
// gemaakt met tools/elevenlabs.py (stap "extra"), dat speechJobs() via node uitleest.
import { spokenLines, speechFile } from "./tineke.js";

// Truus roept je toe op het startscherm (gekozen door Robbert). De opnames maakt de stap "begroeting" van
// tools/elevenlabs.py; deze teksten staan hier alleen ter informatie.
/** Bij het openen van het spel; elke keer een andere. */
export const OPENERS = [
  "Tien op en neeeeer!",
  "Jaaa! Daar zijn we weer! Tien op en neeer!",
  "Dames en heren... tien op en neeeeer!",
  "Welkom aan tafel! Schud die kaarten maar, het feest gaat beginnen!",
  "Hup hup hup, kaarten op tafel! Tien op en neer!",
];
/** Als je na een spel terug bent op het startscherm: ze daagt je uit voor nog een potje. */
export const RETURNERS = [
  "Zo, daar ben je weer! Durf je nog een potje aan?",
  "Kom op, nog één potje! Deze keer voorspel jij ze allemaal goed!",
  "Dat smaakt naar meer, toch? Schud die kaarten maar!",
  "Revanche? Ik weet zeker dat je het beter kunt. Bewijs het maar!",
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
export const returnFile = (k) => `terug_${k}`;
export const phraseFile = (voice, k) => `zin_${voice}_${k}`;
export { speechFile as tinekeFile };

/** Wat de stap "extra" inspreekt: { file, text, who }, met who = tineke of speler_<stem>. */
export function speechJobs() {
  return [
    ...spokenLines().map((text) => ({ file: speechFile(text), text, who: "tineke" })),
    ...PHRASE_VOICES.flatMap((v) => PHRASES.map((text, k) => ({ file: phraseFile(v, k), text, who: `speler_${v}` }))),
  ];
}
