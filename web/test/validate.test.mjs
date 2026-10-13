// Tests voor de invoercontrole (validate.js): alles wat van andere spelers of de database komt.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BoundedMap, RateLimit, cleanAvatar, cleanChat, cleanGame, cleanInt, cleanList, cleanStartGame, cleanStats, cleanText,
  cleanVoice, devParam,
} from "../static/validate.js";

test("cleanText: stuurtekens weg, ingekort, nooit een object", () => {
  assert.equal(cleanText("  Hallo\u0000\nwereld  ", 40), "Hallo  wereld");
  assert.equal(cleanText("abcdef", 3), "abc");
  assert.equal(cleanText({ toString: () => "<b>" }, 10), "");
  assert.equal(cleanText(null, 10), "");
  assert.equal(cleanText(12, 10), "12");
});

test("cleanInt: binnen de grenzen, anders de standaard", () => {
  assert.equal(cleanInt(7, 1, 5), 5);
  assert.equal(cleanInt(-3, 0, 5), 0);
  assert.equal(cleanInt("4", 0, 5), 4);
  assert.equal(cleanInt("x", 0, 5, 2), 2);
  assert.equal(cleanInt(Infinity, 0, 5, 1), 1);
  assert.equal(cleanInt(2.6, 0, 5), 3);
});

test("cleanList: begrensd en zonder ongeldige items", () => {
  assert.deepEqual(cleanList([1, "a", 2], 10, (x) => (typeof x === "number" ? x : null)), [1, 2]);
  assert.equal(cleanList(Array(50).fill(1), 5, (x) => x).length, 5);
  assert.deepEqual(cleanList("geen lijst", 5, (x) => x), []);
});

test("cleanAvatar: alleen gezichten, emoji's en kleine foto's; geen SVG of script", () => {
  assert.equal(cleanAvatar("p3"), "p3");
  assert.equal(cleanAvatar("🦊"), "🦊");
  assert.equal(cleanAvatar("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
  assert.equal(cleanAvatar("data:image/svg+xml;base64,PHN2Zz4="), null);
  assert.equal(cleanAvatar('data:image/png;base64,AA" onerror="x'), null);
  assert.equal(cleanAvatar("data:image/png;base64," + "A".repeat(70000)), null);
  assert.equal(cleanAvatar("javascript:alert(1)"), null);
});

test("cleanVoice: alleen de drie stemmen", () => {
  assert.equal(cleanVoice("vrouw"), "vrouw");
  assert.equal(cleanVoice("robot"), null);
});

test("cleanStats: getallen begrensd en onderling kloppend", () => {
  assert.equal(cleanStats(null), null);
  assert.equal(cleanStats({ g: 0 }), null);
  const s = cleanStats({ g: 10, w: 50, r: 100, ok: 500, f: 3 });
  assert.equal(s.w, 10); // niet meer gewonnen dan gespeeld
  assert.equal(s.ok, 100); // niet meer goed dan rondes
  assert.equal(cleanStats({ g: 5 }).a, 5); // oudere versies sturen geen a
  assert.equal(cleanStats({ g: "<script>" }), null);
});

test("cleanGame: elk veld van een bewaard spel wordt een veilige waarde", () => {
  assert.equal(cleanGame({ players: 4 }), null); // geen id
  const g = cleanGame({ id: "x", players: "<img src=x onerror=alert(1)>", rank: 9, score: "1e9", variant: "<b>10</b>", time: 5, rounds: 19, good: 99 });
  assert.equal(g.players, 4);
  assert.equal(g.rank, 4);
  assert.equal(g.score, 10000);
  assert.equal(g.good, 19);
  assert.equal(typeof g.variant, "string"); // esc() bij het tonen maakt het onschadelijk
});

test("cleanChat: tekst verplicht, stoel en naam gecontroleerd", () => {
  assert.equal(cleanChat({ text: "" }), null);
  const m = cleanChat({ seat: 9, name: "", text: "hoi", time: "x" });
  assert.equal(m.seat, 5);
  assert.equal(m.name, "Speler");
  assert.equal(typeof m.time, "number");
});

test("cleanStartGame: regels binnen de grenzen, menselijke stoelen bestaan", () => {
  assert.equal(cleanStartGame(null), null);
  assert.equal(cleanStartGame({ rules: {}, humanSeats: [] }), null);
  const g = cleanStartGame({
    rules: { maxCards: 99, players: 5, pointsPerTrick: 1 }, seed: 12, names: ["A", 5, null],
    humanSeats: [1, 3, 3, 9], cast: [null, null, "henk", "hacker", "ria"],
  }, ["henk", "ria"]);
  assert.equal(g.rules.maxCards, 10); // 52 kaarten / 5 spelers
  assert.deepEqual(g.humanSeats, [1, 3]);
  assert.equal(g.names.length, 5);
  assert.deepEqual(g.cast.slice(0, 5), [null, null, "henk", null, "ria"]);
});

test("devParam: testparameters alleen op de eigen computer", () => {
  assert.equal(devParam("relay", new URL("http://localhost:8767/?relay=ws://x")), "ws://x");
  assert.equal(devParam("cloud", new URL("https://robbert-coder.github.io/10-op-en-neer/?cloud=https://kwaad")), null);
});

test("RateLimit: hooguit zoveel per venster, per afzender", () => {
  const r = new RateLimit(3, 1000);
  assert.ok(r.allow("a", 0) && r.allow("a", 1) && r.allow("a", 2));
  assert.equal(r.allow("a", 3), false);
  assert.ok(r.allow("b", 3)); // een ander heeft er geen last van
  assert.equal(r.wait("a", 500), 500);
  assert.ok(r.allow("a", 1001)); // venster voorbij
});

test("BoundedMap: groeit niet voorbij het maximum", () => {
  const m = new BoundedMap(2);
  m.set("a", 1); m.set("b", 2); m.set("c", 3);
  assert.equal(m.size, 2);
  assert.equal(m.has("a"), false);
});

test("cleanGame: soort en volledig (sinds 2.33) alleen als ze kloppen", () => {
  const g = cleanGame({ id: "x", variant: "Boerenbridge tot 10", key: "boerenbridge", full: true });
  assert.equal(g.key, "boerenbridge");
  assert.equal(g.full, true);
  const bad = cleanGame({ id: "y", key: "<script>", full: "ja" });
  assert.equal("key" in bad, false);
  assert.equal("full" in bad, false);
});
