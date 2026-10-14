// Je eigen statistiek en highscores op dit apparaat: bewaren, samenvoegen en samenvatten in sterren.
// Alleen gegevens, geen scherm; zo is het los te testen (web/test/stats.test.mjs).
import { store } from "./storage.js";
import { cleanGame, cleanList } from "./validate.js";
import { decimal, t } from "./i18n.js";

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

/** De soorten spel; highscores, de Hall of Fame en de sterren zijn per soort. Op het scherm door t() (i18n.js). */
export const KINDS = { "10openneer": "10 op en neer", boerenbridge: "Boerenbridge", hybride: "Hybride" };

/** Soort van een bewaard spel. Nieuwe spellen weten het zelf (key); bij oudere leiden we het af uit de naam. */
export const gameKind = (g) => g.key
  ?? (g.variant.startsWith("10 op en neer") ? "10openneer" : g.variant.startsWith("Boerenbridge") ? "boerenbridge" : "hybride");

/**
 * Kort overzicht van al je spellen, om met de anderen aan tafel te delen: in totaal, en in v per soort spel
 * (de sterren zijn per soort, want Boerenbridge en 10 op en neer zijn verschillende spellen).
 */
export function statsSummary(all = loadStats()) {
  const sum = summarize(all);
  if (!sum) return null;
  const v = {};
  for (const kind of Object.keys(KINDS)) {
    const s = summarize(all.filter((g) => gameKind(g) === kind));
    if (s) v[kind] = s;
  }
  return { ...sum, v };
}

/**
 * Het overzicht van één soort spel uit een gedeeld overzicht. Oudere versies (voor 2.35) deelden alleen het
 * totaal; dan dat.
 */
export const statsForKind = (stats, kind) => (!stats ? null : stats.v ? stats.v[kind] ?? null : stats);

function summarize(all) {
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
  const text = t("{n} van 5 sterren", { n: Number.isInteger(stars) ? stars : decimal(stars) });
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

/**
 * Wie er meespeelden, als tekst bij een highscore: "4 spelers: 1 mens, 3 sterke computers". Ook de Hall of
 * Fame filtert op deze tekst (supabase-hof.sql), dus de woorden "spelers", "mens", "sterke" en "gewone" blijven.
 */
export function playersDetail(players, humans, smart) {
  const bots = players - humans;
  const kind = smart ? "sterke" : "gewone";
  const parts = [humans ? `${humans} ${humans === 1 ? "mens" : "mensen"}` : "", bots ? `${bots} ${kind} ${bots === 1 ? "computer" : "computers"}` : ""];
  return `${players} spelers: ${parts.filter(Boolean).join(", ")}`;
}

/**
 * Past een highscore bij het filter "tegen wie": "" (iedereen), "mensen" (met andere mensen), "sterk" of
 * "gewoon" (jij alleen tegen sterke of gewone computers). Oude scores zonder sterkte tellen alleen bij iedereen.
 */
export function matchesVs(detail, vs) {
  if (!vs) return true;
  const humans = Number(String(detail ?? "").match(/(\d+) mens/)?.[1] ?? 0);
  if (vs === "mensen") return humans >= 2;
  if (humans !== 1) return false;
  if (vs === "sterk") return /sterke computer/.test(detail);
  if (vs === "gewoon") return /gewone computer/.test(detail);
  return vs === "computers";
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
