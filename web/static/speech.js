// Gesproken extra's naast de voorspellingen (voices.js): de begroeting bij het openen, de snelle zinnen die je
// bij samen spelen hardop kunt laten zeggen, en de uitleg van Tineke (tineke.js). Opnames: sounds/<naam>.mp3,
// gemaakt met tools/elevenlabs.py (stap "extra"), dat speechJobs() via node uitleest.
import { spokenLines, speechFile } from "./tineke.js";
import { REACTIONS } from "./characters.js";

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

/** Teken voor een uitgesproken zin over de lijn, zodat "Goed gespeeld!" uit de chat er niet mee verward wordt. */
export const SAY_MARK = "🗣️ ";
/** Het chatbericht voor snelle zin [k]; oudere versies zien het als gewone tekst. */
export const sayWire = (k) => SAY_MARK + PHRASES[k];

/**
 * Welke snelle zin dit bericht uitspreekt (0..), of -1 voor een gewoon chatbericht. Nodig omdat zo'n zin niet in
 * de chat hoort: de anderen moeten hem horen, niet lezen.
 */
export function spokenPhrase(text) {
  if (typeof text !== "string" || !text.startsWith(SAY_MARK)) return -1;
  return PHRASES.indexOf(text.slice(SAY_MARK.length));
}

export const PHRASE_VOICES = ["man", "vrouw", "neutraal"];

/** Snelle berichten onder de chat (zonder stem). */
export const QUICK = ["👍", "😂", "😮", "😢", "👏", "🔥", "Goed gespeeld!", "Pech!", "Haha", "Even wachten"];
/** Wat je medespelers zien als je een tip gebruikt. */
export const TIP_CHAT = "💡 Ik heb een tip gebruikt.";
/**
 * Vaste teksten die als chatbericht over de lijn gaan. Ze gaan altijd in het Nederlands (zo blijft een tafel met
 * Nederlandse en Engelse spelers, en met oudere versies, werken); wie Engels speelt, ziet ze vertaald (i18n.js).
 */
export const WIRE_TEXTS = new Set([...PHRASES, ...QUICK, TIP_CHAT]);
export const PHRASE_GAP_MS = 30000;

export const openerFile = (k) => `open_${k}`;
export const returnFile = (k) => `terug_${k}`;
export const phraseFile = (voice, k) => `zin_${voice}_${k}`;
/**
 * Reacties van de computerspelers die ook uitgesproken worden (de andere zijn alleen een tekstballon), met de
 * toon: 0 = hun gewone toon, 1 = de toon waarmee ze nat gaan (zie TOON in tools/elevenlabs.py).
 */
export const SPOKEN_REACTIONS = { wacht: 0, allenat: 1 };
/** Bestandsnaam (sounds/<naam>.mp3) van een uitgesproken reactie: soort, personage en nummer van de zin. */
export const reactionFile = (kind, who, k) => `reactie_${kind}_${who}_${k}`;
export { speechFile as tinekeFile };

/** Wat de stap "extra" inspreekt: { file, text, who }, met who = tineke of speler_<stem>. */
export function speechJobs() {
  return [
    ...spokenLines().map((text) => ({ file: speechFile(text), text, who: "tineke" })),
    ...PHRASE_VOICES.flatMap((v) => PHRASES.map((text, k) => ({ file: phraseFile(v, k), text, who: `speler_${v}` }))),
    ...Object.entries(SPOKEN_REACTIONS).flatMap(([kind, tone]) => Object.entries(REACTIONS[kind]).flatMap(([who, lines]) =>
      lines.map((text, k) => ({ file: reactionFile(kind, who, k), text, who, tone })))),
  ];
}
