// De felicitatie van de winnaar hardop: welke opname bij welke winnaar, en dat die in elke taal bestaat.
import { test } from "node:test";
import assert from "node:assert/strict";
import { recordingJobs } from "../static/speech.js";

test("de winnaar feliciteren: personage bij naam, jij, een andere mens of een gedeelde eerste plaats", async () => {
  const { winnerFile, winnerSpeechJobs } = await import("../static/winnerspeech.js");
  const { CHARACTERS, CHARACTER_IDS } = await import("../static/characters.js");
  assert.equal(winnerFile([{ me: false, character: "henk" }], CHARACTER_IDS), "winnaar_henk");
  assert.equal(winnerFile([{ me: true, character: null }], CHARACTER_IDS), "winnaar_jij");
  assert.equal(winnerFile([{ me: false, character: null }], CHARACTER_IDS), "winnaar_ander");
  assert.equal(winnerFile([{ me: true, character: null }, { me: false, character: "mo" }], CHARACTER_IDS), "winnaar_samen");
  assert.equal(winnerFile([], CHARACTER_IDS), null);
  for (const language of ["nl", "en", "de"]) {
    const files = new Set(winnerSpeechJobs(language, CHARACTERS).map((j) => j.file));
    for (const id of CHARACTER_IDS) assert.ok(files.has(`winnaar_${id}`), `${language} ${id}`);
    for (const f of ["winnaar_jij", "winnaar_ander", "winnaar_samen"]) assert.ok(files.has(f));
  }
});

test("reacties in delen inspreken", async () => {
  const all = recordingJobs("reacties");
  const part = recordingJobs("reacties:slag,oei");
  assert.ok(part.length > 0 && part.length < all.length);
  assert.ok(part.every((j) => /reactie_(slag|oei)_/.test(j.file)));
  assert.ok(["nl", "en", "de"].every((l) => part.some((j) => j.language === l)));
});

test("de felicitaties worden in elke taal ingesproken, met unieke paden", () => {
  const jobs = recordingJobs("winnaar");
  assert.equal(new Set(jobs.map((j) => j.file)).size, jobs.length);
  assert.ok(["nl", "en", "de"].every((l) => jobs.some((j) => j.language === l)));
});
