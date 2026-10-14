// Het spel moet ook zonder internet werken: elk script in static/ moet in de lijst van de service worker staan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("service worker bewaart alle scripts", () => {
  const sw = readFileSync(new URL("../static/sw.js", import.meta.url), "utf8");
  const scripts = readdirSync(new URL("../static/", import.meta.url)).filter((f) => f.endsWith(".js") && f !== "sw.js");
  for (const f of scripts) assert.ok(sw.includes(`"${f}"`), `${f} ontbreekt in sw.js`);
});
