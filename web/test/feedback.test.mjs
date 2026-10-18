// Tests voor feedback.js: meldingen controleren voordat ze verstuurd of getoond worden.
import { test } from "node:test";
import assert from "node:assert/strict";
import { REPORT_SHOT_MAX, REPORT_TEXT_MAX, cleanReport, isShot } from "../static/feedback.js";

const ok = { kind: "bug", text: "De tafel is plat", version: "2.58", device: "web · 1280x800", name: "Robbert" };

test("cleanReport accepteert een gewone melding", () => {
  assert.deepEqual(cleanReport(ok), { ...ok, shot: null });
  assert.equal(cleanReport({ ...ok, kind: "idee" }).kind, "idee");
});

test("cleanReport weigert een onbekende soort of te korte tekst", () => {
  assert.equal(cleanReport({ ...ok, kind: "spam" }), null);
  assert.equal(cleanReport({ ...ok, text: "  a " }), null);
  assert.equal(cleanReport(null), null);
  assert.equal(cleanReport("tekst"), null);
});

test("cleanReport kort in en haalt stuurtekens weg, maar houdt regeleinden", () => {
  const r = cleanReport({ ...ok, text: `regel 1\r\nregel\u0007 2${"x".repeat(3000)}`, name: "a\nb".padEnd(40, "c") });
  assert.equal(r.text.length, REPORT_TEXT_MAX);
  assert.ok(r.text.startsWith("regel 1\nregel  2"));
  assert.equal(r.name.length, 24);
  assert.ok(!r.name.includes("\n"));
});

test("isShot: alleen een JPEG als data-URL en niet te groot", () => {
  assert.equal(isShot("data:image/jpeg;base64,/9j/4AAQSkZJRg=="), true);
  assert.equal(isShot("data:image/svg+xml;base64,PHN2Zz4="), false);
  assert.equal(isShot('data:image/jpeg;base64,abc" onerror="alert(1)'), false);
  assert.equal(isShot("javascript:alert(1)"), false);
  assert.equal(isShot(`data:image/jpeg;base64,${"A".repeat(REPORT_SHOT_MAX)}`), false);
  assert.equal(cleanReport({ ...ok, shot: "javascript:alert(1)" }).shot, null);
});
