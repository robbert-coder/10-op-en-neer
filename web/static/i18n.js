// Taal van het spel: Nederlands, Engels of Duits. Standaard die van het apparaat (nl… Nederlands, de… Duits, de
// rest Engels); met de vlaggetjes in het hoofdmenu of bij Instellingen kies je zelf (settings.lang).
// De Nederlandse tekst is de sleutel: t("Nieuw spel") geeft in het Engels "New game" (uit i18n-en.js) en in het
// Duits "Neues Spiel" (uit i18n-de.js). Variabelen gaan met {naam}: t("Ronde {n} van {m}", { n: 3, m: 19 }).
// De test web/test/i18n.test.mjs controleert dat elke t("…") in de code en elke tekst in index.html in beide
// vertalingen staat.
//
// Over internet gaat altijd de Nederlandse tekst (snelle zinnen, meldingen van de gastheer); de ontvanger
// vertaalt die zelf. Zo kunnen spelers met verschillende talen gewoon samen spelen.
import EN from "./i18n-en.js";
import DE from "./i18n-de.js";

/** De talen van het spel; de eerste is die van de sleutels. */
export const LANGS = ["nl", "en", "de"];
/** Vertaling per taal (Nederlands heeft er geen nodig). */
const TABLES = { en: EN, de: DE };

/** De gekozen taal uit de instellingen, of null (dan die van het apparaat). Zonder storage.js, om kringen te voorkomen. */
function chosenLang() {
  try {
    const s = JSON.parse(globalThis.localStorage?.getItem("instellingen") ?? "null");
    return LANGS.includes(s?.lang) ? s.lang : null;
  } catch {
    return null;
  }
}

/** Taal van het apparaat: "nl" of "de" als die daarmee begint, anders "en". */
export function deviceLang() {
  const code = String(globalThis.navigator?.language ?? "nl").toLowerCase();
  return code.startsWith("nl") ? "nl" : code.startsWith("de") ? "de" : "en";
}

/** De taal waarin het spel nu draait: "nl", "en" of "de". */
export const lang = chosenLang() ?? deviceLang();
export const isEnglish = lang === "en";
export const isGerman = lang === "de";
/** De vertaling van de huidige taal, of null in het Nederlands. */
const TABLE = TABLES[lang] ?? null;
/** Voor datums en tijden. */
export const locale = { nl: "nl-NL", en: "en-GB", de: "de-DE" }[lang];

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

/** Vertaal een Nederlandse tekst (met {variabelen}) naar de taal van het spel. Onbekend: de tekst zelf. */
export function t(nl, vars) {
  const s = TABLE?.[nl] ?? nl;
  return fill(s, vars);
}

/** Heeft deze Nederlandse tekst een vertaling in de taal van het spel? */
const translated = (nl) => !!TABLE && Object.prototype.hasOwnProperty.call(TABLE, nl);

/** Getal met komma (nl, de) of punt (en). */
export const decimal = (x, digits = 1) => (isEnglish ? x.toFixed(digits) : x.toFixed(digits).replace(".", ","));

// Kaarten ------------------------------------------------------------------------------------------

const SUITS_NL = ["", "klaver", "ruiten", "schoppen", "harten"];
const SUITS_EN = ["", "clubs", "diamonds", "spades", "hearts"];
const RANKS_NL = { 2: "twee", 3: "drie", 4: "vier", 5: "vijf", 6: "zes", 7: "zeven", 8: "acht", 9: "negen", 10: "tien", 11: "boer", 12: "vrouw", 13: "heer", 14: "aas" };
const RANKS_EN = { 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "jack", 12: "queen", 13: "king", 14: "ace" };
const SUITS_DE = ["", "Kreuz", "Karo", "Pik", "Herz"];
const RANKS_DE = { 2: "Zwei", 3: "Drei", 4: "Vier", 5: "Fünf", 6: "Sechs", 7: "Sieben", 8: "Acht", 9: "Neun", 10: "Zehn", 11: "Bube", 12: "Dame", 13: "König", 14: "Ass" };

/** Naam van een kleur (1 klaveren … 4 harten): "klaver", "clubs" of "Kreuz". */
export const suitWord = (suit) => ({ en: SUITS_EN, de: SUITS_DE }[lang] ?? SUITS_NL)[suit] ?? "";

/** Naam van een kaart in de taal van het spel: "klaver vrouw", "queen of clubs" of "Kreuz Dame". */
export function cardName(code) {
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  if (isEnglish) return `${RANKS_EN[rank]} of ${SUITS_EN[suit]}`;
  if (isGerman) return `${SUITS_DE[suit]} ${RANKS_DE[rank]}`;
  return `${SUITS_NL[suit]} ${RANKS_NL[rank]}`;
}

// Teksten uit de spelmotor (Kotlin, gedeeld met de Android-app, dus daar Nederlands) ----------------

const SUIT_RE = SUITS_NL.slice(1).join("|");
const RANK_RE = Object.values(RANKS_NL).join("|");
/** Een kaart uit een Nederlandse zin van de spelmotor ("klaver" en "vrouw") in de taal van het spel. */
const engineCard = (s, r) => cardName(SUITS_NL.indexOf(s) * 100 + Number(Object.keys(RANKS_NL).find((k) => RANKS_NL[k] === r)));
/** Een kleur uit een Nederlandse zin van de spelmotor in de taal van het spel. */
const engineSuit = (s) => suitWord(SUITS_NL.indexOf(s));

const ENGINE = [
  [/^(.+) is aan de beurt\.$/, (m) => t("{name} is aan de beurt.", { name: m[1] })],
  [/^(.+) deelt de kaarten\.$/, (m) => t("{name} deelt de kaarten.", { name: m[1] })],
  [/^(.+) voorspelt (\d+) slag(?:en)?\.$/, (m) => t(Number(m[2]) === 1 ? "{name} voorspelt 1 slag." : "{name} voorspelt {n} slagen.", { name: m[1], n: m[2] })],
  [new RegExp(`^(.+) legt (${SUIT_RE}) (${RANK_RE}) op\\.$`), (m) => t("{name} legt de {card} op.", { name: m[1], card: engineCard(m[2], m[3]) })],
  [/^De slag is voor (.+)\.$/, (m) => t("De slag is voor {name}.", { name: m[1] })],
  [/^Ronde (\d+) is afgelopen\.$/, (m) => t("Ronde {n} is afgelopen.", { n: m[1] })],
  [/^(.+) moet uitkomen\.$/, (m) => t("{name} moet uitkomen.", { name: m[1] })],
  [/^Je kunt 0 t\/m (\d+) slagen voorspellen\.$/, (m) => t("Je kunt 0 tot en met {n} slagen voorspellen.", { n: m[1] })],
  [/^Rondmaken is niet toegestaan: je mag geen (\d+) zeggen\.$/, (m) => t("Rondmaken is niet toegestaan: je mag geen {n} zeggen.", { n: m[1] })],
  [new RegExp(`^Je moet kleur bekennen\\. Kies een (${SUIT_RE})\\.$`), (m) => t("Je moet kleur bekennen. Kies een {suit}.", { suit: engineSuit(m[1]) })],
  [new RegExp(`^Je moet introeven\\. Kies een (${SUIT_RE})\\.$`), (m) => t("Je moet introeven. Kies een {suit}.", { suit: engineSuit(m[1]) })],
  [/^\((.+)\)$/, (m) => `(${engineText(m[1])})`],
  [/^(\d+) te weinig$/, (m) => t("{n} te weinig", { n: m[1] })],
  [/^(\d+) over$/, (m) => t("{n} over", { n: m[1] })],
];

/** Een tekst van de spelmotor (status, foutmelding, slagen over) in de taal van het spel. */
export function engineText(s) {
  if (!TABLE || !s) return s;
  if (translated(s)) return TABLE[s];
  for (const [re, fn] of ENGINE) {
    const m = re.exec(s);
    if (m) return fn(m);
  }
  return s;
}

/** Naam van een spelsoort ("10 op en neer tot 5", "Boerenbridge", "Hybride (nr, iv)"), uit de spelmotor of bewaard. */
export function variantText(v) {
  if (!TABLE || !v) return v;
  const [mustTrump, upTo] = isGerman ? ["tz", "bis"] : ["mt", "to"];
  return String(v)
    .replace(/^Hybride \(([^)]*)\)/, (m, opts) => `Hybrid (${opts.replace(/\biv\b/, mustTrump)})`)
    .replace(/ tot (\d+)$/, ` ${upTo} $1`);
}

/**
 * Omschrijving bij een highscore ("tot 5 · 4 spelers: 1 mens, 3 sterke computers"). Die blijft bewaard in het
 * Nederlands (de Hall of Fame filtert erop); alleen het tonen is vertaald.
 */
export function detailText(d) {
  if (!TABLE || !d) return d;
  if (isGerman) {
    return String(d)
      .replace(/\btot (\d+)/g, "bis $1")
      .replace(/(\d+) spelers/g, "$1 Spieler")
      .replace(/(\d+) mensen\b/g, "$1 Menschen")
      .replace(/(\d+) mens\b/g, "$1 Mensch")
      .replace(/\bsterke\b/g, "starke")
      .replace(/\bgewone\b/g, "normale")
      .replace(/\bcomputers?\b/g, "Computer");
  }
  return String(d)
    .replace(/\btot (\d+)/g, "up to $1")
    .replace(/(\d+) spelers/g, "$1 players")
    .replace(/(\d+) mensen\b/g, "$1 humans")
    .replace(/(\d+) mens\b/g, "$1 human")
    .replace(/\bsterke\b/g, "strong")
    .replace(/\bgewone\b/g, "regular");
}

// De pagina zelf (index.html) ------------------------------------------------------------------------

const norm = (s) => s.replace(/\s+/g, " ").trim();
const ATTRS = ["placeholder", "aria-label", "title", "alt"];

/**
 * Vertaalt de vaste teksten van de pagina: tekst tussen de tags en de attributen placeholder, aria-label,
 * title en alt. Een element met data-i18n-html wordt in zijn geheel vertaald (tekst met <b> erin);
 * translate="no" slaat een element over. Eén keer bij het starten, voordat het spel iets tekent.
 */
export function translateDom(root = globalThis.document) {
  const doc = root.ownerDocument ?? root;
  doc.documentElement.lang = lang;
  if (!TABLE) return;
  const desc = doc.querySelector?.('meta[name="description"]');
  if (desc && translated(norm(desc.content))) desc.content = TABLE[norm(desc.content)];
  const walk = (node) => {
    if (node.nodeType === 3) {
      const key = norm(node.nodeValue);
      if (key && translated(key)) {
        const m = /^(\s*)[\s\S]*?(\s*)$/.exec(node.nodeValue);
        node.nodeValue = m[1] + TABLE[key] + m[2];
      }
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "svg" || node.getAttribute("translate") === "no") return;
      for (const a of ATTRS) {
        const v = node.getAttribute(a);
        if (v && translated(norm(v))) node.setAttribute(a, TABLE[norm(v)]);
      }
      if (node.hasAttribute("data-i18n-html")) {
        const key = norm(node.innerHTML);
        if (translated(key)) node.innerHTML = TABLE[key];
        return;
      }
    }
    for (const child of Array.from(node.childNodes)) walk(child);
  };
  walk(root.body ?? root);
}
