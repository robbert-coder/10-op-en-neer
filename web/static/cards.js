// Kaarten tekenen en ordenen. Een kaart is een getal: kleur * 100 + waarde (2 t/m 14, aas = 14).

/** Tekens van de kleuren: 1 klaveren, 2 ruiten, 3 schoppen, 4 harten (kaartcode = kleur * 100 + waarde). */
export const SUIT = ["", "♣︎", "♦︎", "♠︎", "♥︎"];
import { isEnglish } from "./i18n.js";

/** Plaatjes en aas (boer, vrouw, heer, aas; in het Engels J, Q, K, A); de rest is het getal zelf. */
export const LABEL = isEnglish ? { 11: "J", 12: "Q", 13: "K", 14: "A" } : { 11: "B", 12: "V", 13: "H", 14: "A" };

/** Eén kaart als HTML; code 0 is een lege plek. */
export function cardHtml(code, extra = "", style = "") {
  if (!code) return `<div class="card empty ${extra}" style="${style}"></div>`;
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  const red = suit === 2 || suit === 4 ? "red" : "";
  const label = LABEL[rank] ?? String(rank);
  const sym = SUIT[suit];
  const mid = rank >= 11 && rank <= 13 ? `<span class="mid face">${label}</span>` : `<span class="mid">${sym}</span>`;
  return `<div class="card ${red} ${extra}" style="${style}" data-code="${code}">` +
    `<span class="ci tl"><b>${label}</b><i>${sym}</i></span>${mid}<span class="ci br"><b>${label}</b><i>${sym}</i></span></div>`;
}

/** De troef rechtsboven: klein, maar met de kleur (klaver, schoppen…) groot genoeg om te herkennen. */
export function trumpMiniHtml(code) {
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  const red = suit === 2 || suit === 4 ? "red" : "";
  return `<div class="card trumpmini ${red}" style="--w:36px" data-code="${code}"><b>${LABEL[rank] ?? rank}</b><i>${SUIT[suit]}</i></div>`;
}

/**
 * Kleuren in de hand zo ordenen dat rood en zwart elkaar afwisselen: ruiten niet naast harten en
 * schoppen niet naast klaveren, als dat kan met de kleuren die je hebt.
 */
export function suitOrder(suits) {
  const red = (s) => s === 2 || s === 4;
  const perms = (list) => list.length <= 1 ? [list] :
    list.flatMap((x, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest]));
  let best = null;
  let bestClash = Infinity;
  for (const order of perms(suits)) {
    let clash = 0;
    for (let i = 1; i < order.length; i++) if (red(order[i]) === red(order[i - 1])) clash++;
    if (clash < bestClash) { best = order; bestClash = clash; }
  }
  return best;
}

/** Je hand gesorteerd: per kleur (rood en zwart om en om) en binnen een kleur op waarde. */
export function sortHand(cards, descending = false) {
  const suits = [...new Set(cards.map((c) => Math.floor(c.code / 100)))].sort();
  const pos = new Map(suitOrder(suits).map((s, i) => [s, i]));
  const dir = descending ? -1 : 1;
  return cards.slice().sort((a, b) =>
    pos.get(Math.floor(a.code / 100)) - pos.get(Math.floor(b.code / 100)) || dir * ((a.code % 100) - (b.code % 100)));
}
