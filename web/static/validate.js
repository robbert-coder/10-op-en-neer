// Controle van alles wat van buiten komt: berichten van andere spelers, de database en de adresregel.
// Alles op één plek, zodat elke ingang dezelfde regels gebruikt. Wat niet klopt, wordt een veilige
// standaardwaarde; zo kan een vreemd of kwaadwillig bericht het spel niet laten vastlopen.

import { isFaceCode } from "./avatarcode.js";

/** De getekende gezichten die je kunt kiezen (zie PERSONS in faces.js). */
export const AVATAR_FACES = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12"];

/** Emoji's die oudere versies als plaatje gebruikten; worden nog getoond als iemand ze heeft. */
export const AVATAR_EMOJIS = ["🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯", "🐨", "🐷", "🐙", "🦉", "🐧",
  "😎", "🤠", "👑", "🌷", "⚽", "🎸", "☕", "🍀"];

/** Grootste eigen foto (als data-URL): ruim genoeg voor een klein vierkant plaatje, te klein om te misbruiken. */
const MAX_PHOTO = 60000;

/**
 * Tekst van een ander: altijd een string, zonder stuurtekens, ingekort tot [max] tekens. Ontsnappen voor
 * HTML gebeurt bij het tonen (esc in app.js); dit voorkomt rare tekens en te lange teksten.
 */
export function cleanText(v, max) {
  if (v == null || typeof v === "object") return "";
  return String(v).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ").trim().slice(0, max);
}

/** Een geheel getal tussen min en max, anders [fallback]. Voor stoelen, scores, aantallen en tijden. */
export function cleanInt(v, min, max, fallback = min) {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}

/** Een lijst van hooguit [max] items, elk door [clean]; wat null oplevert valt weg. */
export function cleanList(v, max, clean) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const x of v.slice(0, max)) {
    const c = clean(x);
    if (c != null) out.push(c);
  }
  return out;
}

/** Een gewoon object (geen lijst, geen null), anders null. */
export const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/** Je eigen stem bij het voorspellen: man, vrouw of neutraal. */
export const cleanVoice = (v) => (["man", "vrouw", "neutraal", "geen"].includes(v) ? v : null);

/**
 * Een plaatje van een ander alleen gebruiken als het een gezicht, een samengesteld poppetje, een emoji (oudere versies) of een kleine
 * foto is. Geen SVG: daarin kan code zitten.
 */
export function cleanAvatar(v) {
  if (typeof v !== "string") return null;
  if (AVATAR_FACES.includes(v) || AVATAR_EMOJIS.includes(v) || isFaceCode(v)) return v;
  if (v.length <= MAX_PHOTO && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  return null;
}

/**
 * Het statistiekoverzicht van een ander: alleen nette getallen, of null. Met per soort spel (v) nog een
 * overzicht van dezelfde vorm.
 */
export function cleanStats(v) {
  const sum = cleanSummary(v);
  if (!sum || !isObject(v.v)) return sum;
  const kinds = {};
  for (const k of ["10openneer", "boerenbridge", "hybride"]) {
    const s = cleanSummary(v.v[k]);
    if (s) kinds[k] = s;
  }
  return { ...sum, v: kinds };
}

function cleanSummary(v) {
  if (!isObject(v)) return null;
  const n = (x, max) => cleanInt(x, 0, max, 0);
  const g = n(v.g, 100000);
  // a: alle spellen (ook korte); g en de rest: alleen volledige spellen. Oudere versies stuurden geen a.
  const all = Math.max(g, n(v.a ?? v.g, 100000));
  if (!all) return null;
  const r = n(v.r, 10000000);
  return { a: all, g, w: Math.min(g, n(v.w, 100000)), r, ok: Math.min(r, n(v.ok, 10000000)), f: n(v.f, 100) };
}

/**
 * Eén gespeeld spel uit je statistiek. Die komt uit de database (waar iedereen met jouw code in kan
 * schrijven) of uit de opslag van de browser, dus elk veld wordt gecontroleerd voordat het getoond wordt.
 */
export function cleanGame(g) {
  if (!isObject(g) || typeof g.id !== "string" || !g.id || g.id.length > 60) return null;
  const players = cleanInt(g.players, 2, 5, 4);
  return {
    id: g.id,
    time: cleanInt(g.time, 0, 8.64e15, 0),
    variant: cleanText(g.variant, 60) || "10 op en neer",
    players,
    rank: cleanInt(g.rank, 1, players, players),
    score: cleanInt(g.score, -10000, 10000, 0),
    won: !!g.won,
    rounds: cleanInt(g.rounds, 0, 60, 0),
    good: Math.min(cleanInt(g.rounds, 0, 60, 0), cleanInt(g.good, 0, 60, 0)),
    online: !!g.online,
    others: cleanList(g.others, 4, (n) => cleanText(n, 16) || null),
    ...(g.tips ? { tips: true } : {}),
    // Sinds 2.33: soort spel en of het volledig was, uit de spelcode (oudere spellen hebben dit niet)
    ...(["10openneer", "boerenbridge", "hybride"].includes(g.key) ? { key: g.key } : {}),
    ...(typeof g.full === "boolean" ? { full: g.full } : {}),
  };
}

/** Een chatbericht van een ander aan tafel. */
export function cleanChat(m) {
  if (!isObject(m)) return null;
  const text = cleanText(m.text, 200);
  if (!text) return null;
  return { seat: cleanInt(m.seat, 0, 5, 0), name: cleanText(m.name, 16) || "Speler", text, time: cleanInt(m.time, 0, 8.64e15, Date.now()) };
}

/**
 * Parameters in de adresregel om met een eigen testserver te werken (?relay, ?cloud, ?idle …). Alleen op
 * de eigen computer: anders kan iemand een link sturen die jouw gegevens naar een andere server stuurt.
 */
export function devParam(name, loc = globalThis.location) {
  if (!loc) return null;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(loc.hostname);
  return local ? new URLSearchParams(loc.search).get(name) : null;
}

/**
 * Beperkt hoe vaak iets mag gebeuren per afzender: [count] keer per [ms]. Voor chat (geen spam) en voor
 * binnenkomende berichten in het algemeen (een overvloed aan berichten kan het spel niet platleggen).
 */
export class RateLimit {
  constructor(count, ms, maxKeys = 500) {
    this.count = count;
    this.ms = ms;
    this.maxKeys = maxKeys;
    this.hits = new Map(); // afzender -> tijden binnen het venster
  }

  /** Mag het nu? Telt het meteen mee als het mag. */
  allow(key = "", now = Date.now()) {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.ms);
    if (list.length >= this.count) { this.hits.set(key, list); return false; }
    list.push(now);
    this.hits.delete(key); // opnieuw achteraan: de oudste afzenders vallen het eerst weg
    this.hits.set(key, list);
    if (this.hits.size > this.maxKeys) this.hits.delete(this.hits.keys().next().value);
    return true;
  }

  /** Over hoeveel milliseconden het weer mag (0 = nu). */
  wait(key = "", now = Date.now()) {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.ms);
    return list.length < this.count ? 0 : this.ms - (now - list[0]);
  }
}

/** Chat: hooguit 5 berichten per 10 seconden per persoon. Zowel bij het versturen als bij ontvangst. */
export const chatLimit = () => new RateLimit(5, 10000);

/**
 * Een Map die niet onbeperkt groeit: boven [max] gaat het oudste item eruit. Voor lijsten die anderen
 * kunnen vullen, zoals de mensen en tafels in de lobby.
 */
export class BoundedMap extends Map {
  constructor(max) {
    super();
    this.max = max;
  }

  set(key, value) {
    if (!this.has(key) && this.size >= this.max) this.delete(this.keys().next().value);
    return super.set(key, value);
  }
}

/**
 * De startgegevens van een spel van de gastheer: regels, beginwaarde, namen en wie er meedoet. Hieruit
 * rekent elk apparaat het hele spel na; een onzinnige waarde mag de spelmotor dus niet bereiken.
 * [castIds]: de bekende computerspelers (characters.js).
 */
export function cleanStartGame(g, castIds = []) {
  if (!isObject(g) || !isObject(g.rules)) return null;
  const r = g.rules;
  const players = cleanInt(r.players, 2, 5, 4);
  const rules = {
    maxCards: cleanInt(r.maxCards, 1, Math.min(13, Math.floor(52 / players)), 10),
    pointsPerTrick: cleanInt(r.pointsPerTrick, 0, 10, 1),
    wrongScoresZero: !!r.wrongScoresZero,
    penaltyPerTrick: cleanInt(r.penaltyPerTrick, 0, 10, 0),
    negativeScores: !!r.negativeScores,
    roundingAllowed: !!r.roundingAllowed,
    mustTrump: !!r.mustTrump,
    players,
  };
  const humanSeats = [...new Set(cleanList(g.humanSeats, 5, (s) => (Number.isInteger(s) && s >= 1 && s <= players ? s : null)))];
  if (!humanSeats.length) return null;
  return {
    rules,
    smart: !!g.smart,
    tips: !!g.tips,
    // Per stoel (index 0 en 1 leeg), dus plekken behouden: onbekend wordt null
    cast: Array.from({ length: 6 }, (_, i) => (Array.isArray(g.cast) && castIds.includes(g.cast[i]) ? g.cast[i] : null)),
    seed: cleanInt(g.seed, 0, 2147483647, 0),
    names: Array.from({ length: players }, (_, i) => cleanText(Array.isArray(g.names) ? g.names[i] : "", 30) || `Speler ${i + 1}`),
    humanSeats,
  };
}
