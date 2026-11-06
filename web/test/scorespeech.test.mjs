// De uitslag van je ronde hardop: welke opnames bij welke uitslag, en dat er voor elke taal een zin is.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GOOD_POINTS, WRONG_POINTS, roundResultFiles, scoreSpeechJobs } from "../static/scorespeech.js";
import { recordingJobs } from "../static/speech.js";

test("goed voorspeld: één zin met de punten", () => {
  assert.deepEqual(roundResultFiles(2, 2, 12, true), ["uitslag_goed_12"]);
  assert.deepEqual(roundResultFiles(13, 13, 49, true), ["uitslag_goed_49"]);
});

test("fout voorspeld: voorspeld, gehaald en de punten", () => {
  assert.deepEqual(roundResultFiles(2, 3, 0, false), ["uitslag_bod_2", "uitslag_slagen_3", "uitslag_geen"]);
  assert.deepEqual(roundResultFiles(4, 3, 7, false), ["uitslag_bod_4", "uitslag_slagen_3", "uitslag_erbij_7"]);
});

test("onbekende of rare waarden: niets zeggen in plaats van een verkeerde zin", () => {
  assert.deepEqual(roundResultFiles(2, 2, 99, true), []);
  assert.deepEqual(roundResultFiles(-1, 0, 0, false), []);
  assert.deepEqual(roundResultFiles(2, 14, 0, false), []);
  assert.deepEqual(roundResultFiles(undefined, 1, 0, false), []);
  assert.deepEqual(roundResultFiles(2, 5, 2, false), []);
});

test("elke mogelijke score van 10 op en neer en Boerenbridge heeft een zin", () => {
  for (const perTrick of [1, 3]) for (let bid = 0; bid <= 13; bid++) assert.ok(GOOD_POINTS.includes(10 + perTrick * bid));
  for (let diff = 1; diff <= 13; diff++) {
    const s = Math.max(0, 10 - 3 * diff);
    assert.ok(s === 0 || WRONG_POINTS.includes(s), `${s}`);
  }
});

test("elke opname die de uitslag kan gebruiken, wordt in elke taal ingesproken", () => {
  for (const language of ["nl", "en", "de"]) {
    const files = new Set(scoreSpeechJobs(language).map((j) => j.file));
    for (const x of GOOD_POINTS) assert.ok(files.has(`uitslag_goed_${x}`));
    for (let n = 0; n <= 13; n++) assert.ok(files.has(`uitslag_bod_${n}`) && files.has(`uitslag_slagen_${n}`));
  }
  const jobs = recordingJobs("uitslag");
  assert.equal(new Set(jobs.map((j) => j.file)).size, jobs.length, "unieke paden");
  assert.ok(jobs.some((j) => j.file.startsWith("de/")) && jobs.some((j) => j.file.startsWith("en/")));
});
