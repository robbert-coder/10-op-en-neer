// Getekende gezichten: de computerspelers, Tineke en de gezichten die je zelf als plaatje kunt kiezen.
// Elk gezicht kan praten (bij het voorspellen), blij kijken (goed voorspeld) en zielig kijken (nat);
// dat regelt style.css met classes op de onderdelen (.mouth, .brow, .eyes, .tear, .head).

let uid = 0;

/** Kleur een tint lichter (f > 0) of donkerder (f < 0). */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(Math.max(0, Math.min(255, f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("")}`;
}

// Kapsels: achter het hoofd (back) en ervoor (front). h = haarkleur, d = donkerder, l = lichter.
const HAIR = {
  none: () => ["", ""],
  // Kaal met grijze plukken boven de oren
  bald: (h, d, l) => ["", `
    <path d="M21 58 C19 46 22 38 28 34 C27 42 28 48 30 52 C25 53 23 57 24 62 Z" fill="${h}"/>
    <path d="M79 58 C81 46 78 38 72 34 C73 42 72 48 70 52 C75 53 77 57 76 62 Z" fill="${h}"/>
    <ellipse cx="40" cy="27" rx="9" ry="4" fill="#FFFFFF" opacity=".28" transform="rotate(-18 40 27)"/>`],
  // Vol grijs haar met een scheiding, netjes opzij gekamd (Henk)
  wavy: (h, d, l) => ["", `
    <path d="M21 56 C17 30 30 14 50 14 C70 14 84 28 79 56 C77 45 74 38 69 33 C62 31 54 28 47 23 C43 30 37 33 30 35 C25 40 22 47 21 56 Z" fill="${h}"/>
    <path d="M47 23 C58 22 66 26 72 33" fill="none" stroke="${l}" stroke-width="2.2" opacity=".55" stroke-linecap="round"/>
    <path d="M47 23 C44 19 39 17 33 19" fill="none" stroke="${d}" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>`],
  // Kuif: het haar voorop omhoog gekamd
  quiff: (h, d, l) => ["", `
    <path d="M22 52 C19 32 26 22 35 18 C39 7 57 3 69 10 C79 15 82 27 78 52 C76 42 72 35 66 31 C58 34 44 34 34 31 C28 36 24 43 22 52 Z" fill="${h}"/>
    <path d="M39 14 C49 7 62 8 71 15" fill="none" stroke="${l}" stroke-width="2" opacity=".5" stroke-linecap="round"/>`],
  short: (h, d, l) => ["", `
    <path d="M22 50 C20 26 34 15 51 15 C68 15 81 26 78 50 C76 40 72 33 66 30 C58 34 44 35 33 31 C28 36 24 42 22 50 Z" fill="${h}"/>
    <path d="M34 22 C44 18 58 18 68 23" fill="none" stroke="${l}" stroke-width="2" opacity=".5" stroke-linecap="round"/>`],
  spiky: (h, d, l) => ["", `
    <path d="M22 50 C20 34 24 24 30 20 L28 10 L38 17 L42 6 L49 15 L56 5 L60 16 L69 8 L69 19 L78 16 C80 26 80 38 78 50
      C75 40 70 34 64 31 C56 34 44 34 34 31 C28 36 24 42 22 50 Z" fill="${h}"/>`],
  // Lang los haar langs het gezicht
  long: (h, d, l) => [`
    <path d="M18 50 C14 22 34 10 50 10 C66 10 86 22 82 50 L86 92 C76 98 66 96 64 88 L36 88 C34 96 24 98 14 92 Z" fill="${d}"/>`, `
    <path d="M22 52 C20 26 34 15 50 15 C66 15 82 26 78 52 C74 38 66 30 56 27 C50 34 38 38 28 40 C25 44 23 48 22 52 Z" fill="${h}"/>
    <path d="M56 27 C64 33 72 40 76 50" fill="none" stroke="${l}" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`],
  // Paardenstaart
  ponytail: (h, d, l) => [`
    <path d="M74 30 C92 34 94 58 86 74 C84 62 82 52 74 44 Z" fill="${d}"/>`, `
    <path d="M22 50 C20 26 34 15 51 15 C68 15 81 26 78 48 C74 36 66 29 56 27 C48 30 36 32 27 38 C24 42 23 46 22 50 Z" fill="${h}"/>
    <path d="M36 21 C44 18 54 18 62 21" fill="none" stroke="${l}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`],
  // Bobkapsel met pony (Tineke)
  bob: (h, d, l) => [`
    <path d="M16 58 C12 26 30 11 50 11 C70 11 88 26 84 58 L84 78 C78 82 72 82 70 78 L70 58 L30 58 L30 78 C28 82 22 82 16 78 Z" fill="${d}"/>`, `
    <path d="M21 46 C21 23 38 15 51 15 C66 15 80 24 79 46 C71 38 61 34 50 36 C40 37 30 40 21 46 Z" fill="${h}"/>
    <path d="M30 26 C38 21 50 20 62 23" fill="none" stroke="${l}" stroke-width="2" opacity=".5" stroke-linecap="round"/>`],
  // Knotje bovenop
  bun: (h, d, l) => [`<circle cx="50" cy="11" r="9" fill="${d}"/>`, `
    <path d="M22 50 C20 26 34 16 51 16 C68 16 81 26 78 50 C76 38 70 31 62 28 C54 31 44 31 36 29 C29 34 24 41 22 50 Z" fill="${h}"/>
    <path d="M30 34 C36 26 44 22 50 22 M70 34 C64 26 56 22 50 22" fill="none" stroke="${l}" stroke-width="1.5" opacity=".5"/>`],
  // Een bos krullen
  curly: (h, d, l) => [`
    <g fill="${d}">
      <circle cx="28" cy="22" r="13"/><circle cx="45" cy="13" r="13"/><circle cx="62" cy="13" r="13"/><circle cx="76" cy="23" r="13"/>
      <circle cx="17" cy="36" r="12"/><circle cx="85" cy="37" r="12"/><circle cx="13" cy="52" r="11"/><circle cx="88" cy="53" r="11"/>
      <circle cx="14" cy="68" r="10"/><circle cx="87" cy="69" r="10"/><circle cx="18" cy="82" r="8"/><circle cx="83" cy="83" r="8"/>
    </g>`, `
    <g fill="${h}">
      <circle cx="30" cy="28" r="8"/><circle cx="41" cy="22" r="8"/><circle cx="53" cy="21" r="8"/><circle cx="64" cy="23" r="8"/>
      <circle cx="73" cy="30" r="7"/><circle cx="24" cy="38" r="6"/><circle cx="77" cy="40" r="6"/>
    </g>
    <g fill="${l}" opacity=".45"><circle cx="38" cy="19" r="2.5"/><circle cx="58" cy="18" r="2.5"/><circle cx="70" cy="25" r="2"/></g>`],
  // Afro
  afro: (h, d, l) => [`<ellipse cx="50" cy="38" rx="42" ry="34" fill="${d}"/>`, `
    <path d="M21 50 C18 30 32 20 50 20 C68 20 82 30 79 50 C74 40 66 34 50 34 C36 34 26 40 21 50 Z" fill="${h}"/>`],
  // Permanent: kleine krulletjes rond het hoofd (Ria)
  perm: (h, d, l) => [`<circle cx="50" cy="12" r="8" fill="${d}"/>`, `
    <g fill="${h}">
      <circle cx="26" cy="34" r="9"/><circle cx="36" cy="25" r="9"/><circle cx="50" cy="22" r="10"/>
      <circle cx="64" cy="25" r="9"/><circle cx="74" cy="34" r="9"/><circle cx="21" cy="45" r="7"/><circle cx="79" cy="45" r="7"/>
    </g>
    <g fill="${d}" opacity=".6"><circle cx="40" cy="28" r="3"/><circle cx="58" cy="26" r="3"/><circle cx="72" cy="37" r="3"/><circle cx="27" cy="38" r="3"/></g>`],
  // Pet achterstevoren met een pluk haar door het gat (Kees)
  cap: (h, d, l, cap = "#2F6FDB") => ["", `
    <path d="M45 20 C41 10 49 8 51 14 C53 6 61 8 57 20 Z" fill="${h}"/>
    <path d="M20 42 C20 17 80 17 80 42 Z" fill="${cap}"/>
    <path d="M30 27 C36 23 44 22 50 22" fill="none" stroke="${shade(cap, 0.3)}" stroke-width="3" stroke-linecap="round"/>
    <rect x="15" y="38" width="70" height="7" rx="3.5" fill="${shade(cap, -0.2)}"/>
    <path d="M70 42 L94 48 C95 51 92 53 89 52 L68 46 Z" fill="${shade(cap, -0.2)}"/>
    <circle cx="50" cy="21" r="3" fill="#FFD54F"/>`],
};

/**
 * Een gezicht uit een beschrijving.
 * p: {skin, hair, hairColor, eyes, brows, lips, lashes, glasses, beard, wrinkles, freckles, earrings, shirt, cap, nose}
 */
function drawFace(p) {
  const id = `f${uid++}`;
  const skin = p.skin;
  const dark = shade(skin, -0.1);
  const darker = shade(skin, -0.24);
  const hair = p.hairColor ?? "#5A3B24";
  // Haar met een verloop: licht waar het licht erop valt, donker naar de randen
  const [back, front] = (HAIR[p.hair] ?? HAIR.short)(`url(#${id}h)`, shade(hair, -0.28), shade(hair, 0.35), p.cap);
  const lips = p.lips ?? shade(skin, -0.38);
  const brow = p.brows ?? shade(hair, -0.1);
  const iris = p.eyes ?? "#6B4A2E";
  const lash = p.lashes ? `<path d="M30 49 C33 46 39 45 44 48 M30 49 L28 47 M56 48 C61 45 67 46 70 49 M70 49 L72 47" fill="none" stroke="#2A1E18" stroke-width="1.4" stroke-linecap="round"/>` : "";
  const eye = (cx) => `
      <ellipse cx="${cx}" cy="50" rx="9" ry="5.5" fill="${darker}" opacity=".18"/>
      <path d="M${cx - 7} 52 C${cx - 4} 47.5 ${cx + 4} 47.5 ${cx + 7} 52 C${cx + 4} 55.5 ${cx - 4} 55.5 ${cx - 7} 52 Z" fill="#F7F4EF"/>
      <circle cx="${cx}" cy="52" r="3.4" fill="url(#${id}i)" stroke="${shade(iris, -0.45)}" stroke-width=".5"/>
      <circle cx="${cx}" cy="52" r="1.5" fill="#120C09"/>
      <circle cx="${cx - 1.1}" cy="50.8" r="1" fill="#FFFFFF"/><circle cx="${cx + 1.3}" cy="53.2" r=".45" fill="#FFFFFF" opacity=".8"/>
      <path d="M${cx - 7} 52 C${cx - 4} 47.5 ${cx + 4} 47.5 ${cx + 7} 52 L${cx + 7} 50 L${cx - 7} 50 Z" fill="${darker}" opacity=".12"/>
      <path d="M${cx - 7.2} 51.6 C${cx - 4} 47 ${cx + 4} 47 ${cx + 7.2} 51.6" fill="none" stroke="#3A2A22" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M${cx - 6} 48.3 C${cx - 3} 45.6 ${cx + 3} 45.6 ${cx + 6} 48.3" fill="none" stroke="${darker}" stroke-width=".7" opacity=".6" stroke-linecap="round"/>
      <path d="M${cx - 5.5} 54.4 C${cx - 2} 56 ${cx + 2} 56 ${cx + 5.5} 54.4" fill="none" stroke="${darker}" stroke-width=".6" opacity=".45" stroke-linecap="round"/>`;
  const glasses = p.glasses ? `
    <g class="glasses" fill="#FFFFFF" fill-opacity=".12" stroke="${p.glasses}" stroke-width="2">
      <rect x="28" y="45" width="19" height="14" rx="6"/><rect x="53" y="45" width="19" height="14" rx="6"/>
      <path d="M47 50 C49 48.5 51 48.5 53 50" fill="none"/><path d="M28 50 L21 48 M72 50 L79 48" fill="none"/>
    </g>` : "";
  const beard = p.beard === "full" ? `
    <path d="M23 60 C24 82 38 94 50 94 C62 94 76 82 77 60 C72 72 66 76 60 74 C56 72 44 72 40 74 C34 76 28 72 23 60 Z" fill="${p.beardColor ?? hair}"/>
    <path d="M38 70 C44 66 56 66 62 70 C58 69 54 70 50 71 C46 70 42 69 38 70 Z" fill="${shade(p.beardColor ?? hair, -0.15)}"/>`
    : p.beard === "moustache" ? `
    <path class="moustache" d="M33 71 C37 65 45 65 50 69 C55 65 63 65 67 71 C68 74 64 75 62 73 C58 70 54 71 50 72 C46 71 42 70 38 73 C36 75 32 74 33 71 Z" fill="${p.beardColor ?? hair}"/>`
    : p.beard === "stubble" ? `
    <path d="M26 64 C28 80 40 90 50 90 C60 90 72 80 74 64 C70 74 62 80 50 80 C38 80 30 74 26 64 Z" fill="${p.beardColor ?? hair}" opacity=".22"/>
    <path d="M38 71 C44 68 56 68 62 71" fill="none" stroke="${p.beardColor ?? hair}" stroke-width="3" opacity=".25" stroke-linecap="round"/>` : "";
  const wrinkles = p.wrinkles ? `
    <g fill="none" stroke="${darker}" stroke-width=".9" stroke-linecap="round" opacity=".55">
      <path d="M36 33 C44 31 56 31 64 33"/><path d="M38 37 C45 35.5 55 35.5 62 37"/>
      <path d="M23 52 C24 55 26 56 27 56 M77 52 C76 55 74 56 73 56"/>
      <path d="M36 64 C34 69 35 72 38 75 M64 64 C66 69 65 72 62 75"/>
    </g>` : "";
  const freckles = p.freckles ? `<g fill="${darker}" opacity=".45">
      <circle cx="33" cy="61" r=".9"/><circle cx="36" cy="63" r=".9"/><circle cx="39" cy="60.5" r=".9"/><circle cx="35" cy="59" r=".8"/>
      <circle cx="61" cy="60.5" r=".9"/><circle cx="64" cy="63" r=".9"/><circle cx="67" cy="61" r=".9"/><circle cx="65" cy="59" r=".8"/></g>` : "";
  const earrings = p.earrings ? `<g fill="${p.earrings}" stroke="${shade(p.earrings, -0.3)}" stroke-width=".6">
      <circle cx="19" cy="69" r="2.6"/><circle cx="81" cy="69" r="2.6"/></g>` : "";
  const nose = p.nose === "big"
    ? `<path d="M49 55 C45 62 41 66 44 69 C47 71 53 71 56 69 C59 66 55 62 51 55" fill="${dark}" opacity=".55"/>
       <ellipse cx="50" cy="66" rx="7.5" ry="5.5" fill="${shade(skin, 0.05)}"/><ellipse cx="47.5" cy="64" rx="2.2" ry="1.3" fill="#FFFFFF" opacity=".5"/>
       <path d="M44 68 C45.5 69.5 47 69.5 47.5 68.5 M56 68 C54.5 69.5 53 69.5 52.5 68.5" fill="none" stroke="${darker}" stroke-width="1" stroke-linecap="round"/>`
    : `<path d="M51.5 52 C53 58 55.5 62 54.5 66 C53.5 64 52 63 51 62 Z" fill="${darker}" opacity=".18"/>
       <path d="M50 54 C48.5 59 46.5 63 46.5 65 C46.5 67 48 67.5 50 67.5 C52 67.5 53.5 67 53.5 65" fill="none" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
       <path d="M45.5 66.5 C46.5 67.5 47.5 67.5 48 67 M54.5 66.5 C53.5 67.5 52.5 67.5 52 67" fill="none" stroke="${darker}" stroke-width="1" stroke-linecap="round"/>
       <ellipse cx="50" cy="61" rx="1.5" ry="3" fill="#FFFFFF" opacity=".18"/>`;
  const teeth = `<path class="teeth" d="M41 76.5 C46 78.5 54 78.5 59 76.5 L58 79.5 C54 80.5 46 80.5 42 79.5 Z" fill="#FFFFFF"/>`;
  return `
<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <radialGradient id="${id}s" cx="45%" cy="40%" r="62%"><stop offset="0" stop-color="${shade(skin, 0.12)}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
    <clipPath id="${id}c"><circle cx="50" cy="50" r="48"/></clipPath>
    <linearGradient id="${id}x" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${darker}" stop-opacity=".45"/><stop offset=".22" stop-color="${darker}" stop-opacity="0"/>
      <stop offset=".78" stop-color="${darker}" stop-opacity="0"/><stop offset="1" stop-color="${darker}" stop-opacity=".5"/></linearGradient>
    <radialGradient id="${id}i" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(iris, 0.45)}"/><stop offset=".6" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, -0.4)}"/></radialGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(hair, 0.28)}"/><stop offset=".45" stop-color="${hair}"/><stop offset="1" stop-color="${shade(hair, -0.3)}"/></linearGradient>
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(lips, -0.15)}"/><stop offset="1" stop-color="${shade(lips, 0.12)}"/></linearGradient>
  </defs>
  <g clip-path="url(#${id}c)">
    <path d="M10 104 C12 90 26 84 38 82 L62 82 C74 84 88 90 90 104 Z" fill="${p.shirt ?? "#546E7A"}"/>
    <path d="M38 82 C42 88 58 88 62 82" fill="none" stroke="${shade(p.shirt ?? "#546E7A", -0.25)}" stroke-width="2"/>
  </g>
  <g class="head">
    ${back}
    <path d="M40 76 L40 86 C44 89 56 89 60 86 L60 76 Z" fill="${dark}"/>
    <ellipse cx="21" cy="58" rx="5" ry="8" fill="${dark}"/><ellipse cx="79" cy="58" rx="5" ry="8" fill="${dark}"/>
    <ellipse cx="21.5" cy="58" rx="2.4" ry="4.5" fill="${darker}" opacity=".5"/><ellipse cx="78.5" cy="58" rx="2.4" ry="4.5" fill="${darker}" opacity=".5"/>
    <path d="M23 50 C23 30 35 20 50 20 C65 20 77 30 77 50 C77 66 72 78 62 85 C56 89 44 89 38 85 C28 78 23 66 23 50 Z" fill="${skin}"/>
    <path d="M23 50 C23 30 35 20 50 20 C65 20 77 30 77 50 C77 66 72 78 62 85 C56 89 44 89 38 85 C28 78 23 66 23 50 Z" fill="url(#${id}s)"/>
    <path d="M23 50 C23 30 35 20 50 20 C65 20 77 30 77 50 C77 66 72 78 62 85 C56 89 44 89 38 85 C28 78 23 66 23 50 Z" fill="url(#${id}x)"/>
    <ellipse cx="50" cy="31" rx="13" ry="6" fill="#FFFFFF" opacity=".12"/>
    <ellipse cx="33" cy="60" rx="5" ry="2.5" fill="#FFFFFF" opacity=".14" transform="rotate(-20 33 60)"/>
    <ellipse cx="67" cy="60" rx="5" ry="2.5" fill="#FFFFFF" opacity=".1" transform="rotate(20 67 60)"/>
    <path d="M37 84 C43 88 57 88 63 84 C58 90 42 90 37 84 Z" fill="${darker}" opacity=".35"/>
    ${wrinkles}${freckles}
    <g class="cheeks" fill="#E57373" opacity=".22"><ellipse cx="31" cy="65" rx="6" ry="4"/><ellipse cx="69" cy="65" rx="6" ry="4"/></g>
    ${beard}
    ${front}
    <g class="brows" stroke="${brow}" stroke-width="${p.thickBrows ? 3.4 : 2.2}" stroke-linecap="round" fill="none">
      <path class="brow l" d="M30 43 Q37 39.5 44 42"/><path class="brow r" d="M56 42 Q63 39.5 70 43"/>
    </g>
    <g class="eyes">${eye(37)}${eye(63)}${lash}</g>
    ${nose}
    ${glasses}${earrings}
    <g class="mouth smile">
      <path d="M40 75.2 C43 73.4 46.5 73 50 74.2 C53.5 73 57 73.4 60 75.2 C56 76.2 44 76.2 40 75.2 Z" fill="${shade(lips, -0.12)}"/>
      <path d="M40.5 75.4 C44 76.4 56 76.4 59.5 75.4 C57 79.6 43 79.6 40.5 75.4 Z" fill="url(#${id}l)"/>
      <path d="M40 75.3 C45 76.6 55 76.6 60 75.3" fill="none" stroke="${shade(lips, -0.45)}" stroke-width=".9" stroke-linecap="round"/>
      <ellipse cx="50" cy="77.4" rx="4" ry=".9" fill="#FFFFFF" opacity=".28"/>
    </g>
    <g class="mouth grin"><path d="M38 73.5 C44 76 56 76 62 73.5 C60 82 54 85 50 85 C46 85 40 82 38 73.5 Z" fill="#5A1F1A"/>
      <path d="M40 74.5 C46 76.5 54 76.5 60 74.5 L59 77.5 C54 78.5 46 78.5 41 77.5 Z" fill="#FFFFFF"/>
      <path d="M38 73.5 C44 76 56 76 62 73.5" fill="none" stroke="${lips}" stroke-width="1.8" stroke-linecap="round"/></g>
    ${p.teeth ? teeth : ""}
    <g class="mouth talk"><ellipse cx="50" cy="77.5" rx="6" ry="4.6" fill="#5A1F1A"/><path d="M45 74.6 C48 74 52 74 55 74.6 L54.4 76.2 C51 75.6 49 75.6 45.6 76.2 Z" fill="#FFFFFF"/>
      <ellipse cx="50" cy="77.5" rx="6" ry="4.6" fill="none" stroke="${lips}" stroke-width="1.6"/></g>
    <path class="mouth frown" d="M41 79 C45 74.5 55 74.5 59 79" fill="none" stroke="${lips}" stroke-width="2.2" stroke-linecap="round"/>
  </g>
</svg>`;
}

// De vaste karakters aan tafel
const PEOPLE = {
  // Henk: rustige oude heer, grijs opzij gekamd haar, bril en snor
  henk: { skin: "#F5D6C1", hair: "wavy", hairColor: "#C9C4BC", brows: "#B9B1A6", thickBrows: true, eyes: "#5B7A8C",
    glasses: "#2E2E2E", beard: "moustache", beardColor: "#DDD8D0", wrinkles: true, nose: "big", shirt: "#8D6E63" },
  // Truus: uitbundig, rode krullenbos, wimpers, oorbellen
  truus: { skin: "#FADFCD", hair: "curly", hairColor: "#D2552F", brows: "#9C3D22", eyes: "#3F8A5A", lashes: true,
    lips: "#C2185B", earrings: "#FFD54F", freckles: true, shirt: "#AB47BC" },
  // Kees: brutaal, pet achterstevoren, stoppelbaard
  kees: { skin: "#F2CDB3", hair: "cap", hairColor: "#6B4226", cap: "#2F6FDB", brows: "#4A3020", thickBrows: true,
    eyes: "#5C3B22", beard: "stubble", beardColor: "#4A3020", teeth: true, shirt: "#E53935" },
  // Ria: gezellige oma met een paarsgrijze permanent en een roze bril
  ria: { skin: "#F9E1D2", hair: "perm", hairColor: "#B8ABD1", brows: "#9C90B5", eyes: "#6E8FB5", lashes: true,
    glasses: "#C2185B", lips: "#D84367", earrings: "#E91E63", wrinkles: true, shirt: "#EC8FB0" },
  // Bram: student, kuif, sportief shirt
  bram: { skin: "#F3D2BC", hair: "quiff", hairColor: "#8A5A2B", brows: "#6B4426", eyes: "#4F7FA8", teeth: true, shirt: "#2E7D32" },
  // Gerda: fanatieke kaartster, strak grijsblond kapsel, rode bril, parels
  gerda: { skin: "#F7DCCB", hair: "bob", hairColor: "#D9CBB0", brows: "#9E8F74", eyes: "#5B7A8C", lashes: true,
    glasses: "#B23A48", lips: "#A63A50", earrings: "#F5F5F5", wrinkles: true, shirt: "#37474F" },
  // Sjef: gemoedelijke caféman, flinke snor, rode wangen
  sjef: { skin: "#EDBFA3", hair: "wavy", hairColor: "#5A3B24", brows: "#4A2F1C", thickBrows: true, eyes: "#5C3B22",
    beard: "moustache", beardColor: "#4A2F1C", nose: "big", wrinkles: true, shirt: "#C62828" },
  // Mo: grappenmaker, krullen en een stoppelbaardje
  mo: { skin: "#B98262", hair: "curly", hairColor: "#1E1612", brows: "#1E1612", eyes: "#3B2416", beard: "stubble",
    beardColor: "#1E1612", teeth: true, shirt: "#7B1FA2" },
  // Tineke: de uitleg, blond bobkapsel
  tineke: { skin: "#FBE3D3", hair: "bob", hairColor: "#E8C35A", brows: "#B8913A", eyes: "#4F86C6", lashes: true,
    lips: "#D0476A", earrings: "#FFFFFF", shirt: "#26A69A" },
};

/** Gezichten die je zelf als plaatje kunt kiezen. */
export const PERSONS = {
  p1: { skin: "#F6D7C3", hair: "short", hairColor: "#6B4426", eyes: "#4F7FA8", shirt: "#3F6FB5" },
  p2: { skin: "#FBE2D2", hair: "long", hairColor: "#E3C16F", eyes: "#4F86C6", lashes: true, lips: "#C9566A", shirt: "#E07A5F" },
  p3: { skin: "#8D5A3B", hair: "short", hairColor: "#1E1612", eyes: "#3B2416", beard: "full", beardColor: "#1E1612", shirt: "#2A9D8F" },
  p4: { skin: "#7A4B30", hair: "afro", hairColor: "#21170F", eyes: "#3B2416", lashes: true, lips: "#7A2E36", earrings: "#FFD54F", shirt: "#F4A261" },
  p5: { skin: "#F4D4BF", hair: "short", hairColor: "#BDBDBD", eyes: "#5B7A8C", glasses: "#3E3E3E", beard: "full", beardColor: "#D6D6D6", wrinkles: true, shirt: "#6D4C41" },
  p6: { skin: "#F7D9C5", hair: "ponytail", hairColor: "#7A4A26", eyes: "#3F8A5A", lashes: true, lips: "#B84A5E", freckles: true, shirt: "#8E7CC3" },
  p7: { skin: "#F8DCCA", hair: "spiky", hairColor: "#E6C25C", eyes: "#4F86C6", shirt: "#43A047" },
  p8: { skin: "#F6DCC6", hair: "bob", hairColor: "#1F1A17", eyes: "#3B2A1E", lashes: true, lips: "#C2185B", shirt: "#E53935" },
  p9: { skin: "#F1CDB4", hair: "quiff", hairColor: "#3A2A20", eyes: "#4A3020", beard: "full", beardColor: "#2E2018", shirt: "#455A64" },
  p10: { skin: "#F8E0D0", hair: "bun", hairColor: "#CFCFCF", eyes: "#6E8FB5", lashes: true, glasses: "#7B5BA6", wrinkles: true, lips: "#C2566E", shirt: "#5C6BC0" },
  p11: { skin: "#FCE6D8", hair: "long", hairColor: "#B5462A", eyes: "#3F8A5A", lashes: true, freckles: true, lips: "#C2185B", shirt: "#26A69A" },
  p12: { skin: "#EFC9AE", hair: "curly", hairColor: "#2A1C14", eyes: "#3B2416", beard: "stubble", beardColor: "#2A1C14", shirt: "#FFB300" },
};

/** SVG van een gezicht; de toestand (praten, blij, zielig) wordt met een class op het element gezet. */
export function faceSvg(who) {
  const p = PEOPLE[who] ?? PERSONS[who];
  return p ? drawFace(p) : initialSvg("?");
}

/** Avatar voor de mens: een cirkel met de eerste letter van de naam. */
export function initialSvg(name) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  return `<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#FFC94D"/>
    <text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="48" font-weight="700" fill="#3A2A00"
      font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif">${letter.replace(/[<&>"]/g, "")}</text>
  </svg>`;
}

/** Avatar met een emoji (van oudere versies, die nog emoji's als plaatje hadden). */
export function emojiSvg(emoji) {
  return `<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#2F6B4F"/>
    <text x="50" y="54" text-anchor="middle" dominant-baseline="central" font-size="54">${emoji.replace(/[<&>"]/g, "")}</text>
  </svg>`;
}

/** Lijf voor het juichende poppetje van de winnaar: armen omhoog, benen die meespringen. */
export function puppetBodySvg(who) {
  const p = PEOPLE[who] ?? PERSONS[who];
  const skin = p?.skin ?? "#F2C9A5";
  const shirt = p?.shirt ?? "#FFC94D";
  const pants = who === "truus" ? "#5E35B1" : who === "ria" ? "#6D4C41" : "#37474F";
  const arm = (side) => {
    const x = side === "l" ? 30 : 70;
    const hx = side === "l" ? 8 : 92;
    return `<g class="arm ${side}"><path d="M${x} 16 L${hx} -14" stroke="${shirt}" stroke-width="11" stroke-linecap="round"/>
      <circle cx="${hx}" cy="-17" r="7" fill="${skin}"/></g>`;
  };
  const leg = (side) => {
    const x = side === "l" ? 36 : 53;
    const fx = side === "l" ? 38 : 63;
    return `<g class="leg ${side}"><rect x="${x}" y="58" width="11" height="34" rx="5" fill="${pants}"/>
      <ellipse cx="${fx}" cy="94" rx="10" ry="6" fill="#263238"/></g>`;
  };
  return `<svg class="pup-body" viewBox="0 0 100 100" aria-hidden="true">
    ${leg("l")}${leg("r")}${arm("l")}${arm("r")}
    <path d="M27 8 Q50 -1 73 8 L77 64 Q50 72 23 64 Z" fill="${shirt}"/>
    ${who === "truus" || who === "ria" ? `<path d="M23 50 L77 50 L86 70 Q50 80 14 70 Z" fill="${shirt}"/>` : ""}
    <path d="M42 6 L50 16 L58 6" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
}
