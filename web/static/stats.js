// Je eigen statistiek en highscores op dit apparaat: bewaren, samenvoegen en samenvatten in sterren.
// Alleen gegevens, geen scherm; zo is het los te testen (web/test/stats.test.mjs).
import { store } from "./storage.js";
import { cleanGame, cleanList } from "./validate.js";

/** Hoeveel scores er per highscorelijst bewaard blijven. */
export const MAX_HIGHSCORES = 10;
/** Elk uitgespeeld spel van jezelf, nieuwste eerst (op dit apparaat). */
export const MAX_STATS = 1000;

/** Je bewaarde spellen; elk gecontroleerd, want ze kunnen ook uit de database komen (zie validate.js). */
export const loadStats = () => cleanList(store.get("statistiek", []), MAX_STATS, cleanGame);

/**
 * Een afgelopen spel bewaren. Geeft false als dat spel er al in staat (bijvoorbeeld na herladen), zodat
 * het niet dubbel meetelt.
 */
export function addGame(record) {
  const list = loadStats();
  if (list.some((g) => g.id === record.id)) return false;
  list.unshift(record);
  store.set("statistiek", list.slice(0, MAX_STATS));
  return true;
}

/**
 * Een spel dat helemaal tot het hoogste aantal kaarten ging. Nieuwe spellen weten dat zelf (full, uit de
 * spelcode); bij oudere spellen leiden we het af uit de naam ("… tot 3" is kort).
 */
export const isFullGame = (g) => (typeof g.full === "boolean" ? g.full : !/ tot \d+$/.test(g.variant));
/** Telt een spel mee voor de sterren? Niet als je er tips bij gebruikte. */
export const countsForRating = (g) => isFullGame(g) && !g.tips;

/** Kort overzicht van al je spellen, om met de anderen aan tafel te delen. */
export function statsSummary(all = loadStats()) {
  if (!all.length) return null;
  // Alleen volledige spellen tellen mee: korte spellen zeggen te weinig over hoe goed je speelt
  const list = all.filter(countsForRating);
  // Plaats omgerekend naar 0 (laatste) .. 100 (eerste), zodat tafels van 2 en 5 spelers te vergelijken zijn
  const place = (g) => (g.players > 1 ? (g.players - g.rank) / (g.players - 1) : 1);
  return {
    a: all.length,
    g: list.length,
    w: list.filter((g) => g.won).length,
    r: list.reduce((n, g) => n + g.rounds, 0),
    ok: list.reduce((n, g) => n + g.good, 0),
    f: list.length ? Math.round((100 * list.reduce((n, g) => n + place(g), 0)) / list.length) : 0,
  };
}

/**
 * Sterren (0,5 tot 5, in halve stappen) uit hoe hoog je eindigt en hoe vaak je goed voorspelt.
 * Met weinig spellen trekt de waardering naar het midden, zodat één gelukje geen vijf sterren geeft.
 */
export function starRating(s) {
  if (!s?.g) return null;
  const raw = 0.6 * (s.f / 100) + 0.4 * (s.r ? s.ok / s.r : 0.5);
  const sure = (raw * s.g + 0.45 * 3) / (s.g + 3);
  return Math.max(0.5, Math.min(5, Math.round((1 + (4 * (sure - 0.15)) / 0.6) * 2) / 2));
}

/** Vijf sterretjes (vol, half of leeg), met de waarde als tekst voor schermlezers. */
export function starsHtml(stars, cls = "") {
  if (stars == null) return "";
  const one = (i) => `<i class="${stars >= i ? "full" : stars >= i - 0.5 ? "half" : ""}">★</i>`;
  const text = `${String(stars).replace(".", ",")} van 5 sterren`;
  return `<span class="stars ${cls}" title="${text}" aria-label="${text}">${[1, 2, 3, 4, 5].map(one).join("")}</span>`;
}

/**
 * Twee lijsten spellen samenvoegen (op id), zonder spellen van voor het laatste wissen. Zo kun je op
 * meerdere apparaten spelen met dezelfde statistiek.
 */
export function mergeGames(a, b, clearedAt) {
  const byId = new Map();
  for (const g of [...a, ...b]) if (g.time > clearedAt && !byId.has(g.id)) byId.set(g.id, g);
  return [...byId.values()].sort((x, y) => y.time - x.time).slice(0, MAX_STATS);
}

/** De highscores van één lijst (bijvoorbeeld "10openneer" of "boerenbridge.kort"). */
export const loadHighScores = (key) => store.get("highscore." + key, []);

/** Voegt een score toe en geeft de plaats (1..10), of 0 als de score de lijst niet haalt. */
export function addHighScore(key, name, score, detail = "", d = new Date()) {
  const list = loadHighScores(key);
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  let pos = list.findIndex((h) => score > h.score);
  if (pos < 0) pos = list.length;
  if (pos >= MAX_HIGHSCORES) return 0;
  list.splice(pos, 0, detail ? { name, score, date, detail } : { name, score, date });
  store.set("highscore." + key, list.slice(0, MAX_HIGHSCORES));
  return pos + 1;
}
