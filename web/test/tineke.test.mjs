// Tineke's uitleg: wanneer ze uitlegt waarom je nat bent, wat ze zegt bij fout voorspellen, en "alleen nieuwe tips".
import { test } from "node:test";
import assert from "node:assert/strict";
import { help, spokenLines, speechFile } from "../static/tineke.js";
import { existsSync } from "node:fs";

const describe = (code) => `kaart ${code}`;

/** Een slag ligt compleet op tafel; speler 1 (jij) heeft bod [bid], al [tricks] slagen en nog [left] kaarten. */
function trickState({ bid, tricks, left, winner }) {
  const players = [1, 2, 3, 4].map((nr) => ({ name: `S${nr}`, bid: nr === 1 ? bid : 1, tricks: nr === 1 ? tricks : 0, cardCount: left }));
  return { players, leader: 2, trickWinner: winner, table: [205, 210, 203, 204], trump: 0, isTienOpEnNeer: true, cards: left + 1 };
}

test("nat door te veel slagen: Tineke zegt waarom, en bij 10 op en neer dat je geen punten krijgt", () => {
  const h = help("slag naar hoogste", trickState({ bid: 0, tricks: 0, left: 3, winner: 1 }), 0, describe, { wrongZero: true });
  assert.ok(h.keys.includes("nat te veel"));
  assert.match(h.text, /Je bent nat|missed your bid/);
  assert.match(h.text, /geen punten|no points/);
});

test("nat door te weinig kaarten over, ook als de slag zelf al eens is uitgelegd", () => {
  const st = trickState({ bid: 3, tricks: 0, left: 2, winner: 2 });
  const h = help("slag naar hoogste", st, 0, describe, { wrongZero: true, seen: (k) => k === "slag uitkomer" });
  assert.deepEqual(h.keys, ["nat te weinig"]);
  assert.match(h.text, /nog maar 2 kaarten over|only 2 cards left/);
});

test("Boerenbridge: fout voorspeld geeft minder punten, niet geen", () => {
  const st = { ...trickState({ bid: 1, tricks: 0, left: 1, winner: 2 }), cards: 3 };
  const h = help("voorspellen", { ...st, players: st.players.map((p) => ({ ...p })), hand: [] }, 0, describe, { wrongZero: false });
  assert.match(h.text, /minder punten|fewer points/);
  assert.doesNotMatch(h.text, /geen punten|no points/);
});

test("niet nat: geen uitleg over nat", () => {
  const h = help("slag naar hoogste", trickState({ bid: 2, tricks: 0, left: 3, winner: 1 }), 0, describe, { wrongZero: true });
  assert.ok(!h.keys.some((k) => k.startsWith("nat")));
});

test("alleen nieuwe tips: een uitleg die je al kreeg, komt niet terug", () => {
  const st = trickState({ bid: 2, tricks: 0, left: 3, winner: 1 });
  assert.equal(help("slag naar hoogste", st, 0, describe, { seen: () => true }), null);
});

test("elke zin die Tineke hardop zegt, heeft een opname", () => {
  for (const line of spokenLines()) {
    assert.ok(existsSync(new URL(`../static/sounds/${speechFile(line)}.mp3`, import.meta.url)), `geen opname voor: ${line}`);
  }
});

test("elke uitgesproken reactie van een personage heeft een opname", async () => {
  const { existsSync } = await import("node:fs");
  const { REACTIONS } = await import("../static/characters.js");
  const { SPOKEN_REACTIONS, reactionFile } = await import("../static/speech.js");
  for (const kind of Object.keys(SPOKEN_REACTIONS)) {
    for (const [who, lines] of Object.entries(REACTIONS[kind])) {
      lines.forEach((_, k) => assert.ok(existsSync(new URL(`../static/sounds/${reactionFile(kind, who, k)}.mp3`, import.meta.url)), reactionFile(kind, who, k)));
    }
  }
});

test("spokenPhrase: alleen gemarkeerde snelle zinnen worden uitgesproken in plaats van in de chat gezet", async () => {
  const { PHRASES, sayWire, spokenPhrase } = await import("../static/speech.js");
  PHRASES.forEach((p, k) => assert.equal(spokenPhrase(sayWire(k)), k));
  assert.equal(spokenPhrase("Goed gespeeld!"), -1); // dezelfde tekst uit de chatknoppen blijft gewoon chat
  assert.equal(spokenPhrase("🗣️ iets anders"), -1);
  assert.equal(spokenPhrase(undefined), -1);
});
