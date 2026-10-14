// Vertalingen (i18n.js): elke tekst die je op het scherm ziet, moet ook in het Engels bestaan. Deze test zoekt
// alle t("…") in de code en alle vaste teksten in index.html, en kijkt of ze in i18n-en.js staan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../static/", import.meta.url);
const EN = (await import("../static/i18n-en.js")).default;
const has = (key) => Object.prototype.hasOwnProperty.call(EN, key);
const placeholders = (s) => [...new Set(String(s).match(/\{\w+\}/g) ?? [])].sort();

/**
 * Alle letterlijke teksten in het eerste argument van elke aanroep van t(…). Ook in een keuze als
 * t(n === 1 ? "1 slag" : "{n} slagen"). Een template met ${…} mag daar niet: gebruik {naam}.
 */
export function tKeys(code) {
  // Commentaar telt niet mee (hele regels met // en blokken met /* */)
  const src = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const keys = [];
  const errors = [];
  const re = /(?<![\w$.])t\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + 2;
    let depth = 0;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (src[j] !== c) j += src[j] === "\\" ? 2 : 1;
        keys.push(JSON.parse(c === '"' ? src.slice(i, j + 1) : `"${src.slice(i + 1, j).replace(/"/g, '\\"')}"`));
        i = j;
      } else if (c === "`") {
        let j = i + 1;
        while (src[j] !== "`") j += src[j] === "\\" ? 2 : 1;
        const body = src.slice(i + 1, j);
        if (body.includes("${")) errors.push(`template met \${} in t(): ${body.slice(0, 60)}`);
        else keys.push(body.replace(/\\(.)/g, "$1"));
        i = j;
      } else if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") {
        if (depth === 0) break;
        depth--;
      } else if (c === "," && depth === 0) break;
    }
  }
  return { keys, errors };
}

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const norm = (s) => s.replace(/\s+/g, " ").trim();

/** De vaste teksten van index.html, zoals translateDom (i18n.js) ze opzoekt. */
export function htmlKeys(html) {
  let body = html.slice(html.indexOf("<body"));
  body = body.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "");
  body = body.replace(/<(\w+)[^>]*\stranslate="no"[^>]*>[\s\S]*?<\/\1>/g, "");
  const keys = [];
  body = body.replace(/<(\w+)([^>]*\sdata-i18n-html[^>]*)>([\s\S]*?)<\/\1>/g, (all, tag, attrs, inner) => {
    keys.push(norm(inner));
    return `<${tag}${attrs}></${tag}>`;
  });
  for (const [, v] of body.matchAll(/\s(?:placeholder|aria-label|title|alt)="([^"]*)"/g)) keys.push(norm(decode(v)));
  for (const [, v] of body.matchAll(/>([^<]+)</g)) keys.push(norm(decode(v)));
  return keys.filter((k) => /\p{L}/u.test(k));
}

test("elke t(\"…\") in de code heeft een Engelse vertaling met dezelfde {variabelen}", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "i18n-en.js");
  const missing = [];
  for (const f of files) {
    const { keys, errors } = tKeys(readFileSync(new URL(f, dir), "utf8"));
    assert.deepEqual(errors, [], `${f}: ${errors.join("; ")}`);
    for (const k of keys) {
      if (!has(k)) missing.push(`${f}: ${k}`);
      else assert.deepEqual(placeholders(EN[k]), placeholders(k), `${f}: andere {variabelen} in de vertaling van "${k}"`);
    }
  }
  assert.deepEqual(missing, [], `zonder Engelse vertaling:\n${missing.join("\n")}`);
});

test("elke vaste tekst in index.html heeft een Engelse vertaling", () => {
  const keys = htmlKeys(readFileSync(new URL("index.html", dir), "utf8"));
  assert.ok(keys.length > 100, "teksten gevonden");
  const missing = [...new Set(keys.filter((k) => !has(k)))];
  assert.deepEqual(missing, [], `zonder Engelse vertaling:\n${missing.join("\n")}`);
  const desc = /<meta name="description" content="([^"]*)"/.exec(readFileSync(new URL("index.html", dir), "utf8"))[1];
  assert.ok(has(desc), "beschrijving van de pagina");
});

test("teksten die niet via t(\"…\") gaan: Tineke, snelle zinnen, soorten spel, berichten van de gastheer", async () => {
  const { shownLines } = await import("../static/tineke.js");
  const { PHRASES, QUICK, TIP_CHAT, WIRE_TEXTS } = await import("../static/speech.js");
  const { KINDS } = await import("../static/stats.js");
  const net = readFileSync(new URL("net.js", dir), "utf8");
  const hostTexts = [...net.matchAll(/t: "full", text: "([^"]*)"/g)].map((x) => x[1]);
  assert.ok(hostTexts.length >= 3);
  const all = [...shownLines(), ...PHRASES, ...QUICK, TIP_CHAT, ...WIRE_TEXTS, ...Object.values(KINDS), ...hostTexts];
  const missing = [...new Set(all.filter((k) => /\p{L}/u.test(k) && !has(k)))];
  assert.deepEqual(missing, [], `zonder Engelse vertaling:\n${missing.join("\n")}`);
});

test("reacties van de computerspelers en het nieuws bestaan in beide talen", async () => {
  const { REACTIONS, REACTIONS_EN } = await import("../static/characters.js");
  for (const [kind, byWho] of Object.entries(REACTIONS)) {
    for (const [who, lines] of Object.entries(byWho)) {
      assert.equal(REACTIONS_EN[kind]?.[who]?.length, lines.length, `${kind}/${who}`);
    }
  }
  const { CHANGES } = await import("../static/changelog.js");
  for (const c of CHANGES) assert.equal(c.en?.length, c.items.length, `nieuws van versie ${c.v}`);
});

test("t() vult variabelen in en geeft onbekende tekst ongewijzigd terug", async () => {
  const { t, engineText, variantText, detailText } = await import("../static/i18n.js");
  assert.equal(t("Ronde {n} van {m}", { n: 3, m: 19 }).replace(/\D+/g, " ").trim(), "3 19");
  assert.equal(t("iets dat niet vertaald is"), "iets dat niet vertaald is");
  // In node is de taal die van de omgeving; de vertaalhulpjes werken in beide talen zonder fout
  assert.ok(engineText("Henk legt klaver vrouw op.").includes("Henk"));
  assert.ok(variantText("Boerenbridge tot 7").startsWith("Boerenbridge"));
  assert.ok(detailText("tot 5 · 4 spelers: 1 mens, 3 sterke computers").includes("5"));
});

test("Engelse teksten van de spelmotor", async () => {
  // i18n.js leest de taal bij het laden; met een eigen kopie van de module in het Engels
  globalThis.localStorage = { getItem: () => JSON.stringify({ lang: "en" }) };
  try {
    const m = await import(`../static/i18n.js?en=${Date.now()}`);
    assert.equal(m.lang, "en");
    assert.equal(m.engineText("Henk legt klaver vrouw op."), "Henk plays the queen of clubs.");
    assert.equal(m.engineText("(2 te weinig)"), "(2 short)");
    assert.equal(m.engineText("Je moet kleur bekennen. Kies een harten."), "You must follow suit. Choose a card in hearts.");
    assert.equal(m.variantText("10 op en neer tot 5"), "10 op en neer to 5");
    assert.equal(m.variantText("Hybride (nr, iv) tot 5"), "Hybrid (nr, mt) to 5");
    assert.equal(m.detailText("tot 5 · 4 spelers: 1 mens, 3 gewone computers"), "up to 5 · 4 players: 1 human, 3 regular computers");
    assert.equal(m.cardName(412), "queen of hearts");
  } finally {
    delete globalThis.localStorage;
  }
});
