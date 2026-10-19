// Tests voor bidkeys.js: voorspellen met de cijfertoetsen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bidFromKey } from "../static/bidkeys.js";

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
