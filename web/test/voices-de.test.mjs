// Tests voor de Duitse zinnen: dezelfde vorm als de Nederlandse, zodat dezelfde loting en opnamenamen werken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BID_LINES, WET_LINES } from "../static/voices.js";
import { BID_LINES_DE, WET_LINES_DE, OPENERS_DE, RETURNERS_DE } from "../static/voices-de.js";
import { OPENERS, RETURNERS, translatedSpeechJobs, englishSpeechJobs } from "../static/speech.js";
import { spokenLines, spokenPairs } from "../static/tineke.js";

test("Duitse voorspellingen en nat-zinnen hebben dezelfde vorm als de Nederlandse", () => {
  // Zelfde personages als in het Engels; "speler" (oude, algemene stem) bestaat alleen in het Nederlands
  for (const [who, rows] of Object.entries(BID_LINES).filter(([who]) => who !== "speler")) {
    assert.equal(BID_LINES_DE[who]?.length, rows.length, who);
    rows.forEach((row, n) => assert.equal(BID_LINES_DE[who][n].length, row.length, `${who} ${n}`));
  }
  for (const [who, lines] of Object.entries(WET_LINES)) assert.equal(WET_LINES_DE[who]?.length, lines.length, who);
  assert.equal(OPENERS_DE.length, OPENERS.length);
  assert.equal(RETURNERS_DE.length, RETURNERS.length);
});

test("elke Nederlandse zin van Tineke heeft een Duitse", () => {
  const pairs = new Map(spokenPairs("de"));
  for (const line of spokenLines()) assert.ok(pairs.get(line), line);
});

test("de Duitse opnamelijst heeft (bijna) evenveel zinnen als de Engelse, met unieke namen", () => {
  const de = translatedSpeechJobs("de");
  // Tineke kan in een taal een zin meer of minder hebben: twee Nederlandse zinnen kunnen één vertaling delen
  assert.ok(Math.abs(de.length - englishSpeechJobs().length) <= 5, `${de.length}`);
  assert.equal(new Set(de.map((j) => j.file)).size, de.length);
  assert.ok(de.every((j) => j.text && !j.text.includes("{")), "alle teksten ingevuld");
});
