// Getekende gezichten van de computerspelers. Elk gezicht kan praten (bij het voorspellen),
// blij kijken (goed voorspeld) en zielig kijken (nat).

const SKIN = { henk: "#E9B98F", truus: "#F2C9A5", kees: "#D9A27A", tineke: "#F6D2B8" };

const HAIR = {
  // Henk: kale kruin, grijze slapen, snor en een bril
  henk: `
    <path d="M18 52 C16 34 24 22 34 19 L30 34 C26 40 24 46 24 54 Z" fill="#B9B4AC"/>
    <path d="M82 52 C84 34 76 22 66 19 L70 34 C74 40 76 46 76 54 Z" fill="#B9B4AC"/>`,
  // Truus: rode krullen
  truus: `
    <g fill="#C2502E">
      <circle cx="30" cy="22" r="11"/><circle cx="46" cy="15" r="12"/><circle cx="62" cy="16" r="12"/>
      <circle cx="75" cy="25" r="11"/><circle cx="20" cy="36" r="10"/><circle cx="82" cy="38" r="10"/>
      <circle cx="16" cy="52" r="9"/><circle cx="85" cy="53" r="9"/><circle cx="18" cy="66" r="8"/><circle cx="83" cy="67" r="8"/>
    </g>`,
  // Kees: pet achterstevoren
  kees: `
    <path d="M22 40 C22 18 78 18 78 40 Z" fill="#2F6FDB"/>
    <rect x="16" y="36" width="68" height="7" rx="3.5" fill="#2459B8"/>
    <circle cx="50" cy="20" r="3" fill="#FFD54F"/>`,
};

// Tineke: blond bobkapsel met een pony
const TINEKE_BACK = `<path d="M14 60 C10 26 30 10 50 10 C70 10 90 26 86 60 L86 80 C80 84 74 84 70 80 L70 56 L30 56 L30 80 C26 84 20 84 14 80 Z" fill="#E8C35A"/>`;
const TINEKE_FRONT = `<path d="M22 44 C22 22 40 16 52 16 C66 16 80 24 78 44 C70 36 60 32 50 34 C42 36 32 38 22 44 Z" fill="#F0CF6C"/>`;

const EXTRA = {
  tineke: `
    <circle cx="20" cy="66" r="3" fill="#FFFFFF" stroke="#D8D8D8"/><circle cx="80" cy="66" r="3" fill="#FFFFFF" stroke="#D8D8D8"/>`,
  henk: `
    <g class="glasses" fill="none" stroke="#3B3B3B" stroke-width="2.2">
      <circle cx="38" cy="52" r="8"/><circle cx="62" cy="52" r="8"/><path d="M46 52 h8"/>
    </g>
    <path class="moustache" d="M36 70 C42 64 48 66 50 68 C52 66 58 64 64 70 C58 72 54 71 50 70 C46 71 42 72 36 70 Z" fill="#8C857C"/>`,
  truus: `
    <circle cx="20" cy="62" r="3" fill="#FFD54F"/><circle cx="80" cy="62" r="3" fill="#FFD54F"/>`,
  kees: `
    <g fill="#B87A55" opacity=".55"><circle cx="34" cy="64" r="1.2"/><circle cx="38" cy="66" r="1.2"/><circle cx="62" cy="66" r="1.2"/><circle cx="66" cy="64" r="1.2"/></g>`,
};

const LIPS = { henk: "#7A3B2E", truus: "#C2185B", kees: "#7A3B2E", tineke: "#D0476A" };

/** SVG van een gezicht; de toestand (praten, blij, zielig) wordt met een class op het element gezet. */
export function faceSvg(who) {
  const skin = SKIN[who];
  const lips = LIPS[who];
  return `
<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true">
  <g class="head">
    ${who === "truus" ? HAIR.truus : ""}${who === "tineke" ? TINEKE_BACK : ""}
    <ellipse cx="50" cy="56" rx="30" ry="33" fill="${skin}"/>
    <ellipse cx="20" cy="58" rx="5" ry="7" fill="${skin}"/><ellipse cx="80" cy="58" rx="5" ry="7" fill="${skin}"/>
    ${who === "truus" || who === "tineke" ? "" : HAIR[who]}${who === "tineke" ? TINEKE_FRONT : ""}
    <g class="brows" stroke="#5A4636" stroke-width="2.6" stroke-linecap="round">
      <path class="brow l" d="M32 43 L43 42"/><path class="brow r" d="M57 42 L68 43"/>
    </g>
    <g class="eyes" fill="#2B2B2B">
      <ellipse cx="38" cy="52" rx="3.2" ry="3.8"/><ellipse cx="62" cy="52" rx="3.2" ry="3.8"/>
    </g>
    <g class="cheeks" fill="#E57373" opacity=".35"><circle cx="30" cy="64" r="5"/><circle cx="70" cy="64" r="5"/></g>
    ${EXTRA[who]}
    <path class="mouth smile" d="M40 75 Q50 81 60 75" fill="none" stroke="${lips}" stroke-width="3" stroke-linecap="round"/>
    <path class="mouth grin" d="M37 73 Q50 88 63 73 Z" fill="${lips}"/>
    <ellipse class="mouth talk" cx="50" cy="76" rx="6" ry="5" fill="${lips}"/>
    <path class="mouth frown" d="M40 80 Q50 72 60 80" fill="none" stroke="${lips}" stroke-width="3" stroke-linecap="round"/>
    <path class="tear" d="M33 58 C31 62 30 64 30 66 A3 3 0 0 0 36 66 C36 64 35 62 33 58 Z" fill="#64B5F6"/>
  </g>
</svg>`;
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
