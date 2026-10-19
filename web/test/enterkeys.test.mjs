import test from "node:test";
import assert from "node:assert/strict";
import { parseEnterTargets, pickEnterTarget } from "../static/enterkeys.js";

test("parseEnterTargets leest selectors en click:", () => {
  assert.deepEqual(parseEnterTargets(" #a , click:#b,"), [
    { selector: "#a", click: false },
    { selector: "#b", click: true },
  ]);
  assert.deepEqual(parseEnterTargets(undefined), []);
  assert.deepEqual(parseEnterTargets(""), []);
});

test("pickEnterTarget kiest het eerste zichtbare doel", () => {
  const els = { "#a": { id: "a", shown: false }, "#b": { id: "b", shown: true } };
  const find = (s) => els[s] ?? null;
  const visible = (el) => el.shown;
  const targets = parseEnterTargets("#a, #missing, click:#b");
  assert.deepEqual(pickEnterTarget(targets, find, visible), { el: els["#b"], click: true });
  assert.equal(pickEnterTarget(parseEnterTargets("#a"), find, visible), null);
});
