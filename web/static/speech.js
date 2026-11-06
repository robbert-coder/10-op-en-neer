// Gesproken extra's naast de voorspellingen (voices.js): de begroeting bij het openen, de snelle zinnen die je
// bij samen spelen hardop kunt laten zeggen, en de uitleg van Tineke (tineke.js). Opnames: sounds/<naam>.mp3,
// gemaakt met tools/elevenlabs.py (stap "extra"), dat speechJobs() via node uitleest.
import { spokenLines, spokenPairs, speechFile } from "./tineke.js";
import { CHARACTERS, REACTIONS, REACTIONS_DE, REACTIONS_EN } from "./characters.js";
import { BID_LINES_EN, OPENERS_EN, RETURNERS_EN, WET_LINES_EN } from "./voices-en.js";
import { BID_LINES_DE, OPENERS_DE, RETURNERS_DE, WET_LINES_DE } from "./voices-de.js";
import EN from "./i18n-en.js";
import DE from "./i18n-de.js";
import { scoreSpeechJobs, winnerSpeechJobs } from "./scorespeech.js";

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
/**
 * Reacties die sinds v2.72 ook hardop gaan (toon zoals hierboven), maar alleen in de talen van
 * EXTRA_REACTION_LANGS: daar zijn ze ingesproken (stap "opnames:reacties"). In een andere taal blijft het een
 * tekstballon.
 */
export const EXTRA_SPOKEN_REACTIONS = { oei: 1, slag: 0, hoog: 0, rond: 1, over: 0, onder: 0, tip: 0 };
export const EXTRA_REACTION_LANGS = ["nl", "en", "de"];
/** Wordt deze soort reactie in deze taal hardop gezegd? */
export const isSpokenReaction = (kind, language) =>
  kind in SPOKEN_REACTIONS || (kind in EXTRA_SPOKEN_REACTIONS && EXTRA_REACTION_LANGS.includes(language));
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

/** Map voor de Engelse opnames: sounds/en/<naam>.mp3 (zelfde namen als de Nederlandse). */
export const EN_DIR = "en/";
/** Map van de opnames per taal: sounds/<map><naam>.mp3; Nederlands staat direct in sounds/. */
export const VOICE_DIRS = { nl: "", en: EN_DIR, de: "de/" };

/** Alle teksten per taal die worden ingesproken (zelfde vorm als in het Nederlands). */
const SPEECH_TEXTS = {
  en: { bids: BID_LINES_EN, wet: WET_LINES_EN, reactions: REACTIONS_EN, table: EN, openers: OPENERS_EN, returners: RETURNERS_EN },
  de: { bids: BID_LINES_DE, wet: WET_LINES_DE, reactions: REACTIONS_DE, table: DE, openers: OPENERS_DE, returners: RETURNERS_DE },
};

/**
 * Alles wat tools/elevenlabs.py in een andere taal inspreekt (stap "engels" of "duits"): { file, text, who, tone? }.
 * Zelfde bestandsnamen als in het Nederlands (in sounds/en/ of sounds/de/), behalve Tineke: die heeft de hash van
 * haar zin in die taal. who = personage, speler_<stem>, tineke of begroeting (Truus op het startscherm).
 * @param {"en"|"de"} language
 */
export function translatedSpeechJobs(language) {
  const { bids: bidLines, wet: wetLines, reactions: reactionLines, table, openers, returners } = SPEECH_TEXTS[language];
  const bids = Object.entries(bidLines).flatMap(([who, rows]) => rows.flatMap((row, n) => row.map((text, k) =>
    ({ file: `bod_${who}_${n}_${k}`, text, who, ...(who.startsWith("speler_") ? {} : { tone: 0 }) }))));
  const wet = Object.entries(wetLines).flatMap(([who, lines]) => lines.map((text, k) => ({ file: `nat_${who}_${k}`, text, who, tone: 1 })));
  const reactions = Object.entries(SPOKEN_REACTIONS).flatMap(([kind, tone]) => Object.entries(reactionLines[kind]).flatMap(([who, lines]) =>
    lines.map((text, k) => ({ file: reactionFile(kind, who, k), text, who, tone }))));
  const tineke = [...new Set(spokenPairs(language).map(([, said]) => said))].map((text) => ({ file: speechFile(text), text, who: "tineke" }));
  const phrases = PHRASE_VOICES.flatMap((v) => PHRASES.map((nl, k) => ({ file: phraseFile(v, k), text: table[nl] ?? nl, who: `speler_${v}` })));
  const greetings = [...openers.map((text, k) => ({ file: openerFile(k), text, who: "begroeting" })),
    ...returners.map((text, k) => ({ file: returnFile(k), text, who: "begroeting" }))];
  return [...bids, ...wet, ...reactions, ...tineke, ...phrases, ...greetings];
}

/** De Engelse opnames (stap "engels"); zie translatedSpeechJobs. */
export const englishSpeechJobs = () => translatedSpeechJobs("en");

/** De reacties per taal (Nederlands is de basis). */
const REACTIONS_BY_LANG = { nl: REACTIONS, en: REACTIONS_EN, de: REACTIONS_DE };

/**
 * Nieuwe opnames per set, voor de stap "opnames:<set>" van tools/elevenlabs.py: { file, text, who, tone?, language }.
 * file is het pad onder sounds/ (met en/ of de/ ervoor), zodat één stap alle talen tegelijk kan inspreken.
 * Nodig om alleen wat nieuw is in te spreken, in plaats van alles opnieuw (dat kost tegoed).
 *   uitslag          de uitslag van je ronde en de felicitatie van de winnaar (scorespeech.js), in alle talen
 *   reacties[:a,b]   de reacties uit EXTRA_SPOKEN_REACTIONS (of alleen de soorten a en b), in de talen van
 *                    EXTRA_REACTION_LANGS; in delen, zodat wat klaar is bewaard blijft als het tegoed op raakt
 * @param {string} set
 */
export function recordingJobs(set) {
  const inDir = (language, jobs) => jobs.map((job) => ({ ...job, file: VOICE_DIRS[language] + job.file, language }));
  const languages = ["nl", "en", "de"];
  if (set === "uitslag") {
    return languages.flatMap((language) => inDir(language, [...winnerSpeechJobs(language, CHARACTERS), ...scoreSpeechJobs(language)]));
  }
  if (set.startsWith("reacties")) {
    const only = set.includes(":") ? set.slice(set.indexOf(":") + 1).split(",") : Object.keys(EXTRA_SPOKEN_REACTIONS);
    const kinds = Object.entries(EXTRA_SPOKEN_REACTIONS).filter(([kind]) => only.includes(kind));
    return EXTRA_REACTION_LANGS.flatMap((language) => inDir(language, kinds.flatMap(([kind, tone]) =>
      Object.entries(REACTIONS_BY_LANG[language][kind]).flatMap(([who, lines]) =>
        lines.map((text, k) => ({ file: reactionFile(kind, who, k), text, who, tone }))))));
  }
  // De extra zinnen bij wachten en allemaal nat (vanaf de vierde): de eerste drie zijn al eerder ingesproken
  if (set === "erbij") {
    return languages.flatMap((language) => inDir(language, Object.entries(SPOKEN_REACTIONS).flatMap(([kind, tone]) =>
      Object.entries(REACTIONS_BY_LANG[language][kind]).flatMap(([who, lines]) =>
        lines.map((text, k) => ({ file: reactionFile(kind, who, k), text, who, tone })).slice(3)))));
  }
  return [];
}
