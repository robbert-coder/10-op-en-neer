// De uitslag van een ronde komt pas als de spelers uitgepraat zijn, maar nooit eindeloos laat.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resultWait, RESULT_MIN_WAIT_MS, RESULT_MAX_WAIT_MS, toastMs, TOAST_MIN_MS, TOAST_MAX_MS } from "../static/pacing.js";

test("eerst even wachten, zodat een stem na het landen van de kaart meetelt", () => {
  assert.equal(resultWait(0, false), RESULT_MIN_WAIT_MS);
  assert.equal(resultWait(100, false), RESULT_MIN_WAIT_MS - 100);
});

test("wachten zolang er een stem klinkt, daarna meteen tonen", () => {
  assert.ok(resultWait(RESULT_MIN_WAIT_MS + 500, true) > 0);
  assert.equal(resultWait(RESULT_MIN_WAIT_MS + 500, false), 0);
});

test("nooit langer dan het maximum, ook bij rare invoer", () => {
  assert.equal(resultWait(RESULT_MAX_WAIT_MS, true), 0);
  assert.equal(resultWait(NaN, true), 0);
  assert.equal(resultWait(-50, false), RESULT_MIN_WAIT_MS);
});

test("iedereen nat: alleen als alle spelers voorspeld en gemist hebben", async () => {
  const { everyoneMissed } = await import("../static/characters.js");
  assert.equal(everyoneMissed([{ bid: 1, tricks: 0 }, { bid: 0, tricks: 1 }]), true);
  assert.equal(everyoneMissed([{ bid: 1, tricks: 1 }, { bid: 0, tricks: 1 }]), false);
  assert.equal(everyoneMissed([{ bid: -1, tricks: 0 }, { bid: 0, tricks: 1 }]), false);
  assert.equal(everyoneMissed([{ bid: 1, tricks: 0 }]), false);
  assert.equal(everyoneMissed(null), false);
});

test("mopperen gaat om de beurt", async () => {
  const { nextSpeaker } = await import("../static/characters.js");
  assert.equal(nextSpeaker([2, 3, 4], 0), 2);
  assert.equal(nextSpeaker([2, 3, 4], 2), 3);
  assert.equal(nextSpeaker([2, 3, 4], 4), 2);
  assert.equal(nextSpeaker([], 2), 0);
});

test("toastMs: kort bericht minstens de minimumtijd, lang bericht langer maar begrensd", () => {
  assert.equal(toastMs("Je bent nog niet aan de beurt."), TOAST_MIN_MS);
  const long = toastMs("Je reageerde niet en de anderen waren akkoord: een computer speelt nu verder voor je. Je kunt blijven kijken en chatten.");
  assert.ok(long > TOAST_MIN_MS && long <= TOAST_MAX_MS);
  assert.equal(toastMs("x".repeat(1000)), TOAST_MAX_MS);
  assert.equal(toastMs(undefined), TOAST_MIN_MS);
});

import { worriesAloud, WORRY_MIN_CARDS, WORRY_CHANCE } from "../static/pacing.js";

test("niets meer mogen halen: alleen hardop met genoeg kaarten over, en dan nog af en toe", () => {
  assert.equal(worriesAloud(WORRY_MIN_CARDS - 1, 0), false);
  assert.equal(worriesAloud(1, 0), false);
  assert.equal(worriesAloud(WORRY_MIN_CARDS, 0), true);
  assert.equal(worriesAloud(WORRY_MIN_CARDS + 4, WORRY_CHANCE - 0.01), true);
  assert.equal(worriesAloud(WORRY_MIN_CARDS + 4, WORRY_CHANCE), false);
});
