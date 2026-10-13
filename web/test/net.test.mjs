// Tests voor de gastheer (net.js): wie mag wat aan tafel. Zonder echte server: berichten gaan via een nep-verbinding.
import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.window = {}; // geen MQTT in node: de verbindingen melden "werkt niet" en doen verder niets
const { Host } = await import("../static/net.js");

/** Een gastheer met een nep-server die alle verstuurde berichten per gast bewaart. */
function table(seats = 4) {
  const sent = [];
  const events = { actions: [] };
  const host = new Host("ABCDE", "Gastheer", { onAction: (a) => events.actions.push(a) }, null, null, seats);
  const relay = { publish: (t, m) => { sent.push({ to: t.split("/").pop(), m }); return true; } };
  const from = (id, m) => host.incoming(m, relay, id);
  const last = (id, type) => sent.filter((x) => x.to === id && x.m.t === type).pop()?.m;
  return { host, from, last, sent, events };
}

test("aanschuiven: elke gast krijgt een eigen stoel, en de naam wordt gecontroleerd", () => {
  const { host, from, last } = table();
  from("gastA", { t: "hello", name: "Anna\u0000<b>", avatar: "javascript:x" });
  from("gastB", { t: "hello", name: "Bert" });
  assert.equal(last("gastA", "welcome").seat, 3);
  assert.equal(last("gastB", "welcome").seat, 2);
  const anna = host.players.find((p) => p.id === "gastA");
  assert.equal(anna.name, "Anna <b>"); // geen stuurtekens; esc() maakt <b> onschadelijk bij het tonen
  assert.equal(anna.avatar, null);
  host.close();
});

test("een gast kan alleen voor zijn eigen stoel spelen; anders krijgt hij de stand opnieuw", () => {
  const { host, from, last, events } = table();
  from("gastA", { t: "hello", name: "Anna" });
  host.start({ seed: 1, rules: {} });
  from("gastA", { t: "act", index: 0, seat: 1, value: 5 }); // stoel van de gastheer
  assert.equal(host.log.length, 0);
  assert.ok(last("gastA", "start"));
  from("gastA", { t: "act", index: 0, seat: 3, value: 5 });
  assert.deepEqual(host.log, [{ seat: 3, value: 5 }]);
  assert.equal(events.actions.length, 1);
  from("gastA", { t: "act", index: 7, seat: 3, value: 2 }); // loopt niet gelijk
  assert.equal(host.log.length, 1);
  from("gastA", { t: "act", index: 1, seat: 3, value: 414 }); // kaartcode (schoppen aas) gaat ongewijzigd door
  assert.deepEqual(host.log.at(-1), { seat: 3, value: 414 });
  from("gastA", { t: "act", index: 2, seat: 3, value: 9999 }); // onzin
  assert.equal(host.log.length, 2);
  host.close();
});

test("chat: hooguit 5 berichten per 10 seconden per persoon", () => {
  const { host, from } = table();
  from("gastA", { t: "hello", name: "Anna" });
  for (let i = 0; i < 20; i++) from("gastA", { t: "chat", text: `spam ${i}` });
  assert.equal(host.chat.length, 5);
  from("gastA", { t: "chat", text: "x".repeat(1000) });
  host.close();
});

test("een computer neemt het pas over als iedereen akkoord is", () => {
  const { host, from } = table();
  from("gastA", { t: "hello", name: "Anna" });
  from("gastB", { t: "hello", name: "Bert" });
  host.start({ seed: 1, rules: {} });
  const bert = host.players.find((p) => p.id === "gastB");
  from("gastA", { t: "vote", seat: bert.seat, yes: true });
  assert.equal(bert.left, undefined);
  host.vote(bert.seat, true);
  assert.equal(bert.left, true);
  // Overname staat als -stoel in het logboek, zodat iedereen het op hetzelfde moment doet
  assert.deepEqual(host.log.at(-1), { seat: bert.seat, value: -bert.seat });
  host.close();
});

test("hooguit 50 verschillende afzenders tegelijk (geen eindeloze rij nep-gasten)", () => {
  const { host, from } = table();
  for (let i = 0; i < 80; i++) from(`nep${i}`, { t: "ping" });
  assert.equal(host.links.size, 50);
  host.close();
});
