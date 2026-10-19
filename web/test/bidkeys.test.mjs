// Tests voor bidkeys.js: voorspellen met de cijfertoetsen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bidFromKey, digitMayBid, keyDigit } from "../static/bidkeys.js";

test("één cijfer is meteen het bod als er niet meer dan 9 kaarten zijn", () => {
  assert.deepEqual(bidFromKey("", "3", 7), { bid: 3 });
  assert.deepEqual(bidFromKey("", "1", 9), { bid: 1 });
  assert.deepEqual(bidFromKey("", "0", 10), { bid: 0 });
});

test("met 10 kaarten wacht een 1 op een tweede cijfer", () => {
  assert.deepEqual(bidFromKey("", "1", 10), { pending: "1" });
  assert.deepEqual(bidFromKey("1", "0", 10), { bid: 10 });
  assert.deepEqual(bidFromKey("1", "5", 10), { bid: 1 }); // 15 kan niet: dan was het 1
  assert.deepEqual(bidFromKey("", "2", 10), { bid: 2 });
});

test("geen cijfer of te hoog: niets", () => {
  assert.equal(bidFromKey("", "a", 10), null);
  assert.equal(bidFromKey("", "Enter", 10), null);
  assert.equal(bidFromKey("", "8", 5), null);
});

test("keyDigit leest het teken of de toets", () => {
  assert.equal(keyDigit("7", "Digit7"), "7");
  assert.equal(keyDigit("&", "Digit1"), "1"); // AZERTY zonder Shift
  assert.equal(keyDigit("End", "Numpad1"), "1"); // Num Lock uit
  assert.equal(keyDigit("a", "KeyA"), "");
  assert.equal(keyDigit(undefined, undefined), "");
});

test("digitMayBid: geen vak, verborgen vak of leeg chatvak wel; vak met tekst niet", () => {
  assert.equal(digitMayBid(null), true);
  assert.equal(digitMayBid({ visible: false, chat: false, value: "abc" }), true);
  assert.equal(digitMayBid({ visible: true, chat: true, value: "" }), true);
  assert.equal(digitMayBid({ visible: true, chat: true, value: "hoi" }), false);
  assert.equal(digitMayBid({ visible: true, chat: false, value: "" }), false);
});
