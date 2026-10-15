// De uitslag van een ronde komt pas als de spelers uitgepraat zijn, maar nooit eindeloos laat.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resultWait, RESULT_MIN_WAIT_MS, RESULT_MAX_WAIT_MS } from "../static/pacing.js";

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
