// Getekende gezichten van de computerspelers. Elk gezicht kan praten (bij het voorspellen),
// blij kijken (goed voorspeld) en zielig kijken (nat).

const SKIN = { henk: "#E9B98F", truus: "#F2C9A5", kees: "#D9A27A", tineke: "#F6D2B8", ria: "#F4CFB4" };

const HAIR = {
  // Henk: kale glimmende kruin met één zielige spriet, grijze plukken boven de oren
  henk: `
    <path d="M17 54 C13 40 18 30 26 27 C24 34 25 40 28 44 C22 44 20 50 22 56 Z" fill="#C9C4BC"/>
    <path d="M83 54 C87 40 82 30 74 27 C76 34 75 40 72 44 C78 44 80 50 78 56 Z" fill="#C9C4BC"/>
    <path d="M50 24 C46 14 54 10 58 15 C55 13 51 16 54 22" fill="none" stroke="#9E978D" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="40" cy="31" rx="6" ry="3" fill="#FFFFFF" opacity=".45" transform="rotate(-20 40 31)"/>`,
  // Truus: een enorme rode krullenbos met een strik
  truus: `
    <g fill="#D2552F">
      <circle cx="28" cy="20" r="13"/><circle cx="45" cy="11" r="13"/><circle cx="62" cy="11" r="13"/>
      <circle cx="77" cy="21" r="13"/><circle cx="16" cy="34" r="12"/><circle cx="86" cy="35" r="12"/>
      <circle cx="11" cy="51" r="11"/><circle cx="90" cy="52" r="11"/><circle cx="12" cy="67" r="10"/><circle cx="89" cy="68" r="10"/>
      <circle cx="16" cy="81" r="8"/><circle cx="85" cy="82" r="8"/>
    </g>
    <g fill="#B8432A"><circle cx="36" cy="15" r="5"/><circle cx="68" cy="16" r="5"/><circle cx="20" cy="45" r="5"/></g>
    <path d="M58 6 L70 0 L70 14 Z M58 6 L46 0 L46 14 Z" fill="#7E57C2"/><circle cx="58" cy="7" r="3.5" fill="#9575CD"/>`,
  // Ria: een grijs-paarse permanent met een knotje erbovenop
  ria: `
    <circle cx="50" cy="10" r="8" fill="#A99BC4"/><circle cx="50" cy="10" r="4" fill="#9585B5"/>
    <g fill="#B8ABD1">
      <circle cx="26" cy="32" r="9"/><circle cx="36" cy="24" r="9"/><circle cx="50" cy="21" r="10"/>
      <circle cx="64" cy="24" r="9"/><circle cx="74" cy="32" r="9"/><circle cx="21" cy="43" r="7"/><circle cx="79" cy="43" r="7"/>
    </g>
    <g fill="#9F91BD"><circle cx="40" cy="27" r="3"/><circle cx="58" cy="25" r="3"/><circle cx="72" cy="35" r="3"/><circle cx="27" cy="36" r="3"/></g>`,
  // Kees: pet achterstevoren met een pluk haar door het gat
  kees: `
    <path d="M44 18 C40 8 48 6 50 12 C52 4 60 6 56 18 Z" fill="#6B4226"/>
    <path d="M21 40 C21 16 79 16 79 40 Z" fill="#2F6FDB"/>
    <path d="M30 26 C36 22 44 21 50 21" fill="none" stroke="#5B92F0" stroke-width="3" stroke-linecap="round"/>
    <rect x="15" y="36" width="70" height="7" rx="3.5" fill="#2459B8"/>
    <path d="M70 40 L94 46 C95 49 92 51 89 50 L68 44 Z" fill="#2459B8"/>
    <circle cx="50" cy="19" r="3" fill="#FFD54F"/>`,
};

// Tineke: blond bobkapsel met een pony
const TINEKE_BACK = `<path d="M14 60 C10 26 30 10 50 10 C70 10 90 26 86 60 L86 80 C80 84 74 84 70 80 L70 56 L30 56 L30 80 C26 84 20 84 14 80 Z" fill="#E8C35A"/>`;
const TINEKE_FRONT = `<path d="M22 44 C22 22 40 16 52 16 C66 16 80 24 78 44 C70 36 60 32 50 34 C42 36 32 38 22 44 Z" fill="#F0CF6C"/>`;

// Grote stripogen: wit met een pupil die een beetje scheel kijkt
const EYES = {
  henk: { rx: 6.5, ry: 7, px: [1.5, -1.5], pr: 3.6 },
  truus: { rx: 6, ry: 7.5, px: [1, 1], pr: 3.2 },
  kees: { rx: 7, ry: 8, px: [2, -2.5], pr: 3.4 },
  tineke: { rx: 5.5, ry: 6.5, px: [0.8, 0.8], pr: 3 },
  ria: { rx: 6, ry: 6.5, px: [-1.2, -1.2], pr: 3.2 },
};

const EARS = { henk: [6, 8], truus: [5, 7], kees: [9, 11], tineke: [5, 7], ria: [5, 7] };

const NOSE = {
  henk: `<ellipse cx="50" cy="62" rx="8" ry="7" fill="#E07A6A"/><ellipse cx="47" cy="59.5" rx="2.4" ry="1.6" fill="#FFFFFF" opacity=".6"/>`,
  truus: `<path d="M50 56 C47 62 46 65 50 66" fill="none" stroke="#C98E6B" stroke-width="2.2" stroke-linecap="round"/>`,
  kees: `<ellipse cx="50" cy="63" rx="5" ry="4" fill="#C98660"/>`,
  tineke: `<path d="M50 57 C48 61 48 63 51 64" fill="none" stroke="#D9A88A" stroke-width="2" stroke-linecap="round"/>`,
  ria: `<path d="M50 55 C46 63 45 66 51 67" fill="none" stroke="#C99478" stroke-width="2.4" stroke-linecap="round"/>`,
};

const EXTRA = {
  tineke: `
    <circle cx="20" cy="66" r="3" fill="#FFFFFF" stroke="#D8D8D8"/><circle cx="80" cy="66" r="3" fill="#FFFFFF" stroke="#D8D8D8"/>`,
  henk: `
    <g class="glasses" fill="#FFFFFF" fill-opacity=".18" stroke="#2E2E2E" stroke-width="2.6">
      <circle cx="38" cy="51" r="10"/><circle cx="62" cy="51" r="10"/><path d="M48 50 C49 48 51 48 52 50" fill="none"/>
    </g>
    <path class="moustache" d="M30 72 C34 64 44 64 50 69 C56 64 66 64 70 72 C72 76 66 78 64 74 C60 70 54 72 50 73 C46 72 40 70 36 74 C34 78 28 76 30 72 Z" fill="#E6E2DC" stroke="#B5AEA4" stroke-width="1"/>`,
  truus: `
    <g stroke="#2B2B2B" stroke-width="1.8" stroke-linecap="round">
      <path d="M31 46 L28 42 M34 44.5 L33 40 M37.5 44 L38 39.5"/><path d="M69 46 L72 42 M66 44.5 L67 40 M62.5 44 L62 39.5"/>
    </g>
    <circle cx="65" cy="68" r="1.4" fill="#5A3A2A"/>
    <g fill="#FFD54F" stroke="#E0A800" stroke-width="1"><circle cx="19" cy="68" r="4.5"/><circle cx="81" cy="68" r="4.5"/></g>`,
  ria: `
    <g fill="none" stroke="#C2185B" stroke-width="2.2"><circle cx="38" cy="51" r="9.5"/><circle cx="62" cy="51" r="9.5"/><path d="M47.5 50 h5"/></g>
    <g fill="#FFFFFF" stroke="#D6D0C4" stroke-width=".6"><circle cx="34" cy="90" r="2.6"/><circle cx="40" cy="92" r="2.6"/><circle cx="46" cy="93" r="2.6"/>
      <circle cx="52" cy="93" r="2.6"/><circle cx="58" cy="92" r="2.6"/><circle cx="64" cy="90" r="2.6"/></g>
    <g fill="#E91E63"><circle cx="19" cy="68" r="3.5"/><circle cx="81" cy="68" r="3.5"/></g>`,
  kees: `
    <g fill="#B87A55" opacity=".6"><circle cx="31" cy="64" r="1.3"/><circle cx="35" cy="67" r="1.3"/><circle cx="38" cy="63" r="1.3"/>
      <circle cx="62" cy="63" r="1.3"/><circle cx="65" cy="67" r="1.3"/><circle cx="69" cy="64" r="1.3"/></g>`,
};

const LIPS = { henk: "#7A3B2E", truus: "#D81B60", kees: "#7A3B2E", tineke: "#D0476A", ria: "#E53950" };

/** SVG van een gezicht; de toestand (praten, blij, zielig) wordt met een class op het element gezet. */
export function faceSvg(who) {
  if (!EYES[who]) return initialSvg("?");
  const skin = SKIN[who];
  const lips = LIPS[who];
  const e = EYES[who];
  const [earX, earY] = EARS[who];
  const lipWidth = who === "truus" ? 4.2 : 3;
  // Kees heeft twee grote voortanden die je ziet als hij lacht
  const teeth = who === "kees" ? `<path class="teeth" d="M45.5 77 h9 v5.5 a1 1 0 0 1 -1 1 h-3 v-3 h-1 v3 h-3 a1 1 0 0 1 -1 -1 Z" fill="#FFFFFF" stroke="#C9C9C9" stroke-width=".6"/>` : "";
  return `
<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true">
  <g class="head">
    ${who === "truus" ? HAIR.truus : ""}${who === "tineke" ? TINEKE_BACK : ""}
    <ellipse cx="${50 - 30 - earX / 2}" cy="58" rx="${earX}" ry="${earY}" fill="${skin}"/>
    <ellipse cx="${50 + 30 + earX / 2}" cy="58" rx="${earX}" ry="${earY}" fill="${skin}"/>
    <ellipse cx="50" cy="56" rx="30" ry="33" fill="${skin}"/>
    ${who === "truus" || who === "tineke" ? "" : HAIR[who] ?? ""}${who === "tineke" ? TINEKE_FRONT : ""}
    <g class="brows" stroke="${who === "henk" ? "#BDB6AC" : "#5A4636"}" stroke-width="${who === "henk" ? 4.5 : 2.8}" stroke-linecap="round">
      <path class="brow l" d="M30 ${who === "henk" ? 38 : 41} Q37 ${who === "henk" ? 34 : 38} 44 40"/><path class="brow r" d="M56 40 Q63 ${who === "henk" ? 34 : 38} 70 ${who === "henk" ? 38 : 41}"/>
    </g>
    <g class="eyes">
      <ellipse cx="38" cy="51" rx="${e.rx}" ry="${e.ry}" fill="#FFFFFF" stroke="#3A3A3A" stroke-width="1"/>
      <ellipse cx="62" cy="51" rx="${e.rx}" ry="${e.ry}" fill="#FFFFFF" stroke="#3A3A3A" stroke-width="1"/>
      <circle cx="${38 + e.px[0]}" cy="52" r="${e.pr}" fill="#2B2B2B"/><circle cx="${62 + e.px[1]}" cy="52" r="${e.pr}" fill="#2B2B2B"/>
      <circle cx="${37 + e.px[0]}" cy="50.5" r="1.1" fill="#FFFFFF"/><circle cx="${61 + e.px[1]}" cy="50.5" r="1.1" fill="#FFFFFF"/>
    </g>
    <g class="cheeks" fill="#E57373" opacity=".4"><circle cx="28" cy="65" r="5.5"/><circle cx="72" cy="65" r="5.5"/></g>
    ${NOSE[who]}
    ${EXTRA[who]}
    <path class="mouth smile" d="M38 76 Q50 84 62 76" fill="none" stroke="${lips}" stroke-width="${lipWidth}" stroke-linecap="round"/>
    <path class="mouth grin" d="M35 73 Q50 92 65 73 Z" fill="${lips}"/>
    ${teeth}
    <ellipse class="mouth talk" cx="50" cy="78" rx="6.5" ry="5.5" fill="${lips}"/>
    <path class="mouth frown" d="M39 82 Q50 73 61 82" fill="none" stroke="${lips}" stroke-width="${lipWidth}" stroke-linecap="round"/>
    <path class="tear" d="M31 58 C29 62 28 64 28 66 A3 3 0 0 0 34 66 C34 64 33 62 31 58 Z" fill="#64B5F6"/>
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

/** Avatar met een gekozen emoji. */
export function emojiSvg(emoji) {
  return `<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#2F6B4F"/>
    <text x="50" y="54" text-anchor="middle" dominant-baseline="central" font-size="54">${emoji.replace(/[<&>"]/g, "")}</text>
  </svg>`;
}

const SHIRT = { henk: "#8D6E63", truus: "#AB47BC", kees: "#E53935", tineke: "#26A69A", ria: "#EC8FB0" };

/** Lijf voor het juichende poppetje van de winnaar: armen omhoog, benen die meespringen. */
export function puppetBodySvg(who) {
  const skin = SKIN[who] ?? "#F2C9A5";
  const shirt = SHIRT[who] ?? "#FFC94D";
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
