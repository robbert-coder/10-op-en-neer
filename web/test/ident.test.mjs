// Tests voor ondertekende berichten (ident.js): niemand kan zich voor een ander uitgeven of oude berichten herhalen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Verifier, loadIdentity } from "../static/ident.js";

/** Een nep-opslag in plaats van localStorage. */
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test("de sleutel wordt bewaard: na herladen dezelfde speler", async () => {
  const store = memory();
  const a = await loadIdentity(store);
  const b = await loadIdentity(store);
  assert.equal(a.id, b.id);
  assert.match(a.id, /^[A-Za-z0-9_-]{22}$/);
  assert.notEqual((await loadIdentity(memory())).id, a.id);
});

test("een ondertekend bericht komt aan met het nummer van de afzender", async () => {
  const me = await loadIdentity(memory());
  const v = new Verifier();
  const got = await v.open("t/h", await me.seal("t/h", { t: "chat", text: "hoi" }));
  assert.equal(got.from, me.id);
  assert.equal(got.msg.text, "hoi");
});

test("aangepaste, verkeerd gerichte of herhaalde berichten worden geweigerd", async () => {
  const me = await loadIdentity(memory());
  const v = new Verifier();
  const wire = await me.seal("t/h", { t: "act", value: 3 });
  // Inhoud veranderd: handtekening klopt niet meer
  assert.equal(await v.open("t/h", { ...wire, b: wire.b.replace('"value":3', '"value":4') }), null);
  // Voor een ander topic bedoeld
  assert.equal(await v.open("t/ander", wire), null);
  // Eerst goed, daarna dezelfde nog eens (herhaling)
  assert.ok(await v.open("t/h", wire));
  assert.equal(await v.open("t/h", wire), null);
  // Iemand anders zet zijn sleutel bij mijn handtekening
  const other = await loadIdentity(memory());
  const fake = await other.seal("t/h", { t: "act", value: 3 });
  assert.equal(await v.open("t/h", { ...fake, k: wire.k }), null);
  // Onzin
  assert.equal(await v.open("t/h", { b: 1 }), null);
  assert.equal(await v.open("t/h", null), null);
});
