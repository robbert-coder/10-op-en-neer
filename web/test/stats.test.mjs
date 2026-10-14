// Tests voor stats.js, codes.js, version.js en cards.js: de onderdelen zonder scherm.
import { test } from "node:test";
import assert from "node:assert/strict";

// Een nep-opslag, zoals localStorage in de browser
const data = new Map();
globalThis.localStorage = {
  getItem: (k) => (data.has(k) ? data.get(k) : null),
  setItem: (k, v) => data.set(k, String(v)),
  removeItem: (k) => data.delete(k),
};

const stats = await import("../static/stats.js");
const { randomCode, normalizeCode, isCode, CODE_CHARS } = await import("../static/codes.js");
const { isNewerVersion } = await import("../static/version.js");
const { sortHand, suitOrder } = await import("../static/cards.js");
const { playersDetail, matchesVs } = stats;

const game = (id, extra = {}) => ({ id, time: 1000 + Number(id.slice(1)), variant: "10 op en neer", players: 4, rank: 1, score: 150, won: true, rounds: 19, good: 12, ...extra });

test("een spel telt maar één keer, ook na herladen", () => {
  data.clear();
  assert.equal(stats.addGame(game("g1")), true);
  assert.equal(stats.addGame(game("g1")), false);
  assert.equal(stats.loadStats().length, 1);
});

test("volledig spel: uit de spelcode, en bij oude spellen uit de naam", () => {
  assert.equal(stats.isFullGame({ variant: "Boerenbridge tot 10", full: true }), true);
  assert.equal(stats.isFullGame({ variant: "10 op en neer tot 3" }), false);
  assert.equal(stats.isFullGame({ variant: "10 op en neer" }), true);
  assert.equal(stats.countsForRating({ variant: "10 op en neer", tips: true }), false);
});

test("samenvatting en sterren tellen alleen volledige spellen zonder tips", () => {
  const all = [game("g1"), game("g2", { rank: 4, won: false }), game("g3", { full: false }), game("g4", { tips: true })];
  const s = stats.statsSummary(all);
  const { v, ...total } = s;
  assert.deepEqual(total, { a: 4, g: 2, w: 1, r: 38, ok: 24, f: 50 });
  assert.deepEqual(v["10openneer"], total); // allemaal 10 op en neer
  const stars = stats.starRating(s);
  assert.ok(stars >= 0.5 && stars <= 5 && Number.isInteger(stars * 2));
  assert.equal(stats.starRating({ g: 0 }), null);
  assert.equal(stats.statsSummary([]), null);
});

test("samenvoegen van apparaten: op id, nieuwste eerst, niets van voor het wissen", () => {
  const merged = stats.mergeGames([game("g1"), game("g3")], [game("g3"), game("g2"), game("g0")], 1000);
  assert.deepEqual(merged.map((g) => g.id), ["g3", "g2", "g1"]);
});

test("highscores: plaats teruggeven, hooguit tien bewaren", () => {
  data.clear();
  const d = new Date(2026, 9, 13);
  for (let i = 0; i < 10; i++) stats.addHighScore("10openneer", "A", 100 + i, "", d);
  assert.equal(stats.addHighScore("10openneer", "B", 50, "", d), 0);
  assert.equal(stats.addHighScore("10openneer", "C", 200, "4 spelers", d), 1);
  const list = stats.loadHighScores("10openneer");
  assert.equal(list.length, 10);
  assert.deepEqual(list[0], { name: "C", score: 200, date: "13-10-2026", detail: "4 spelers" });
});

test("codes: juiste lengte en tekens, invoer opgeschoond", () => {
  const c = randomCode(12);
  assert.ok(isCode(c, 12));
  assert.ok([...randomCode(50)].every((ch) => CODE_CHARS.includes(ch)));
  assert.equal(normalizeCode(" ab-cd e1 ", 5), "ABCDE");
  assert.equal(isCode("ABCD0", 5), false); // 0 komt niet voor
});

test("versies per getal vergelijken", () => {
  assert.equal(isNewerVersion("v2.10", "2.9"), true);
  assert.equal(isNewerVersion("2.33", "2.33"), false);
  assert.equal(isNewerVersion("2.3", "2.30"), false);
});

test("hand sorteren: rood en zwart om en om, binnen een kleur op waarde", () => {
  const hand = [214, 402, 110, 305, 202].map((code) => ({ code }));
  const order = suitOrder([1, 2, 3, 4]);
  for (let i = 1; i < order.length; i++) assert.notEqual(order[i] % 2, order[i - 1] % 2);
  const up = sortHand(hand).map((c) => c.code);
  assert.deepEqual(up.filter((c) => Math.floor(c / 100) === 2), [202, 214]);
  const down = sortHand(hand, true).map((c) => c.code);
  assert.deepEqual(down.filter((c) => Math.floor(c / 100) === 2), [214, 202]);
});

test("sterren per soort spel: 10 op en neer en Boerenbridge apart", () => {
  const all = [game("g1"), game("g2", { variant: "Boerenbridge", key: "boerenbridge", rank: 4, won: false }), game("g3", { variant: "Boerenbridge" })];
  const s = stats.statsSummary(all);
  assert.equal(s.g, 3);
  assert.equal(stats.statsForKind(s, "10openneer").g, 1);
  assert.equal(stats.statsForKind(s, "boerenbridge").g, 2); // ook een ouder spel zonder key, uit de naam
  assert.equal(stats.statsForKind(s, "hybride"), null);
  // Oudere versies deelden alleen het totaal
  assert.equal(stats.statsForKind({ a: 1, g: 1 }, "boerenbridge").g, 1);
});

test("tegen wie: mensen, sterke of gewone computers", () => {
  const sterk = playersDetail(4, 1, true);
  const gewoon = playersDetail(4, 1, false);
  const samen = playersDetail(4, 2, true);
  assert.equal(sterk, "4 spelers: 1 mens, 3 sterke computers");
  assert.equal(playersDetail(2, 1, false), "2 spelers: 1 mens, 1 gewone computer");
  assert.equal(playersDetail(3, 3, true), "3 spelers: 3 mensen");
  assert.deepEqual(["", "sterk", "gewoon", "mensen"].map((vs) => matchesVs(sterk, vs)), [true, true, false, false]);
  assert.deepEqual(["", "sterk", "gewoon", "mensen"].map((vs) => matchesVs(gewoon, vs)), [true, false, true, false]);
  assert.deepEqual(["", "sterk", "gewoon", "mensen"].map((vs) => matchesVs(samen, vs)), [true, false, false, true]);
  // Oude score zonder sterkte: alleen bij iedereen
  assert.deepEqual(["", "sterk", "gewoon"].map((vs) => matchesVs("4 spelers: 1 mens, 3 computers", vs)), [true, false, false]);
});
