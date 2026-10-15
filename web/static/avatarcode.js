// Je eigen samengestelde poppetje als korte code ("x" + 11 tekens), zodat het net als de vaste gezichten mee
// kan naar medespelers en de Hall of Fame (die bewaart hoogstens 16 tekens). Los van de tekening (faces.js),
// zodat het zonder browser te testen is.

/** Per onderdeel de keuzes; de code bewaart per onderdeel het nummer van de keuze (0-9, a-z). */
export const FACE_PARTS = {
  skin: ["#FCE6D8", "#F6D7C3", "#EFC9AE", "#E0AC88", "#C68B65", "#A86F4C", "#8D5A3B", "#6B4128"],
  hair: ["short", "long", "ponytail", "bob", "bun", "curly", "afro", "spiky", "quiff", "wavy", "perm", "bald", "none"],
  hairColor: ["#1E1612", "#3A2A20", "#6B4426", "#8A5A2B", "#B5462A", "#D2552F", "#E3C16F", "#E8D9A8", "#BDBDBD", "#F0F0F0",
    "#B8ABD1", "#2F6FDB", "#E91E63"],
  eyes: ["#3B2416", "#6B4A2E", "#4F86C6", "#3F8A5A", "#5B7A8C", "#8E7CC3"],
  glasses: [null, "#2E2E2E", "#C2185B", "#B23A48", "#2F6FDB", "#C9A227"],
  beard: [null, "stubble", "moustache", "full"],
  hat: [null, "cap", "hat", "mitre"],
  shirt: ["#3F6FB5", "#E07A5F", "#2A9D8F", "#F4A261", "#6D4C41", "#8E7CC3", "#43A047", "#E53935", "#455A64", "#5C6BC0",
    "#26A69A", "#FFB300", "#EC8FB0", "#212121"],
  lips: [null, "#C9566A", "#C2185B", "#7A2E36", "#D84367"],
  nose: [null, "big"],
};
/** Losse extra's, als bits in het laatste teken van de code. */
export const FACE_EXTRAS = ["lashes", "freckles", "wrinkles", "earrings", "thickBrows"];

const ORDER = Object.keys(FACE_PARTS);
const CODE = /^x[0-9a-z]{11}$/;

/** Is dit een code van een samengesteld poppetje? Nodig om plaatjes van anderen veilig te controleren. */
export const isFaceCode = (v) => typeof v === "string" && CODE.test(v);

/**
 * Keuzes (nummers per onderdeel en een lijst extra's) naar een code. Nummers buiten de lijst worden 0,
 * zodat er nooit een ongeldige code ontstaat.
 */
export function encodeFace(choice) {
  const digit = (n, max) => (Number.isInteger(n) && n >= 0 && n < max ? n : 0).toString(36);
  const extras = FACE_EXTRAS.reduce((bits, name, i) => (choice?.extras?.includes(name) ? bits | (1 << i) : bits), 0);
  return `x${ORDER.map((part) => digit(choice?.[part], FACE_PARTS[part].length)).join("")}${extras.toString(36)}`;
}

/** Een code terug naar keuzes (nummers per onderdeel en de extra's), of null als het geen geldige code is. */
export function decodeChoice(code) {
  if (!isFaceCode(code)) return null;
  const choice = {};
  ORDER.forEach((part, i) => { choice[part] = parseInt(code[i + 1], 36) % FACE_PARTS[part].length; });
  const bits = parseInt(code[ORDER.length + 1], 36);
  choice.extras = FACE_EXTRAS.filter((_, i) => bits & (1 << i));
  return choice;
}

/**
 * Een code naar de beschrijving die de tekening (faces.js drawFace) gebruikt. Baard in de haarkleur, pet en
 * hoed in de kleur van het shirt, oorbellen goud.
 */
export function faceLook(code) {
  const c = decodeChoice(code);
  if (!c) return null;
  const look = {};
  for (const part of ORDER) {
    const v = FACE_PARTS[part][c[part]];
    if (v) look[part] = v;
  }
  if (look.beard) look.beardColor = look.hairColor;
  if (look.hat) look.hatColor = look.shirt;
  for (const extra of c.extras) look[extra] = extra === "earrings" ? "#FFD54F" : true;
  return look;
}

/**
 * Een willekeurig poppetje: nieuwe spelers krijgen er zo een, zodat niet iedereen er hetzelfde uitziet.
 * [random] is te vervangen voor de tests. Extra's met kleine kans, zodat de meeste gezichten rustig blijven.
 */
export function randomFace(random = Math.random) {
  const pick = (n) => Math.floor(random() * n);
  const choice = {};
  for (const part of ORDER) choice[part] = pick(FACE_PARTS[part].length);
  // Een bril, baard of opvallende haarkleur niet te vaak
  if (random() < 0.6) choice.glasses = 0;
  if (random() < 0.5) choice.beard = 0;
  if (random() < 0.75) choice.hat = 0;
  if (random() < 0.7) choice.hairColor = pick(10);
  choice.extras = FACE_EXTRAS.filter(() => random() < 0.25);
  return encodeFace(choice);
}

/** Afstand tussen twee kleuren (#RRGGBB), om een vast gezicht naar de dichtstbijzijnde keuzes om te zetten. */
function colorDistance(a, b) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return x.reduce((sum, v, i) => sum + (v - y[i]) ** 2, 0);
}

/**
 * Een vast gezicht (beschrijving zoals in faces.js) als code, met per onderdeel de dichtstbijzijnde keuze. Nodig
 * om een gekozen gezicht als begin te nemen als je je poppetje gaat aanpassen.
 */
export function codeFromLook(look) {
  const nearest = (part, value) => {
    const list = FACE_PARTS[part];
    if (!value) return Math.max(0, list.indexOf(null));
    if (typeof value === "string" && value.startsWith("#") && list.some((x) => x?.startsWith?.("#"))) {
      let best = -1;
      list.forEach((x, i) => { if (x && (best < 0 || colorDistance(x, value) < colorDistance(list[best], value))) best = i; });
      return best;
    }
    return Math.max(0, list.indexOf(value));
  };
  const choice = {};
  for (const part of ORDER) choice[part] = nearest(part, look?.[part]);
  // Kees' achterstevoren pet is een kapsel; als eigen poppetje een pet met kort haar
  if (look?.hair === "cap") { choice.hair = FACE_PARTS.hair.indexOf("short"); choice.hat = FACE_PARTS.hat.indexOf("cap"); }
  choice.extras = FACE_EXTRAS.filter((name) => look?.[name]);
  return encodeFace(choice);
}
