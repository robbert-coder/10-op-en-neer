// Tests voor de Engelse stemmen: dezelfde vorm als de Nederlandse, en bij elke zin een opname met een duur.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { BID_LINES, WET_LINES } from "../static/voices.js";
import { BID_LINES_EN, WET_LINES_EN, OPENERS_EN, RETURNERS_EN } from "../static/voices-en.js";
import { EN_MS } from "../static/voices-en-ms.js";
import { englishSpeechJobs, OPENERS, RETURNERS } from "../static/speech.js";
import { spokenLines, spokenPairs } from "../static/tineke.js";

test("Engelse voorspellingen en nat-zinnen hebben dezelfde vorm als de Nederlandse", () => {
  for (const [who, rows] of Object.entries(BID_LINES_EN)) {
    assert.equal(rows.length, BID_LINES[who].length, who);
    rows.forEach((row, n) => assert.equal(row.length, BID_LINES[who][n].length, `${who} ${n}`));
  }
  for (const [who, lines] of Object.entries(WET_LINES)) assert.equal(WET_LINES_EN[who]?.length, lines.length, who);
  assert.equal(OPENERS_EN.length, OPENERS.length);
  assert.equal(RETURNERS_EN.length, RETURNERS.length);
});

test("elke Nederlandse zin van Tineke heeft een Engelse", () => {
  const pairs = new Map(spokenPairs());
  for (const line of spokenLines()) assert.ok(pairs.get(line), line);
});

test("elke Engelse zin heeft een opname en een duur", () => {
  for (const job of englishSpeechJobs()) {
    assert.ok(existsSync(new URL(`../static/sounds/en/${job.file}.mp3`, import.meta.url)), job.file);
    assert.ok(EN_MS[job.file] > 0, job.file);
  }
});
