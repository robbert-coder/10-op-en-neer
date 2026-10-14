// Taal van het spel: Nederlands of Engels. Standaard die van het apparaat (nl… is Nederlands, de rest Engels);
// met de vlaggetjes in het hoofdmenu of bij Instellingen kies je zelf (settings.lang, "nl" of "en").
// De Nederlandse tekst is de sleutel: t("Nieuw spel") geeft in het Engels "New game" (uit i18n-en.js).
// Variabelen gaan met {naam}: t("Ronde {n} van {m}", { n: 3, m: 19 }). De test web/test/i18n.test.mjs
// controleert dat elke t("…") in de code en elke tekst in index.html een Engelse vertaling heeft.
//
// Over internet gaat altijd de Nederlandse tekst (snelle zinnen, meldingen van de gastheer); de ontvanger
// vertaalt die zelf. Zo kunnen een Nederlandse en een Engelse speler gewoon samen spelen.
import EN from "./i18n-en.js";

/** De gekozen taal uit de instellingen, of null (dan die van het apparaat). Zonder storage.js, om kringen te voorkomen. */
function chosenLang() {
  try {
    const s = JSON.parse(globalThis.localStorage?.getItem("instellingen") ?? "null");
    return s?.lang === "nl" || s?.lang === "en" ? s.lang : null;
  } catch {
    return null;
  }
}

/** Taal van het apparaat: "nl" als die met nl begint, anders "en". */
export const deviceLang = () => (String(globalThis.navigator?.language ?? "nl").toLowerCase().startsWith("nl") ? "nl" : "en");

/** De taal waarin het spel nu draait: "nl" of "en". */
export const lang = chosenLang() ?? deviceLang();
export const isEnglish = lang === "en";
/** Voor datums en tijden. */
export const locale = isEnglish ? "en-GB" : "nl-NL";

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);

/** Vertaal een Nederlandse tekst (met {variabelen}) naar de taal van het spel. Onbekend: de tekst zelf. */
export function t(nl, vars) {
  const s = isEnglish ? EN[nl] ?? nl : nl;
  return fill(s, vars);
}

/** Heeft deze Nederlandse tekst een Engelse vertaling? */
export const hasEnglish = (nl) => Object.prototype.hasOwnProperty.call(EN, nl);

/** Getal met komma (nl) of punt (en). */
export const decimal = (x, digits = 1) => (isEnglish ? x.toFixed(digits) : x.toFixed(digits).replace(".", ","));

// Kaarten ------------------------------------------------------------------------------------------

const SUITS_NL = ["", "klaver", "ruiten", "schoppen", "harten"];
const SUITS_EN = ["", "clubs", "diamonds", "spades", "hearts"];
const RANKS_NL = { 2: "twee", 3: "drie", 4: "vier", 5: "vijf", 6: "zes", 7: "zeven", 8: "acht", 9: "negen", 10: "tien", 11: "boer", 12: "vrouw", 13: "heer", 14: "aas" };
const RANKS_EN = { 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "jack", 12: "queen", 13: "king", 14: "ace" };

/** Naam van een kleur (1 klaveren … 4 harten): "klaver" of "clubs". */
export const suitWord = (suit) => (isEnglish ? SUITS_EN : SUITS_NL)[suit] ?? "";

/** Naam van een kaart: "klaver vrouw" of "queen of clubs". */
export function cardName(code) {
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  return isEnglish ? `${RANKS_EN[rank]} of ${SUITS_EN[suit]}` : `${SUITS_NL[suit]} ${RANKS_NL[rank]}`;
}

// Teksten uit de spelmotor (Kotlin, gedeeld met de Android-app, dus daar Nederlands) ----------------

const SUIT_RE = SUITS_NL.slice(1).join("|");
const RANK_RE = Object.values(RANKS_NL).join("|");
const enCard = (s, r) => `${RANKS_EN[Object.keys(RANKS_NL).find((k) => RANKS_NL[k] === r)]} of ${SUITS_EN[SUITS_NL.indexOf(s)]}`;
const enSuit = (s) => SUITS_EN[SUITS_NL.indexOf(s)];

const ENGINE = [
  [/^(.+) is aan de beurt\.$/, (m) => t("{name} is aan de beurt.", { name: m[1] })],
  [/^(.+) deelt de kaarten\.$/, (m) => t("{name} deelt de kaarten.", { name: m[1] })],
  [/^(.+) voorspelt (\d+) slag(?:en)?\.$/, (m) => t(Number(m[2]) === 1 ? "{name} voorspelt 1 slag." : "{name} voorspelt {n} slagen.", { name: m[1], n: m[2] })],
  [new RegExp(`^(.+) legt (${SUIT_RE}) (${RANK_RE}) op\\.$`), (m) => t("{name} legt de {card} op.", { name: m[1], card: enCard(m[2], m[3]) })],
  [/^De slag is voor (.+)\.$/, (m) => t("De slag is voor {name}.", { name: m[1] })],
  [/^Ronde (\d+) is afgelopen\.$/, (m) => t("Ronde {n} is afgelopen.", { n: m[1] })],
  [/^(.+) moet uitkomen\.$/, (m) => t("{name} moet uitkomen.", { name: m[1] })],
  [/^Je kunt 0 t\/m (\d+) slagen voorspellen\.$/, (m) => t("Je kunt 0 tot en met {n} slagen voorspellen.", { n: m[1] })],
  [/^Rondmaken is niet toegestaan: je mag geen (\d+) zeggen\.$/, (m) => t("Rondmaken is niet toegestaan: je mag geen {n} zeggen.", { n: m[1] })],
  [new RegExp(`^Je moet kleur bekennen\\. Kies een (${SUIT_RE})\\.$`), (m) => t("Je moet kleur bekennen. Kies een {suit}.", { suit: enSuit(m[1]) })],
  [new RegExp(`^Je moet introeven\\. Kies een (${SUIT_RE})\\.$`), (m) => t("Je moet introeven. Kies een {suit}.", { suit: enSuit(m[1]) })],
  [/^\((.+)\)$/, (m) => `(${engineText(m[1])})`],
  [/^(\d+) te weinig$/, (m) => t("{n} te weinig", { n: m[1] })],
  [/^(\d+) over$/, (m) => t("{n} over", { n: m[1] })],
];

/** Een tekst van de spelmotor (status, foutmelding, slagen over) in de taal van het spel. */
export function engineText(s) {
  if (!isEnglish || !s) return s;
  if (hasEnglish(s)) return EN[s];
  for (const [re, fn] of ENGINE) {
    const m = re.exec(s);
    if (m) return fn(m);
  }
  return s;
}

/** Naam van een spelsoort ("10 op en neer tot 5", "Boerenbridge", "Hybride (nr, iv)"), uit de spelmotor of bewaard. */
export function variantText(v) {
  if (!isEnglish || !v) return v;
  return String(v)
    .replace(/^Hybride \(([^)]*)\)/, (m, opts) => `Hybrid (${opts.replace(/\biv\b/, "mt")})`)
    .replace(/ tot (\d+)$/, " to $1");
}

/**
 * Omschrijving bij een highscore ("tot 5 · 4 spelers: 1 mens, 3 sterke computers"). Die blijft bewaard in het
 * Nederlands (de Hall of Fame filtert erop); alleen het tonen is vertaald.
 */
export function detailText(d) {
  if (!isEnglish || !d) return d;
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
  if (!isEnglish) return;
  const desc = doc.querySelector?.('meta[name="description"]');
  if (desc && hasEnglish(norm(desc.content))) desc.content = EN[norm(desc.content)];
  const walk = (node) => {
    if (node.nodeType === 3) {
      const key = norm(node.nodeValue);
      if (key && hasEnglish(key)) {
        const m = /^(\s*)[\s\S]*?(\s*)$/.exec(node.nodeValue);
        node.nodeValue = m[1] + EN[key] + m[2];
      }
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "svg" || node.getAttribute("translate") === "no") return;
      for (const a of ATTRS) {
        const v = node.getAttribute(a);
        if (v && hasEnglish(norm(v))) node.setAttribute(a, EN[norm(v)]);
      }
      if (node.hasAttribute("data-i18n-html")) {
        const key = norm(node.innerHTML);
        if (hasEnglish(key)) node.innerHTML = EN[key];
        return;
      }
    }
    for (const child of Array.from(node.childNodes)) walk(child);
  };
  walk(root.body ?? root);
}
