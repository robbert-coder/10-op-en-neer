// Het eigen poppetje: de code moet veilig en kort blijven (Hall of Fame: hoogstens 16 tekens) en heen en terug kloppen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FACE_PARTS, codeFromLook, decodeChoice, encodeFace, faceLook, isFaceCode, randomFace } from "../static/avatarcode.js";
import { cleanAvatar } from "../static/validate.js";

test("code heen en terug geeft dezelfde keuzes", () => {
  const choice = { skin: 3, hair: 5, hairColor: 12, eyes: 2, glasses: 1, beard: 2, hat: 3, shirt: 13, lips: 4, nose: 1, extras: ["lashes", "thickBrows"] };
  const code = encodeFace(choice);
  assert.ok(isFaceCode(code) && code.length <= 16, code);
  assert.deepEqual(decodeChoice(code), choice);
});

test("willekeurige poppetjes zijn geldig en verschillen", () => {
  const codes = new Set(Array.from({ length: 50 }, () => randomFace()));
  for (const c of codes) assert.ok(cleanAvatar(c) === c, c);
  assert.ok(codes.size > 40);
});

test("vreemde codes worden geweigerd of veilig", () => {
  for (const bad of ["x<script>", "X1234567890a", "x123", "x" + "z".repeat(20), null, 5]) {
    assert.equal(isFaceCode(bad), false, String(bad));
    assert.equal(cleanAvatar(bad), null);
  }
  // Te grote nummers vallen terug op een bestaande keuze
  const look = faceLook("xzzzzzzzzzzz");
  assert.ok(FACE_PARTS.skin.includes(look.skin) && FACE_PARTS.hair.includes(look.hair));
  assert.equal(encodeFace({ skin: 99, extras: "nee" }), encodeFace({}));
});

test("een gekozen vast gezicht wordt een poppetje dat erop lijkt", () => {
  const code = codeFromLook({ skin: "#8D5A3B", hair: "short", hairColor: "#1E1612", glasses: "#2E2E2E", beard: "full", shirt: "#2A9D8F", lashes: true });
  const look = faceLook(code);
  assert.equal(look.skin, "#8D5A3B");
  assert.equal(look.glasses, "#2E2E2E");
  assert.equal(look.beard, "full");
  assert.equal(look.lashes, true);
  assert.equal(faceLook(codeFromLook({ skin: "#F2CDB3", hair: "cap" })).hat, "cap");
});
