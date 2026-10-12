// Webversie van "10 op en neer". De spelregels en computerspelers komen uit de Kotlin-code
// van de Android-app (tienopenneer.mjs); dit bestand tekent alleen het scherm.
import { WebGame, describeCard, defaultNames } from "./tienopenneer.mjs";
import { faceSvg, initialSvg, emojiSvg, puppetBodySvg } from "./faces.js";
import * as tineke from "./tineke.js";
import { BID_LINES, WET_LINES, BID_MS } from "./voices.js";
import { Host, Guest, makeCode, normalizeCode, AVATAR_EMOJIS, cleanAvatar } from "./net.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ------------------------------------------------------------------------------------------
// Opslag
// ------------------------------------------------------------------------------------------

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* privémodus */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* privémodus */ }
  },
};

const settings = Object.assign(
  {
    playerName: "Speler", speed: 3, sortDescending: false, sound: true, speakBids: true, smart: true,
    tinekeHelp: true, tinekeComments: true, tinekeAsked: false,
  },
  store.get("instellingen", {}),
);
const saveSettings = () => store.set("instellingen", settings);

const TIEN_OP_EN_NEER = {
  maxCards: 10, pointsPerTrick: 1, wrongScoresZero: true, penaltyPerTrick: 0,
  negativeScores: false, roundingAllowed: true, mustTrump: false,
};
const BOERENBRIDGE = {
  maxCards: 13, pointsPerTrick: 3, wrongScoresZero: false, penaltyPerTrick: 3,
  negativeScores: false, roundingAllowed: false, mustTrump: false,
};

function createGame(rules, smart, seed, names, actions, humanSeats = [1], viewSeat = 1) {
  return new WebGame(
    rules.maxCards, rules.pointsPerTrick, rules.wrongScoresZero, rules.penaltyPerTrick,
    rules.negativeScores, rules.roundingAllowed, rules.mustTrump, smart,
    seed, names, actions, humanSeats, viewSeat, rules.players ?? 4,
  );
}

function variantKey(s) {
  if (s.isTienOpEnNeer) return "10openneer";
  if (s.variant === "Boerenbridge") return "boerenbridge";
  return "hybride";
}

const MAX_HIGHSCORES = 10;
const loadHighScores = (key) => store.get("highscore." + key, []);

/** Voegt een score toe en geeft de plaats (1..10), of 0 als de score de lijst niet haalt. */
function addHighScore(key, name, score) {
  const list = loadHighScores(key);
  const d = new Date();
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  let pos = list.findIndex((h) => score > h.score);
  if (pos < 0) pos = list.length;
  if (pos >= MAX_HIGHSCORES) return 0;
  list.splice(pos, 0, { name, score, date });
  store.set("highscore." + key, list.slice(0, MAX_HIGHSCORES));
  return pos + 1;
}

// ------------------------------------------------------------------------------------------
// Geluid
// ------------------------------------------------------------------------------------------

const VOICES = ["speler", "henk", "truus", "kees"];
let audio = null;
const buffers = new Map();
let currentSource = null;

function unlockAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
    // Alvast laden, zodat het eerste geluid niet hapert
    for (const v of VOICES) BID_LINES[v].forEach((row, n) => row.forEach((_, k) => loadSound(`bod_${v}_${n}_${k}`)));
    for (const v of Object.keys(WET_LINES)) WET_LINES[v].forEach((_, k) => loadSound(`nat_${v}_${k}`));
  }
  if (audio.state === "suspended") audio.resume();
}
for (const ev of ["touchend", "click", "keydown"]) document.addEventListener(ev, unlockAudio, true);

function loadSound(name) {
  if (!buffers.has(name)) {
    const p = fetch(`sounds/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((data) => new Promise((resolve, reject) => audio.decodeAudioData(data, resolve, reject)))
      .catch(() => null);
    buffers.set(name, p);
  }
  return buffers.get(name);
}

/** Speelt een geluid; een nieuw geluid onderbreekt het vorige, net als in het origineel. Geeft de duur in ms. */
async function playSound(name) {
  if (!audio) return 0;
  const buffer = await loadSound(name);
  if (!buffer) return 0;
  if (currentSource) {
    try { currentSource.stop(); } catch { /* al gestopt */ }
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.connect(audio.destination);
  src.start();
  currentSource = src;
  return buffer.duration * 1000;
}

// ------------------------------------------------------------------------------------------
// Toestand
// ------------------------------------------------------------------------------------------

/** Gezicht per stoel in het spel: 1 is de mens, dan Henk (links), Truus (boven) en Kees (rechts); Ria bij vijf. */
const SEAT_FACE = [null, null, "henk", "truus", "kees", "ria"];

/** Gezicht van de speler op plaats nr van het scherm, of null voor een mens. */
function faceFor(nr) {
  const p = st?.players[nr - 1];
  if (!p) return SEAT_FACE[nr];
  return p.human ? null : SEAT_FACE[p.seat];
}
const voiceFor = (nr) => faceFor(nr) ?? "speler";

/** Samen spelen: { role: "host"|"guest", code, seat, link, players, queue, game, rules, smart, status, error } */
let online = null;

let game = null;
let st = null; // laatste toestand uit de spelcode
let currentRules = TIEN_OP_EN_NEER;
let currentSmart = true;
let screen = "menu";
let rulesReturn = "menu";
let driver = null;
let busy = false; // een slag wordt binnengehaald
let gameOverHandled = false;
let highScorePlace = 0;
let message = null;
let hintCard = 0;
let hintBid = -1;
let showLastTrick = false;
let showScores = false;
let confirmDialog = null;
let menuOpen = false;
let announcedRound = 0;
const announced = [false, false, false, false, false];
const wetShown = [false, false, false, false, false];
let speechUntil = 0; // tot wanneer de laatste voorspelling nog uitgesproken wordt
let wetSpoken = false; // maar één nat-reactie tegelijk uitspreken
const talkingUntil = [0, 0, 0, 0, 0];
const previousTricks = [0, 0, 0, 0, 0];
let previousTable = [0, 0, 0, 0, 0];
let humanCardFrom = null; // plek van de kaart die de mens net speelde, voor de animatie
let helpLevel = 0; // loopt op per slag, zodat Tineke steeds minder uitlegt
let tinekeWaiting = null; // functie die het spel laat doorgaan na "Doorgaan"
let tinekeTimer = null;
let tinekeShown = null; // { text, wait, isHelp } wat Tineke nu zegt
let tinekePending = null; // uitleg die na "Doorgaan" weer getoond moet worden
let tinekeClick = 0;
let tinekeOpinion = 0;
let adviceBid = 0;
let lastTurnKey = "";

let newBase = TIEN_OP_EN_NEER;
let newRounding = true;
let newMustTrump = false;
/** Aantal spelers en tot hoeveel kaarten; null = zo lang als de variant normaal is. */
let newPlayers = 4;
let newMax = null;
let hsTab = "10openneer";

/** De stoel (in het spel) van een andere mens die nu aan de beurt is, of 0. */
function remoteTurn() {
  if (!online?.game || !game) return 0;
  const seat = game.humanToMove();
  return seat && seat !== online.seat ? seat : 0;
}
const humanBidding = () => st && st.phase === "BIDDING" && st.active === 1;
const humanPlaying = () => st && st.phase === "PLAYING" && st.active === 1;
const hasGameInProgress = () => st !== null && st.phase !== "GAME_OVER";
const speedFactor = () => ({ 1: 2.0, 2: 1.4, 3: 1.0, 4: 0.65, 5: 0.35 })[settings.speed] ?? 1.0;
const animMs = (ms) => (reducedMotion ? 1 : ms * Math.min(1, Math.max(0.5, speedFactor())));

/** Kan deze speler zijn voorspelling niet meer halen? */
/** Nat: te veel slagen, of te weinig kaarten over om het bod nog te halen. Een slag die nog op tafel ligt telt mee. */
const isWet = (p) => {
  if (p.bid < 0) return false;
  const i = st ? st.players.indexOf(p) : -1;
  const pending = st && st.phase === "TRICK_COMPLETE" && st.trickWinner === i + 1 ? 1 : 0;
  const tricks = p.tricks + pending;
  // Een kaart die nog op tafel ligt kan de slag nog winnen, dus die telt mee als kans
  const onTable = st && st.phase === "PLAYING" && i >= 0 && st.table[i] ? 1 : 0;
  return tricks > p.bid || p.bid - tricks > p.cardCount + onTable;
};

function restoreSavedGame() {
  const saved = store.get("spel", null);
  if (!saved?.rules) return;
  try {
    currentRules = saved.rules;
    currentSmart = saved.smart ?? false;
    game = createGame(saved.rules, currentSmart, saved.seed, saved.names, saved.actions);
    game.setPlayerName(settings.playerName);
    refresh();
  } catch (e) {
    console.warn("Opgeslagen spel kon niet worden hersteld", e);
    store.remove("spel");
    game = null;
    st = null;
  }
}

function saveGame() {
  if (online?.game) { saveOnline(); return; }
  if (!game || !st || st.phase === "GAME_OVER") return;
  store.set("spel", {
    rules: currentRules,
    smart: currentSmart,
    seed: game.seed,
    names: st.players.map((p) => p.name),
    actions: Array.from(game.actions()),
  });
}

function startNewGame(rules) {
  closeOnline();
  if (!settings.tinekeAsked) {
    settings.tinekeAsked = true;
    saveSettings();
    confirmDialog = {
      title: "Ken je 10 op en neer al?",
      text: "Tineke kan je tijdens het eerste spel stap voor stap uitleggen hoe het werkt. Je kunt haar uitleg later altijd aan- of uitzetten bij Instellingen.",
      yes: "Leg het me uit",
      no: "Ik ken het, overslaan",
      action: () => { settings.tinekeHelp = true; saveSettings(); startNewGame(rules); },
      noAction: () => { settings.tinekeHelp = false; saveSettings(); startNewGame(rules); },
    };
    renderDialog();
    return;
  }
  stopDriver();
  tinekeHide();
  helpLevel = 0;
  lastTurnKey = "";
  const names = Array.from(defaultNames());
  names[0] = settings.playerName;
  currentRules = rules;
  currentSmart = settings.smart;
  game = createGame(rules, currentSmart, Math.floor(Math.random() * 2147483647), names, []);
  gameOverHandled = false;
  endComment = null;
  highScorePlace = 0;
  showScores = false;
  previousTable = [0, 0, 0, 0, 0];
  clearTransient();
  refresh();
  saveGame();
  show("game");
  if (settings.tinekeHelp) {
    tinekeHelp("welkom").then(() => { onTurn(); drive(); });
  } else {
    onTurn();
  }
  drive();
}

function clearTransient() {
  message = null;
  hintCard = 0;
  hintBid = -1;
  showLastTrick = false;
}

function refresh() {
  if (!game) {
    st = null;
    return;
  }
  st = JSON.parse(game.state());
  const sounds = Array.from(game.takeSounds());
  // Als de spelers praten, zegt een computerspeler zelf iets als hij nat gaat in plaats van het geluidje
  const voiceWet = settings.speakBids && sounds[sounds.length - 1] === "MEDESPELER_NAT";
  if (settings.sound && sounds.length && !voiceWet) playSound(sounds[sounds.length - 1].toLowerCase());
  if (sounds.includes("SLAG_TE_VEEL") && Math.random() < 1 / 3) tinekeComment("te veel");
  else if (sounds.includes("SLAG_TE_WEINIG") && Math.random() < 1 / 3) tinekeComment("te weinig");
  else if (sounds.includes("GOED_VOORSPELD") && Math.random() < 1 / 4) tinekeComment("goed");
  wetSpoken = false;
  announceBids();
  if (screen === "game") renderGame();
  if (screen === "game") onTurn();
  if (st.phase === "GAME_OVER") handleGameOver();
}

/** Spreekt nieuwe voorspellingen uit, laat het gezicht praten en toont een tekstballon. */
function announceBids() {
  if (announcedRound !== st.round) {
    announcedRound = st.round;
    // Bij een hersteld spel de al gedane voorspellingen niet opnieuw zeggen
    for (let nr = 1; nr <= st.players.length; nr++) {
      announced[nr] = st.players[nr - 1].bid >= 0;
      wetShown[nr] = isWet(st.players[nr - 1]);
      previousTricks[nr] = st.players[nr - 1].tricks;
    }
    return;
  }
  for (let nr = 1; nr <= st.players.length; nr++) {
    const p = st.players[nr - 1];
    if (p.bid >= 0 && !announced[nr]) {
      announced[nr] = true;
      const speak = settings.sound && settings.speakBids;
      const v = voiceFor(nr);
      const k = pickLine(`bod${nr}`, BID_LINES[v][p.bid].length, true);
      if (speak) playSound(`bod_${v}_${p.bid}_${k}`);
      const line = BID_LINES[v][p.bid][k];
      const ms = speak ? BID_MS[v][p.bid][k] + 250 : 1300 + (k ? line.length * 25 : 0);
      if (speak) speechUntil = Date.now() + ms;
      if (nr > 1) talkingUntil[nr] = Date.now() + ms;
      showBubble(nr, bidBubble(k ? line : "", p.bid), ms + 300);
      setTimeout(() => { if (screen === "game") updateSeats(); }, ms + 20);
    }
    if (!wetShown[nr] && isWet(p) && st.phase !== "BIDDING") {
      wetShown[nr] = true;
      if (!faceFor(nr)) {
        showBubble(nr, "Nat…", 2200, true);
      } else {
        const v = voiceFor(nr);
        const k = pickLine(`nat${nr}`, WET_LINES[v].length, false);
        if (settings.sound && settings.speakBids && !wetSpoken) {
          wetSpoken = true;
          playSound(`nat_${v}_${k}`);
        }
        showBubble(nr, esc(WET_LINES[v][k]), 2600, true);
      }
    }
  }
}

/** Kiest een variant: meestal alleen het getal (variant 0), en nooit twee keer achter elkaar hetzelfde. */
const lastLine = {};
function pickLine(key, count, plainMostly) {
  let k;
  do {
    k = plainMostly && Math.random() < 0.55 ? 0 : (plainMostly ? 1 : 0) + Math.floor(Math.random() * (plainMostly ? count - 1 : count));
  } while (count > 1 && k === lastLine[key] && k !== 0);
  lastLine[key] = k;
  return k;
}

/** Tekstballon bij een voorspelling, met het getal groot en vet. */
function bidBubble(text, bid) {
  return text ? `<b>${bid}</b> <span>${esc(text)}</span>` : `<b>${bid}</b>`;
}

function stepDelay(phase) {
  const factor = speedFactor();
  const base = { BIDDING: 550, PLAYING: 700, TRICK_COMPLETE: 1200 }[phase] ?? 300;
  // Tijd om de uitgesproken voorspelling af te laten maken
  const minimum = phase === "BIDDING" ? Math.max(0, speechUntil - Date.now() + 300) : 0;
  return Math.max(base * factor, minimum);
}

function drive() {
  if (driver !== null || busy || tinekeWaiting || screen !== "game" || !st) return;
  if (st.phase === "GAME_OVER" || st.phase === "ROUND_COMPLETE" || humanBidding() || humanPlaying()) return;
  // Wachten op een andere mens: pas verder als zijn handeling binnen is
  if (remoteTurn() && !online.queue.has(game.actionCount())) return;
  driver = setTimeout(async () => {
    driver = null;
    if (tinekeWaiting) return;
    if (st.phase === "TRICK_COMPLETE") {
      await collectTrick();
    } else if (remoteTurn()) {
      const index = game.actionCount();
      const a = online.queue.get(index);
      online.queue.delete(index);
      const error = a ? game.applyRemote(a.seat, a.value) : "geen handeling";
      if (error) console.warn("Handeling van een andere speler past niet:", error);
      afterStep();
    } else {
      game.advance();
      afterStep();
    }
    drive();
  }, stepDelay(st.phase));
}

function afterStep() {
  refresh();
  if (humanBidding() || humanPlaying()) {
    showLastTrick = false;
    renderGame();
  }
  saveGame();
}

function stopDriver() {
  if (driver !== null) clearTimeout(driver);
  driver = null;
}

/** De slag schuift naar de winnaar; daarna gaat het spel verder. */
async function collectTrick() {
  if (busy || st.phase !== "TRICK_COMPLETE") return;
  busy = true;
  const winner = st.trickWinner;
  if (screen === "game" && !showLastTrick) await animateCollect(winner);
  game.advance();
  busy = false;
  afterStep();
  if (settings.tinekeHelp && st.phase === "PLAYING") {
    await tinekeHelp("slag erbij");
    helpLevel++;
  }
}

function handleGameOver() {
  if (gameOverHandled) return;
  gameOverHandled = true;
  // Een afgelopen online spel niet meer automatisch openen na het herladen
  if (online?.role === "host") saveOnline();
  else if (online) store.remove("online-gast");
  const me = st.players[0];
  // Highscores alleen voor een volledig spel met vier spelers, anders zijn de scores niet te vergelijken
  const full = st.players.length === 4 && !/ tot \d+$/.test(st.variant);
  highScorePlace = full ? addHighScore(variantKey(st), me.name, me.total) : 0;
  // AfgelopenCommentaar: applaus bij een goed resultaat
  const aloneFirst = me.rank === 1 && st.players.filter((p) => p.rank === 1).length === 1;
  let applause = null;
  if (highScorePlace > 0 || aloneFirst) applause = "zeer_goed_gespeeld";
  else if (me.rank === 1) applause = "goed_gespeeld";
  else if (st.isTienOpEnNeer && me.total >= 190) applause = "zeer_goed_gespeeld";
  else if (st.isTienOpEnNeer && me.total >= 180) applause = "goed_gespeeld";
  if (applause && settings.sound) playSound(applause);
  store.remove("spel");
  celebrate().then(renderDialog);
  renderDialog();
}

// ------------------------------------------------------------------------------------------
// Feestje aan het einde: stuiterende kaarten die een spoor achterlaten, zoals bij het oude Patience
// ------------------------------------------------------------------------------------------

let celebrating = false;

/** Tekent één kaart op een eigen klein canvas, zodat hij snel steeds opnieuw getekend kan worden. */
function cardSprite(code, w, dpr) {
  const h = Math.round(w * 1.42);
  const c = document.createElement("canvas");
  c.width = w * dpr;
  c.height = h * dpr;
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  const color = suit === 2 || suit === 4 ? "#D93636" : "#1E2430";
  const sym = SUIT[suit].replace("\uFE0E", "");
  const label = LABEL[rank] ?? String(rank);
  const rad = w * 0.12;
  g.beginPath();
  if (g.roundRect) g.roundRect(0.5, 0.5, w - 1, h - 1, rad);
  else g.rect(0.5, 0.5, w - 1, h - 1);
  g.fillStyle = "#FFFFFF";
  g.fill();
  g.strokeStyle = "rgba(0,0,0,.25)";
  g.stroke();
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const font = (px) => `700 ${px}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  g.font = font(w * 0.26);
  g.fillText(label, w * 0.2, h * 0.14);
  g.font = font(w * 0.2);
  g.fillText(sym, w * 0.2, h * 0.3);
  g.font = font(rank >= 11 && rank <= 13 ? w * 0.5 : w * 0.56);
  g.fillText(rank >= 11 && rank <= 13 ? label : sym, w / 2, h * 0.56);
  return c;
}

/** De winnaar(s) springen als poppetje uit het speelbord en juichen. */
const WINNER_MODES = ["juichen", "lopen", "dansen", "salto"];

function winnerStage(mode = null) {
  if (!st) return null;
  const winners = st.players.map((p, i) => ({ p, nr: i + 1 })).filter((x) => x.p.rank === 1);
  if (!winners.length) return null;
  const felt = $("#table").getBoundingClientRect();
  const stage = document.createElement("div");
  // Elke keer een verrassing: juichen, over het bord lopen, dansen of een salto
  const act = WINNER_MODES.includes(mode) ? mode : WINNER_MODES[Math.floor(Math.random() * WINNER_MODES.length)];
  stage.className = `winner-stage mode-${act}`;
  const pw = Math.max(64, Math.min(130, (window.innerWidth * 0.3) / winners.length, felt.height * 0.32));
  stage.style.setProperty("--pw", `${pw}px`);
  stage.style.setProperty("--n", String(winners.length));
  stage.style.setProperty("--walk", `${Math.max(0, felt.width / 2 - (pw * winners.length) / 2 - 6)}px`);
  stage.style.left = `${felt.left + felt.width / 2}px`;
  stage.style.top = `${felt.top + felt.height * 0.8}px`;
  const me = (nr) => nr === 1 && st.players[0].human;
  const title = winners.length === 1
    ? (me(winners[0].nr) ? "Jij wint!" : `${esc(winners[0].p.name)} wint!`)
    : `${winners.map((w) => (me(w.nr) ? "Jij" : esc(w.p.name))).join(", ").replace(/, ([^,]*)$/, " en $1")} winnen!`;
  const slices = Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join("");
  stage.innerHTML = `<div class="winner-banner">${title}</div><div class="nl-waving" aria-hidden="true"><span class="pole"></span><span class="cloth">${slices}</span></div><div class="puppets">${winners.map(({ p, nr }, i) => {
    const face = faceFor(nr);
    const head = face ? faceSvg(face) : humanAvatarHtml(customAvatar(nr), p.name);
    return `<div class="puppet" style="--d:${i * 0.15}s"><div class="pup-inner">
      <div class="avatar happy pup-head" data-who="${face ?? "mens"}">${head}</div>${puppetBodySvg(face ?? "mens")}</div></div>`;
  }).join("")}</div>`;
  document.body.appendChild(stage);
  return stage;
}

/** Speelt de animatie af; tikken slaat hem over. Klaar als de kaarten weg zijn. */
function celebrate(mode = null) {
  if (celebrating || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  celebrating = true;
  return new Promise((resolve) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const canvas = document.createElement("canvas");
    canvas.className = "celebrate";
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    document.body.appendChild(canvas);
    const g = canvas.getContext("2d");
    g.scale(dpr, dpr);
    const w = Math.round(Math.max(46, Math.min(90, W / 8)));
    const h = Math.round(w * 1.42);
    // Vier stapels bovenaan, zoals de azen bij Patience; de kaarten springen er om de beurt af
    const piles = [0, 1, 2, 3].map((i) => (W - w) * (0.14 + 0.24 * i));
    const order = [];
    for (let rank = 14; rank >= 2; rank--) for (let suit = 1; suit <= 4; suit++) order.push(suit * 100 + rank);
    const sprites = new Map();
    const active = [];
    const gravity = H / 1400;
    let launched = 0;
    let last = 0;
    let done = false;
    let started = performance.now();

    const stage = winnerStage(mode);
    const finish = () => {
      if (done) return;
      done = true;
      canvas.classList.add("out");
      stage?.classList.add("out");
      setTimeout(() => { canvas.remove(); stage?.remove(); celebrating = false; resolve(); }, 450);
    };
    canvas.addEventListener("pointerdown", finish);
    stage?.addEventListener("pointerdown", finish);

    const launch = () => {
      const code = order[launched];
      if (!sprites.has(code)) sprites.set(code, cardSprite(code, w, dpr));
      const pile = launched % 4;
      const dir = piles[pile] + w / 2 < W / 2 ? 1 : -1;
      const speed = W / 260 + Math.random() * W / 160;
      active.push({
        sprite: sprites.get(code), x: piles[pile], y: H * 0.08,
        vx: (Math.random() < 0.8 ? dir : -dir) * speed, vy: -Math.random() * H / 120,
      });
      launched++;
    };

    const frame = (now) => {
      if (done) return;
      if (launched < order.length && now - last > 260 && active.length < 6) { launch(); last = now; }
      for (let i = active.length - 1; i >= 0; i--) {
        const c = active[i];
        c.vy += gravity;
        c.x += c.vx;
        c.y += c.vy;
        if (c.y + h > H) { c.y = H - h; c.vy = -c.vy * 0.82; }
        g.drawImage(c.sprite, c.x, c.y, w, h);
        if (c.x < -w || c.x > W) active.splice(i, 1);
      }
      if ((launched >= order.length && active.length === 0) || now - started > 10000) finish();
      else requestAnimationFrame(frame);
    };
    // De tafel blijft zichtbaar, de kaarten tekenen eroverheen
    requestAnimationFrame((now) => { started = now; frame(now); });
  });
}

// ------------------------------------------------------------------------------------------
// Handelingen
// ------------------------------------------------------------------------------------------

function onBid(n) {
  const index = game.actionCount();
  const error = game.bid(n);
  if (!error) netSend(index, n);
  clearTransient();
  if (error) message = error;
  if (!error) {
    tinekeHide();
    tinekeOpinion = n <= adviceBid - 2 ? 1 : n >= adviceBid + 2 ? 2 : 0;
    if (tinekeOpinion === 1) tinekeComment("weinig voorspeld");
    if (tinekeOpinion === 2) tinekeComment("veel voorspeld");
  }
  refresh();
  if (!error) saveGame();
  renderGame();
  if (!error && settings.tinekeHelp) {
    tinekeHelp("voorspeld").then(() => drive());
  }
  drive();
}

function onCardTap(code, el) {
  if (busy) return;
  if (!humanPlaying()) {
    message = st.phase === "BIDDING" ? "Je moet eerst het aantal slagen voorspellen." : "Je bent nog niet aan de beurt.";
    renderGame();
    return;
  }
  const from = el.getBoundingClientRect();
  const index = game.actionCount();
  const error = game.play(code);
  if (!error) netSend(index, code);
  clearTransient();
  if (error) {
    message = error;
    if (error.startsWith("Je moet kleur bekennen")) tinekeComment("kleur bekennen", true);
    el.animate([{ translate: "0 0" }, { translate: "-6px 0" }, { translate: "6px 0" }, { translate: "0 0" }], { duration: 240 });
  } else {
    humanCardFrom = from;
    if (tinekeShown?.isHelp && !tinekeShown.wait) tinekeHide();
  }
  refresh();
  if (!error) saveGame();
  renderGame();
  drive();
}

function onTip() {
  if (humanBidding()) {
    hintBid = game.hintBid();
    message = `Tip: voorspel ${hintBid}.`;
  } else if (humanPlaying()) {
    hintCard = game.hintCard();
    if (hintCard) message = `Tip: speel de ${describeCard(hintCard)}.`;
  }
  renderGame();
}

async function onTableTap() {
  if (showLastTrick) {
    showLastTrick = false;
    renderGame();
    return;
  }
  if (st.phase === "TRICK_COMPLETE" && !busy && !tinekeWaiting) {
    stopDriver();
    await collectTrick();
    drive();
  }
}

function continueAfterRound() {
  if (st.phase !== "ROUND_COMPLETE") return;
  game.advance();
  refresh();
  saveGame();
  renderGame();
  drive();
}

function leaveGame() {
  stopDriver();
  tinekeHide();
  menuOpen = false;
  show("menu");
}

// ------------------------------------------------------------------------------------------
// Tineke
// ------------------------------------------------------------------------------------------

/** Laat Tineke iets zeggen. Bij wait=true pauzeert het spel tot je op Doorgaan tikt. */
function tinekeSay(text, { wait = false, isHelp = false } = {}) {
  if (screen !== "game") return Promise.resolve();
  if (tinekeWaiting && !wait) {
    // Eerst de lopende uitleg afmaken
    if (isHelp) tinekePending = { text, wait, isHelp };
    return Promise.resolve();
  }
  if (wait && tinekeShown?.isHelp && !tinekeShown.wait) tinekePending = tinekeShown;
  clearTimeout(tinekeTimer);
  tinekeShown = { text, wait, isHelp };
  const panel = $("#tineke-panel");
  panel.className = `tineke-panel ${isHelp ? "" : "comment"}`;
  $("#tineke-text").textContent = text;
  $("#tineke-actions").hidden = !isHelp;
  $("#tineke-ok").hidden = !wait;
  panel.hidden = false;
  panel.style.animation = "none";
  void panel.offsetWidth;
  panel.style.animation = "";
  $("#tineke .avatar").className = "avatar talking";
  setTimeout(() => { const a = $("#tineke .avatar"); if (a) a.className = "avatar"; }, Math.min(3000, 600 + text.length * 35));
  if (!isHelp) tinekeTimer = setTimeout(tinekeHide, 2400 + 80 * text.length);
  if (!wait) return Promise.resolve();
  return new Promise((resolve) => { tinekeWaiting = resolve; });
}

function tinekeHide() {
  clearTimeout(tinekeTimer);
  tinekeShown = null;
  $("#tineke-panel").hidden = true;
}

/** Doorgaan na een uitleg: het spel loopt weer, en een eerdere uitleg komt terug. */
function tinekeContinue() {
  const resolve = tinekeWaiting;
  tinekeWaiting = null;
  tinekeHide();
  if (tinekePending && screen === "game" && (humanBidding() || humanPlaying())) {
    const p = tinekePending;
    tinekePending = null;
    tinekeSay(p.text, p);
  }
  tinekePending = null;
  if (resolve) resolve();
  drive();
}

function tinekeHelp(event, extra = {}) {
  if (!settings.tinekeHelp || !st || online?.game) return Promise.resolve();
  const h = tineke.help(event, st, helpLevel, describeCard, extra);
  if (!h) return Promise.resolve();
  return tinekeSay(h.text, { wait: h.wait, isHelp: true });
}

function tinekeComment(event, always = false) {
  if (!st) return;
  // Tineke is er alleen als haar uitleg aan staat; dan zegt ze alleen iets bij de vaste momenten
  if (!settings.tinekeHelp || !always) return;
  const text = tineke.comment(event, st, tinekeOpinion);
  if (text) tinekeSay(text);
}

/** Uitleg zodra er iets nieuws gebeurt: jij moet bieden, een kaart kiezen, of een slag is vol. */
function onTurn() {
  if (!st) return;
  const key = `${st.round}|${st.phase}|${st.active}|${st.players.map((p) => p.cardCount).join("")}|${st.trickWinner}`;
  if (key === lastTurnKey) return;
  lastTurnKey = key;
  if (humanBidding()) {
    adviceBid = game.hintBid();
    tinekeHelp("voorspellen", { advice: adviceBid });
  } else if (humanPlaying()) {
    tinekeHelp("kies een kaart");
  } else if (st.phase === "TRICK_COMPLETE") {
    tinekeHelp("slag naar hoogste").then(() => drive());
  }
}

$("#tineke").innerHTML = `<div class="avatar">${faceSvg("tineke")}</div>`;
$("#tineke").addEventListener("click", () => {
  const texts = tineke.clickTexts();
  tinekeClick = tinekeClick % texts.length;
  tinekeSay(texts[tinekeClick++]);
});
$("#tineke-ok").addEventListener("click", tinekeContinue);
$("#tineke-skip").addEventListener("click", () => {
  settings.tinekeHelp = false;
  saveSettings();
  tinekeContinue();
  renderGame();
});

// ------------------------------------------------------------------------------------------
// Tekenen
// ------------------------------------------------------------------------------------------

const SUIT = ["", "♣︎", "♦︎", "♠︎", "♥︎"];
const LABEL = { 11: "B", 12: "V", 13: "H", 14: "A" };

function cardHtml(code, extra = "", style = "") {
  if (!code) return `<div class="card empty ${extra}" style="${style}"></div>`;
  const suit = Math.floor(code / 100);
  const rank = code % 100;
  const red = suit === 2 || suit === 4 ? "red" : "";
  const label = LABEL[rank] ?? String(rank);
  const sym = SUIT[suit];
  const mid = rank >= 11 && rank <= 13 ? `<span class="mid face">${label}</span>` : `<span class="mid">${sym}</span>`;
  return `<div class="card ${red} ${extra}" style="${style}" data-code="${code}">` +
    `<span class="ci tl"><b>${label}</b><i>${sym}</i></span>${mid}<span class="ci br"><b>${label}</b><i>${sym}</i></span></div>`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Het gekozen plaatje van een mens aan tafel: een emoji, een foto of anders de eerste letter. */
function customAvatar(nr) {
  const p = st?.players[nr - 1];
  if (!p?.human) return null;
  if (online) return online.players.find((x) => x.seat === p.seat)?.avatar ?? null;
  return cleanAvatar(settings.avatar);
}

function humanAvatarHtml(avatar, name) {
  if (avatar?.startsWith("data:image/")) return `<img class="face-img" src="${esc(avatar)}" alt="">`;
  if (avatar && AVATAR_EMOJIS.includes(avatar)) return emojiSvg(avatar);
  return initialSvg(name);
}

function avatarHtml(nr, name, mood = "") {
  const face = faceFor(nr);
  const svg = face ? faceSvg(face) : humanAvatarHtml(customAvatar(nr), name);
  return `<div class="avatar ${mood}" data-who="${face ?? "mens"}">${svg}</div>`;
}

const seatsKey = () => st.players.map((p, i) => {
  const av = customAvatar(i + 1) ?? "";
  return `${p.name}|${p.human}|${p.seat}|${av.length}${av.slice(-24)}`;
}).join(",");

/** Stoelen één keer opbouwen, zodat de gezichten blijven knipperen en praten tussen de beurten door. */
/** Plaats op het scherm per stoel, bij twee tot vijf spelers. */
const SEAT_POS = {
  2: ["", "south", "north"],
  3: ["", "south", "west", "east"],
  4: ["", "south", "west", "north", "east"],
  5: ["", "south", "west", "north nw", "north ne", "east"],
};

function buildSeats() {
  const n = st.players.length;
  $("#arena").classList.toggle("two", n === 2);
  $("#arena").classList.toggle("three", n === 3);
  $("#arena").classList.toggle("five", n === 5);
  for (let nr = 2; nr <= 5; nr++) {
    $(`#seat-${nr}`).hidden = nr > n;
    $(`#table .tcard.s${nr}`).hidden = nr > n;
  }
  for (let nr = 1; nr <= n; nr++) {
    const el = $(`#seat-${nr}`);
    el.className = `seat ${SEAT_POS[n][nr]}`;
    el.innerHTML = `
      ${avatarHtml(nr, st.players[nr - 1].name)}
      <div class="info">
        <div class="who"><span class="nm"></span><small class="tot"></small></div>
        <div class="chip"><span class="c bid"><small>bod</small><b></b></span><span class="c got"><small>slagen</small><b></b></span></div>
        <span class="nat" hidden>nat</span>
      </div>
`;
    el.querySelector(".avatar").insertAdjacentHTML("beforeend",
      `<span class="order" hidden></span><span class="lead" hidden>uit</span><svg class="turn-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m0 0 6-6m-6 6 6 6"/></svg>`);
  }
  $("#seat-1").dataset.key = seatsKey();
}

/** Heeft deze speler al voorspeld (tijdens het voorspellen) of al een kaart opgelegd (tijdens de slag)? */
function hasHadTurn(nr) {
  if (st.active === nr || talkingUntil[nr] > Date.now()) return false;
  if (st.phase === "BIDDING") return st.players[nr - 1].bid >= 0;
  if (st.phase === "PLAYING") return st.table[nr - 1] !== 0;
  return false;
}

function moodFor(nr) {
  const p = st.players[nr - 1];
  if (talkingUntil[nr] > Date.now()) return "talking";
  if (st.phase !== "BIDDING" && isWet(p)) return "sad";
  if (st.phase === "ROUND_COMPLETE" && p.tricks === p.bid) return "happy";
  return "";
}

function updateSeats() {
  if (!st) return;
  if ($("#seat-1").dataset.key !== seatsKey() || !$("#seat-1 .avatar")) buildSeats();
  for (let nr = 1; nr <= st.players.length; nr++) {
    const p = st.players[nr - 1];
    const el = $(`#seat-${nr}`);
    el.classList.toggle("active", st.active === nr);
    el.classList.toggle("done", hasHadTurn(nr));
    const avatar = el.querySelector(".avatar");
    avatar.className = `avatar ${moodFor(nr)} ${st.active === nr ? "active" : ""}`;
    el.querySelector(".lead").hidden = st.leader !== nr || st.phase === "ROUND_COMPLETE" || st.phase === "GAME_OVER";
    el.querySelector(".nm").textContent = p.name;
    el.querySelector(".tot").textContent = `${p.total} pt`;
    el.querySelector(".bid b").textContent = p.bid >= 0 ? p.bid : "–";
    const got = el.querySelector(".got");
    got.querySelector("b").textContent = p.tricks;
    const wet = isWet(p);
    got.classList.toggle("wet", wet);
    got.classList.toggle("ok", !wet && p.bid >= 0 && p.tricks === p.bid);
    el.querySelector(".nat").hidden = !(wet && st.phase !== "BIDDING");
    if (p.tricks !== previousTricks[nr]) {
      previousTricks[nr] = p.tricks;
      const chip = el.querySelector(".chip");
      chip.classList.remove("pop");
      void chip.offsetWidth;
      chip.classList.add("pop");
    }
  }
}

function showBubble(nr, html, ms, sad = false) {
  if (screen !== "game") return;
  const avatar = $(`#seat-${nr} .avatar`);
  if (!avatar) return;
  const layer = $("#flyers");
  const r = avatar.getBoundingClientRect();
  const b = document.createElement("div");
  b.className = `bubble ${sad === true ? "sad" : sad || ""}`;
  b.innerHTML = html;
  layer.appendChild(b);
  const bw = b.offsetWidth;
  const bh = b.offsetHeight;
  let x;
  let y;
  if (nr === 1) { x = r.left + r.width / 2 - bw / 2; y = r.top - bh - 8; }
  else if (nr === 2) { x = r.right + 6; y = r.top; }
  else if (nr === 3) { x = r.left + r.width / 2 - bw / 2; y = r.bottom + 6; }
  else { x = r.left - bw - 6; y = r.top; }
  x = Math.max(6, Math.min(window.innerWidth - bw - 6, x));
  b.style.left = `${x}px`;
  b.style.top = `${y}px`;
  setTimeout(() => {
    b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).finished.then(() => b.remove());
  }, ms);
}

function seatCenter(nr) {
  const r = $(`#seat-${nr} .avatar`).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Laat een nieuw opgelegde kaart van de speler naar de tafel vliegen. */
function animateFlyIn(slotEl, nr) {
  const card = slotEl.querySelector(".card");
  if (!card || reducedMotion) return;
  const to = card.getBoundingClientRect();
  let from;
  if (nr === 1 && humanCardFrom) {
    from = { x: humanCardFrom.left + humanCardFrom.width / 2, y: humanCardFrom.top + humanCardFrom.height / 2, s: humanCardFrom.width / to.width };
  } else {
    const c = seatCenter(nr);
    from = { ...c, s: 0.4 };
  }
  const dx = from.x - (to.left + to.width / 2);
  const dy = from.y - (to.top + to.height / 2);
  card.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${from.s}) rotate(${nr === 1 ? 0 : (nr - 3) * 20}deg)`, opacity: nr === 1 ? 1 : 0.4 },
      { transform: "none", opacity: 1 },
    ],
    { duration: animMs(360), easing: "cubic-bezier(.2,.8,.25,1)" },
  );
}

/** De kaarten van de slag schuiven samen naar de winnaar. */
async function animateCollect(winner) {
  const cards = $$("#table .tcard .card:not(.empty)");
  if (!cards.length || !winner) return;
  const target = seatCenter(winner);
  const felt = $("#table").getBoundingClientRect();
  const mid = { x: felt.left + felt.width / 2, y: felt.top + felt.height / 2 };
  const anims = cards.map((card, i) => {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return card.animate(
      [
        { transform: "none", opacity: 1, offset: 0 },
        { transform: `translate(${mid.x - cx}px, ${mid.y - cy}px) rotate(${(i - 1.5) * 6}deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${target.x - cx}px, ${target.y - cy}px) scale(.3)`, opacity: 0, offset: 1 },
      ],
      { duration: animMs(650), easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" },
    ).finished;
  });
  setTimeout(() => {
    const plus = document.createElement("div");
    plus.className = "plus-one";
    plus.textContent = "+1";
    plus.style.left = `${target.x}px`;
    plus.style.top = `${target.y - 40}px`;
    $("#flyers").appendChild(plus);
    setTimeout(() => plus.remove(), 1000);
  }, animMs(420));
  await Promise.all(anims).catch(() => {});
}

/**
 * Zolang er voorspeld wordt staat de troef groot midden op tafel. Heeft iedereen voorspeld, dan schuift hij
 * kleiner wordend naar zijn vaste plek rechtsboven.
 */
function renderTrumpBig() {
  const el = $("#trump-big");
  const corner = $("#g-trump");
  if (st.phase === "BIDDING" && !showLastTrick) {
    const key = `${st.round}|${st.trump}`;
    corner.style.visibility = "hidden";
    if (el.dataset.key === key && !el.hidden) return;
    el.dataset.key = key;
    el.getAnimations().forEach((a) => a.cancel());
    el.innerHTML = `<small>Troef</small>${st.trump
      ? cardHtml(st.trump, "", "--w:calc(var(--tw, 56px) * 1.5)")
      : `<div class="none">Geen<br>troef</div>`}`;
    el.hidden = false;
    el.animate(
      [{ transform: "translate(-50%, -50%) scale(.3) rotate(-25deg)", opacity: 0 }, { transform: "translate(-50%, -50%)", opacity: 1 }],
      { duration: animMs(500), easing: "cubic-bezier(.2, .9, .3, 1.25)" },
    );
    return;
  }
  if (el.hidden) { corner.style.visibility = ""; return; }
  if (el.dataset.key === "leaving") return;
  el.dataset.key = "leaving";
  const from = el.getBoundingClientRect();
  const to = corner.getBoundingClientRect();
  if (reducedMotion || !to.width || !from.width) { el.hidden = true; corner.style.visibility = ""; return; }
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = el.animate(
    [{ transform: "translate(-50%, -50%)" },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${to.width / from.width})` }],
    { duration: animMs(700), easing: "cubic-bezier(.5, 0, .3, 1)", fill: "forwards" },
  );
  anim.onfinish = () => {
    el.hidden = true;
    el.dataset.key = "";
    anim.cancel();
    corner.style.visibility = "";
  };
}

/**
 * Tijdens het voorspellen: een nummer bij iedereen (de volgorde, met de klok mee vanaf wie uitkomt) en
 * pijlen over de rand van de tafel van speler naar speler. Wie al voorspeld heeft krijgt een vinkje.
 */
function renderBidOrder() {
  const svg = $("#bid-order");
  const n = st.players.length;
  const show = st.phase === "BIDDING" && !showLastTrick;
  const order = Array.from({ length: n }, (_, i) => (st.leader - 1 + i) % n + 1);
  order.forEach((nr, i) => {
    const badge = $(`#seat-${nr} .order`);
    if (!badge) return;
    badge.hidden = !show;
    const done = st.players[nr - 1].bid >= 0;
    badge.textContent = done ? "✓" : String(i + 1);
    badge.className = `order ${done ? "done" : nr === st.active ? "now" : ""}`;
  });
  // Een svg-element kent de eigenschap hidden niet; daarom het attribuut zelf zetten
  if (!show) { svg.setAttribute("hidden", ""); svg.dataset.key = ""; return; }
  const felt = $("#table").getBoundingClientRect();
  const states = order.map((nr) => (st.players[nr - 1].bid >= 0 ? "done" : nr === st.active ? "now" : "todo"));
  const key = `${Math.round(felt.width)}x${Math.round(felt.height)}|${order}|${states}`;
  if (svg.dataset.key === key && !svg.hasAttribute("hidden")) return;
  svg.dataset.key = key;
  svg.removeAttribute("hidden");
  const w = felt.width;
  const h = felt.height;
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 20;
  const ry = h / 2 - 20;
  // Hoek van elke speler gezien vanuit het midden van de tafel (met de klok mee wordt de hoek groter)
  const angle = (nr) => {
    const r = $(`#seat-${nr} .avatar`).getBoundingClientRect();
    return Math.atan2((r.top + r.height / 2 - felt.top - cy) / ry, (r.left + r.width / 2 - felt.left - cx) / rx);
  };
  let paths = "";
  for (let i = 0; i < n - 1; i++) {
    let a0 = angle(order[i]);
    let a1 = angle(order[i + 1]);
    while (a1 <= a0) a1 += 2 * Math.PI;
    const gap = Math.min(0.32, (a1 - a0) / 5);
    a0 += gap;
    a1 -= gap;
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const a = a0 + ((a1 - a0) * k) / 24;
      pts.push(`${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`);
    }
    const s = states[i + 1];
    paths += `<path class="${s}" d="M${pts.join("L")}" marker-end="url(#bo-head-${s})"/>`;
  }
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.innerHTML = `<defs>${["done", "now", "todo"].map((s) =>
    `<marker id="bo-head-${s}" class="${s}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker>`).join("")}</defs>${paths}`;
}
window.addEventListener("resize", () => { if (screen === "game" && st) { $("#bid-order").dataset.key = ""; renderBidOrder(); } });

function renderGame() {
  if (!st) return;
  // Tineke staat alleen aan tafel als je haar uitleg wilt (niet bij samen spelen)
  const tinekeOn = settings.tinekeHelp && !online?.game;
  $("#tineke").hidden = !tinekeOn;
  if (!tinekeOn) $("#tineke-panel").hidden = true;
  $("#g-round").textContent = `Ronde ${st.round} van ${st.rounds}`;
  $("#g-cards").textContent = `${st.cards} ${st.cards === 1 ? "kaart" : "kaarten"} · ${st.variant}`;
  $("#g-over").textContent = st.tricksOver;
  $("#g-trump").innerHTML = st.trump ? cardHtml(st.trump, "small", "--w:30px") : `<div class="none">geen<br>troef</div>`;

  updateSeats();
  renderTrumpBig();
  renderBidOrder();

  // Tafel: alleen veranderde plekken opnieuw tekenen, zodat nieuwe kaarten kunnen invliegen
  const last = showLastTrick && st.lastTrickWinner !== 0;
  const cards = last ? st.lastTrick : st.table;
  const winner = last ? st.lastTrickWinner : st.trickWinner;
  $$("#table .tcard").forEach((el, i) => {
    const code = cards[i];
    const key = `${code}|${winner === i + 1 ? 1 : 0}|${last ? 1 : 0}`;
    if (el.dataset.key === key) return;
    const isNew = !last && code && code !== previousTable[i];
    el.dataset.key = key;
    el.innerHTML = cardHtml(code, winner === i + 1 ? "hl" : "");
    if (isNew) animateFlyIn(el, i + 1);
  });
  if (!last) previousTable = st.table.slice();
  humanCardFrom = null;
  $("#table-label").hidden = !last;

  // Statusregel
  let text = message;
  if (!text) {
    if (humanBidding()) text = ""; // de vraag staat boven de knoppen
    else if (humanPlaying()) text = "Jij bent aan de beurt. Kies een kaart.";
    else if (remoteTurn()) {
      const p = st.players[st.active - 1];
      const off = online.players.find((x) => x.seat === p.seat)?.online === false;
      text = off ? `${p.name} heeft geen verbinding. Wachten tot ${p.name} terug is…` : `Wachten op ${p.name}…`;
    }
    else if (st.phase === "TRICK_COMPLETE") text = `${st.status} Tik op tafel om door te gaan.`;
    else text = st.status;
  }
  const status = $("#g-status");
  status.textContent = text;
  status.classList.toggle("msg", !!message);
  $("#btn-tip").hidden = !(humanBidding() || humanPlaying());

  // Voorspellen
  const bids = $("#bids");
  if (humanBidding()) {
    let html = `<p class="bids-q">Hoeveel slagen denk je te halen?</p>`;
    for (let n = 0; n <= st.cards; n++) {
      const forbidden = n === st.forbiddenBid;
      html += `<button data-bid="${n}" class="${forbidden ? "forbidden" : ""} ${n === hintBid ? "hint" : ""}" ${forbidden ? "disabled" : ""}>${n}</button>`;
    }
    if (st.forbiddenBid >= 0) html += `<p>Rondmaken is niet toegestaan: je mag geen ${st.forbiddenBid} zeggen.</p>`;
    bids.innerHTML = html;
    bids.hidden = false;
  } else {
    bids.innerHTML = "";
    bids.hidden = true;
  }

  // Hand
  const hand = sortHand(st.hand);
  const playing = humanPlaying();
  $("#hand").innerHTML = hand
    .map((c) => cardHtml(c.code, `${playing && !c.legal ? "dim" : ""} ${playing && c.legal ? "up" : ""} ${c.code === hintCard ? "hl" : ""}`))
    .join("");

  // Menu
  $("#gamemenu").hidden = !menuOpen;
  const lt = $("#btn-lasttrick");
  lt.disabled = st.lastTrickWinner === 0;
  lt.textContent = showLastTrick ? "Huidige slag tonen" : "Laatste slag tonen";

  layout();
  renderSidebar();
  renderDialog();
}

/** Kaartgroottes aanpassen aan het scherm. */
function layout() {
  if (screen !== "game" || !st) return;
  $("#g-round").textContent = window.innerWidth < 380 ? `Ronde ${st.round}/${st.rounds}` : `Ronde ${st.round} van ${st.rounds}`;
  const width = $("#game").clientWidth;
  const handEl = $("#hand");
  const cards = Array.from(handEl.children);
  const n = cards.length;
  const wide = isWide();
  const maxW = wide ? Math.min(118, Math.max(74, window.innerHeight / 8.5)) : 74;
  const available = Math.min(width - 24, wide ? 1000 : 640);
  const hw = n <= 1 ? maxW : Math.min(maxW, available / (0.58 * (n - 1) + 1));
  const spacing = n <= 1 ? 0 : Math.min(hw + 6, (available - hw) / (n - 1));
  handEl.style.setProperty("--hw", `${hw}px`);
  handEl.style.width = `${n === 0 ? 0 : hw + spacing * (n - 1)}px`;
  const playing = humanPlaying();
  const fan = Math.min(3.5, 26 / Math.max(n, 1));
  cards.forEach((el, i) => {
    const off = i - (n - 1) / 2;
    const lift = el.classList.contains("up") ? 14 : 0;
    el.style.left = `${spacing * i}px`;
    el.style.transform = `translateY(${Math.abs(off) * Math.abs(off) * 0.9 - lift}px) rotate(${off * fan}deg)`;
    el.style.zIndex = String(i);
    if (!playing) el.style.cursor = "default";
  });

  const felt = $("#table");
  const tw = Math.max(30, Math.min(wide ? 124 : 74, felt.clientWidth / 3.5, felt.clientHeight / (1.42 * 2.45)));
  felt.style.setProperty("--tw", `${tw}px`);
}
window.addEventListener("resize", layout);

function renderDialog() {
  const overlay = $("#dialog");
  const box = $("#dialog-box");
  let html = null;
  let cls = "dialog";
  if (confirmDialog) {
    html = `<h3>${confirmDialog.title}</h3><p>${confirmDialog.text}</p><div class="actions">
      <button data-action="confirm-no">${confirmDialog.no}</button>
      <button class="primary" data-action="confirm-yes">${confirmDialog.yes}</button></div>`;
  } else if (screen === "game" && st && showScores) {
    cls = "dialog sheet";
    html = scoreSheetHtml();
  } else if (screen === "game" && st && st.phase === "ROUND_COMPLETE" && !busy) {
    html = roundResultHtml();
  } else if (screen === "game" && st && st.phase === "GAME_OVER" && !celebrating) {
    html = gameOverHtml();
  }
  const key = html === null ? "" : `${cls}|${html}`;
  if (overlay.dataset.key === key) return;
  overlay.dataset.key = key;
  overlay.hidden = html === null;
  if (html !== null) {
    box.className = cls;
    box.innerHTML = html;
  }
}

function roundResultHtml() {
  const r = st.round - 1;
  const rows = st.players.map((p, i) => {
    const [bid, tricks, score, crossed, good] = p.rounds[r];
    const pts = good ? `+${score}` : crossed ? "0" : `+${score}`;
    const mood = good ? "happy" : "sad";
    return `<div class="result-row ${i === 0 ? "me" : ""}">${avatarHtml(i + 1, p.name, mood)}
      <div class="name">${esc(p.name)}<small>bod ${bid} · ${tricks} ${tricks === 1 ? "slag" : "slagen"}</small></div>
      <div class="pts ${good ? "good" : "bad"}">${pts}</div><div class="tot">${p.total}</div></div>`;
  }).join("");
  const h = settings.tinekeHelp ? tineke.help("score", st, helpLevel, describeCard) : null;
  return `<h3>Ronde ${st.round} is afgelopen</h3>${h ? tinekeLine(h.text) : ""}<div class="result-rows">${rows}</div>
    <div class="actions"><button data-action="scores">Scorelijst</button>
    <button class="primary" data-action="next-round">${st.round === st.rounds ? "Uitslag" : "Volgende ronde"}</button></div>`;
}

/** Klein Nederlands vlaggetje bij de winnaar in de eindstand. */
const NL_FLAG = `<svg class="nl-flag" viewBox="0 0 9 6" role="img" aria-label="winnaar"><rect width="9" height="2" fill="#AE1C28"/><rect y="2" width="9" height="2" fill="#FFFFFF"/><rect y="4" width="9" height="2" fill="#21468B"/></svg>`;
const winnerFlag = (p) => (st.phase === "GAME_OVER" && p.rank === 1 ? NL_FLAG : "");

function gameOverHtml() {
  const me = st.players[0];
  const title = { 1: "Gewonnen!", 2: "Tweede plaats", 3: "Derde plaats", 4: "Vierde plaats" }[me.rank] ?? "Vijfde plaats";
  const ranking = st.players.map((p, i) => ({ ...p, nr: i + 1 })).sort((a, b) => a.rank - b.rank);
  const rows = ranking.map((p) => `<div class="result-row ${p.nr === 1 ? "me" : ""}">
      ${avatarHtml(p.nr, p.name, p.rank === 1 ? "happy" : p.rank === st.players.length ? "sad" : "")}
      <div class="name">${esc(p.name)}${winnerFlag(p)}</div><div class="rank">${p.rank}e</div><div class="tot">${p.total}</div></div>`).join("");
  const hs = highScorePlace > 0 ? `<p class="gold">Je staat op plaats ${highScorePlace} in de highscore van ${esc(st.variant)}.</p>` : "";
  const say = settings.tinekeHelp ? endComment ??= tineke.comment("afgelopen", st) : null;
  return `<h3>${title}</h3>${say ? tinekeLine(say) : ""}<div class="result-rows">${rows}</div>${hs}
    <div class="actions"><button data-action="scores">Scorelijst</button>
    <button data-action="menu">Menu</button>
    ${!online?.game ? `<button class="primary" data-action="new-game">Nieuw spel</button>`
      : online.role === "host" ? `<button class="primary" data-action="new-online">Nog een spel</button>` : ""}</div>`;
}

let endComment = null;
const tinekeLine = (text) => `<div class="tineke-line">${faceAvatar("tineke", "happy")}<p>${esc(text)}</p></div>`;
const faceAvatar = (who, mood = "") => `<div class="avatar ${mood}">${faceSvg(who)}</div>`;

/** Groot scherm (desktop): grotere kaarten en altijd de scorelijst ernaast. */
const wideQuery = window.matchMedia("(min-width: 1000px) and (min-height: 640px)");
const isWide = () => wideQuery.matches;
wideQuery.addEventListener?.("change", () => { if (screen === "game") { buildSeats(); renderGame(); } });

function renderSidebar() {
  const el = $("#sidebar");
  if (!isWide()) { if (el.innerHTML) el.innerHTML = ""; return; }
  const html = `<h3>Scorelijst</h3><div class="scroll">${sheetTableHtml()}</div>
    <p class="legend">Klein doorgestreept getal: de voorspelling klopte niet.</p>`;
  if (el.dataset.key === html) return;
  el.dataset.key = html;
  el.innerHTML = html;
  el.querySelector("tr.current")?.scrollIntoView({ block: "center" });
}

function scoreSheetHtml() {
  return `<h3>Scorelijst · ${esc(st.variant)}</h3>
    <div class="scroll">${sheetTableHtml()}</div>
    <p class="legend">Klein doorgestreept getal: de voorspelling klopte niet.</p>
    <div class="actions"><button class="primary" data-action="close-scores">Sluiten</button></div>`;
}

function sheetTableHtml() {
  const head = st.players.map((p) => `<th>${esc(p.name)}${winnerFlag(p)}</th>`).join("");
  let rows = "";
  for (let r = 1; r <= st.rounds; r++) {
    const cells = st.players.map((p) => {
      const [bid, , score, crossed, good] = p.rounds[r - 1];
      // Een goede voorspelling staat niet apart: alleen een foute voorspelling wordt doorgestreept getoond
      if (score >= 0) return `<td>${good ? "" : `<span class="b bad">${bid}</span>`}${crossed ? "" : score}</td>`;
      if (r === st.round && p.bid >= 0) return `<td><span class="b open">${p.bid}</span></td>`;
      return `<td></td>`;
    }).join("");
    rows += `<tr class="${r === st.round ? "current" : ""}"><td>${r} (${cardsInRound(r)})</td>${cells}</tr>`;
  }
  const totals = st.players.map((p) => `<td>${p.total}${winnerFlag(p)}</td>`).join("");
  return `<table><tr><th>Ronde</th>${head}</tr>${rows}<tr class="total"><td>Totaal</td>${totals}</tr></table>`;
}

/**
 * Kleuren in de hand zo ordenen dat rood en zwart elkaar afwisselen: ruiten niet naast harten en
 * schoppen niet naast klaveren, als dat kan met de kleuren die je hebt.
 */
function suitOrder(suits) {
  const red = (s) => s === 2 || s === 4;
  const perms = (list) => list.length <= 1 ? [list] :
    list.flatMap((x, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest]));
  let best = null;
  let bestClash = Infinity;
  for (const order of perms(suits)) {
    let clash = 0;
    for (let i = 1; i < order.length; i++) if (red(order[i]) === red(order[i - 1])) clash++;
    if (clash < bestClash) { best = order; bestClash = clash; }
  }
  return best;
}

function sortHand(cards) {
  const suits = [...new Set(cards.map((c) => Math.floor(c.code / 100)))].sort();
  const pos = new Map(suitOrder(suits).map((s, i) => [s, i]));
  const dir = settings.sortDescending ? -1 : 1;
  return cards.slice().sort((a, b) =>
    pos.get(Math.floor(a.code / 100)) - pos.get(Math.floor(b.code / 100)) || dir * ((a.code % 100) - (b.code % 100)));
}

function cardsInRound(r) {
  const max = (st.rounds + 1) / 2;
  return max - Math.abs(r - max);
}

// ------------------------------------------------------------------------------------------
// Schermen
// ------------------------------------------------------------------------------------------

function show(name) {
  screen = name;
  $$(".screen").forEach((el) => el.classList.toggle("active", el.id === name));
  if (name === "menu") renderMenu();
  if (name === "newgame") renderNewGame();
  if (name === "highscores") renderHighScores();
  if (name === "settings") renderSettings();
  if (name === "online") renderOnline();
  if (name === "online" || name === "settings") renderAvatarPick();
  if (name !== "game" && name !== "online" && chatOpen) { chatOpen = false; }
  renderChat();
  if (name === "game") {
    buildSeats();
    previousTable = [0, 0, 0, 0, 0];
    $$("#table .tcard").forEach((el) => { el.dataset.key = ""; });
    renderGame();
    previousTable = st.table.slice();
  }
  renderDialog();
}

function renderMenu() {
  const inProgress = hasGameInProgress();
  $("#btn-resume").hidden = !inProgress;
  $("#btn-new").className = inProgress ? "" : "primary";
}

function rulesVariantName(rules) {
  const tien = rules.wrongScoresZero && rules.penaltyPerTrick === 0 && rules.roundingAllowed && !rules.mustTrump &&
    rules.pointsPerTrick === 1;
  const boeren = rules.penaltyPerTrick > 0 && !rules.roundingAllowed && !rules.mustTrump;
  const m = rules.maxCards;
  if (tien) return m === 10 ? "10 op en neer" : `10 op en neer tot ${m}`;
  if (boeren) return m === 13 ? "Boerenbridge" : `Boerenbridge tot ${m}`;
  return `Hybride (${rules.roundingAllowed ? "r" : "nr"}${rules.mustTrump ? ", iv" : ""})${m !== 10 && m !== 13 ? ` tot ${m}` : ""}`;
}

/** Hoogste aantal kaarten dat kan: 52 kaarten moeten genoeg zijn voor iedereen. */
const maxCardsFor = (base, players) => Math.min(base.maxCards, Math.floor(52 / players));
const newMaxCards = () => Math.min(newMax ?? newBase.maxCards, maxCardsFor(newBase, newPlayers));
const newRules = () => ({
  ...newBase, maxCards: newMaxCards(), players: newPlayers, roundingAllowed: newRounding, mustTrump: newMustTrump,
});

let newOnline = false; // wordt het nieuwe spel een tafel voor samen spelen?

function renderNewGame() {
  $("#newgame h2").textContent = newOnline ? "Tafel openen" : "Nieuw spel";
  $("#btn-start").textContent = newOnline ? "Tafel openen" : "Start";
  $$(".variant").forEach((el) => el.classList.toggle("selected", (el.dataset.variant === "13") === (newBase === BOERENBRIDGE)));
  $$("#opt-players button").forEach((b) => b.classList.toggle("selected", Number(b.dataset.players) === newPlayers));
  $("#players-note").textContent = newOnline
    ? `Tot ${newPlayers} mensen kunnen aanschuiven. Je kiest bij het starten of lege plaatsen computerspelers worden.`
    : newPlayers === 5
      ? `Ria doet als vijfde mee.${newBase === BOERENBRIDGE ? " Boerenbridge gaat dan tot hoogstens 10 kaarten." : ""}`
      : newPlayers === 2 ? "Jij tegen Henk." : newPlayers === 3 ? "Jij tegen Henk en Truus." : "";
  const slider = $("#opt-max");
  slider.max = String(maxCardsFor(newBase, newPlayers));
  slider.value = String(newMaxCards());
  $("#max-label").textContent = `${newMaxCards()}`;
  const rounds = 2 * newMaxCards() - 1;
  $("#max-note").textContent = `1 tot en met ${newMaxCards()} kaarten en weer terug: ${rounds} rondes.`;
  $("#opt-smart").checked = settings.smart;
  $("#opt-rounding").checked = newRounding;
  $("#opt-musttrump").checked = newMustTrump;
  $("#variant-name").textContent = `Je speelt: ${rulesVariantName(newRules())}`;
}

function renderHighScores() {
  $$("#hs-tabs button").forEach((b) => b.classList.toggle("selected", b.dataset.tab === hsTab));
  const list = loadHighScores(hsTab);
  $("#hs-list").innerHTML = list.length === 0
    ? `<p class="empty-note">Nog geen scores. Speel een spel uit om in de lijst te komen.</p>`
    : list.map((h, i) => `<div class="hs-row"><span class="pos">${i + 1}</span><span class="name">${esc(h.name)}</span><span class="date">${h.date}</span><span class="score">${h.score}</span></div>`).join("");
  $("#btn-hs-clear").hidden = list.length === 0;
}

// ------------------------------------------------------------------------------------------
// Eigen plaatje
// ------------------------------------------------------------------------------------------

const myAvatar = () => cleanAvatar(settings.avatar);

const CAMERA_SVG = `<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.1)"/>
  <path d="M30 40h9l5-7h12l5 7h9v28H30z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="50" cy="54" r="8" fill="none" stroke="currentColor" stroke-width="4"/></svg>`;

function renderAvatarPick() {
  const cur = myAvatar() ?? "";
  const photo = cur.startsWith("data:image/");
  const opt = (value, html, sel, label) =>
    `<button type="button" class="av-opt ${sel ? "sel" : ""}" data-av="${value}" aria-label="${label}">${html}</button>`;
  const html = [
    opt("", initialSvg(settings.playerName), !cur, "Eerste letter van je naam"),
    ...AVATAR_EMOJIS.map((e) => opt(e, emojiSvg(e), cur === e, e)),
    opt("foto", photo ? humanAvatarHtml(cur, "") : CAMERA_SVG, photo, "Eigen foto kiezen"),
  ].join("");
  $$(".avatar-pick").forEach((el) => { el.innerHTML = html; });
}

function setAvatar(v) {
  settings.avatar = cleanAvatar(v);
  saveSettings();
  online?.link?.setAvatar?.(settings.avatar);
  renderAvatarPick();
  if (st && screen === "game") renderGame();
}

/** Maakt van een foto een klein vierkant plaatje, zodat het snel naar de anderen gaat. */
function photoAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 128;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("geen plaatje")); };
    img.src = url;
  });
}

document.addEventListener("click", (e) => {
  const b = e.target.closest(".av-opt");
  if (!b) return;
  if (b.dataset.av === "foto") $("#avatar-file").click();
  else setAvatar(b.dataset.av || null);
});
$("#avatar-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  try {
    setAvatar(await photoAvatar(file));
  } catch {
    alert("Deze foto kon niet worden geopend. Probeer een andere.");
  }
});

function renderSettings() {
  $("#set-name").value = settings.playerName;
  $("#set-speed").value = settings.speed;
  $("#set-desc").checked = settings.sortDescending;
  $("#set-sound").checked = settings.sound;
  $("#set-speak").checked = settings.speakBids;
  $("#row-speak").hidden = !settings.sound;
  $("#set-help").checked = settings.tinekeHelp;
}

const RULES_TEXT = [
  ["Doel van het spel", "Haal zoveel mogelijk punten, en meer dan je drie tegenspelers. Het leuke van dit spel is dat je ook met slechte kaarten kunt winnen."],
  ["Ronden", "Ieder krijgt in de eerste ronde 1 kaart, in de volgende ronde 2, enzovoort tot en met 10 kaarten. Daarna weer 9, 8, enzovoort tot en met 1. Vandaar de naam: in totaal zijn er 19 ronden. Bij Boerenbridge gaat het tot 13 kaarten (25 ronden); in de ronde met 13 kaarten is er geen troef."],
  ["Troef", "Aan het begin van elke ronde wordt een kaart van de stapel omgedraaid. De kleur van die kaart is troef. Je ziet hem rechtsboven in beeld."],
  ["Voorspellen", "Aan het begin van elke ronde zegt iedere speler hoeveel slagen hij denkt te halen. Bij elke speler zie je steeds twee cijfers: het bod en het aantal slagen dat hij al heeft. Wordt het slagen-cijfer rood, dan is die speler nat: hij kan zijn voorspelling niet meer halen. Bovenin zie je of er in totaal slagen over zijn of te weinig."],
  ["Rondmaken", "Als rondmaken niet is toegestaan (zoals bij Boerenbridge), mag de laatste speler niet zo voorspellen dat het totaal van alle voorspellingen gelijk is aan het aantal kaarten. Dan haalt er altijd minstens één speler zijn voorspelling niet."],
  ["Kaarten opleggen", "De speler met het label \"uit\" komt uit: hij legt als eerste een kaart op. Daarna legt de volgende speler (met de klok mee) een kaart bij. Je moet kleur bekennen: als je een kaart hebt van de kleur die is uitgekomen, moet je die spelen. Kun je geen kleur bekennen, dan mag je elke kaart spelen (bij verplicht introeven moet je dan troef spelen als je die hebt)."],
  ["Een slag halen", "Als alle vier de spelers een kaart hebben opgelegd, krijgt de hoogste kaart de slag. De volgorde is 2 tot en met 10, boer, vrouw, heer, aas. Een kaart van een andere kleur dan die is uitgekomen is altijd lager, behalve troef: troef is hoger dan alle andere kleuren. Wie de slag haalt, moet daarna uitkomen."],
  ["Voorbeeld", "Harten is troef. Speler 1 komt uit met klaver heer. Speler 2 legt schoppen aas bij (dat mag, want hij heeft geen klaver). Speler 3 legt klaver vijf (hij heeft klaver en moet dus kleur bekennen). Speler 4 legt harten twee (een troef; dat mag, want hij heeft geen klaver). De slag gaat naar speler 4."],
  ["Punten bij 10 op en neer", "Haal je precies het aantal slagen dat je voorspeld hebt, dan krijg je 10 punten plus 1 punt per slag. Lukt dat niet, dan krijg je niets. Een score van 170 is zeer goed, boven de 200 is bijna niet te halen."],
  ["Punten bij Boerenbridge", "Goed voorspeld: 10 punten plus 3 punten per slag. Fout voorspeld: 10 punten min 3 punten per slag verschil (niet lager dan 0)."],
  ["Sterke computerspelers", "Met deze instelling rekenen Henk, Truus en Kees bij elke beslissing een groot aantal mogelijke verdelingen van de kaarten door. Ze spelen dan slimmer dan in het originele spel. Zet je hem uit, dan spelen ze precies zoals in het origineel."],
  ["Tips", "Tik op Tip om te zien wat de computer zou doen. Tik op de tafel om een volle slag meteen binnen te halen. Via het menu linksboven kun je de laatste slag nog eens bekijken."],
  ["Op je beginscherm", "Op een iPhone of iPad: open deze pagina in Safari, tik op Deel en kies Zet op beginscherm. Op Android: kies in het menu van Chrome Toevoegen aan startscherm. Daarna start het spel als een gewone app en werkt het ook zonder internet."],
  ["Over dit spel", "Gebaseerd op het Windows-spel \"10 op en neer\" van A.A. Brink (sourceforge.net/projects/tienopenneer). Vrije software onder de GNU General Public License versie 3."],
];
$("#rules-text").innerHTML = RULES_TEXT.map(([h, b]) => `<h3>${h}</h3><p>${b}</p>`).join("");

// ------------------------------------------------------------------------------------------
// Samen spelen via internet
// ------------------------------------------------------------------------------------------

const clientId = () => {
  if (!settings.clientId) {
    settings.clientId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    saveSettings();
  }
  return settings.clientId;
};

/** In de Android-app draait de website vanuit de app zelf; gedeelde links wijzen dan naar de echte website. */
const nativeApp = window.TienApp ?? null;
const SITE_URL = "https://robbert-coder.github.io/10-op-en-neer/";
const tableLink = (code) => `${nativeApp ? SITE_URL : location.origin + location.pathname}?spel=${code}`;

function netEvents() {
  return {
    onWelcome: (seat) => {
      online.seat = seat;
      online.status = "";
      renderOnline();
    },
    onLobby: (players, seats) => {
      online.players = players;
      online.seats = seats;
      if (screen === "online") renderOnline();
      if (screen === "game") renderGame();
      saveOnline();
    },
    onStart: (g, log) => onNetStart(g, log),
    onChat: (m, own) => onChatMessage(m, own),
    onChatLog: (list) => { online.chat = list.slice(-100); renderChat(); },
    onAction: (a) => onNetAction(a),
    // Hoeveel handelingen dit apparaat al heeft (ook die nog in de wachtrij staan)
    actionCount: () => {
      if (!online?.game || !game) return null;
      const queued = online.queue.size ? Math.max(...online.queue.keys()) + 1 : 0;
      return Math.max(game.actionCount(), queued);
    },
    onStatus: (text) => {
      online.status = text;
      if (screen === "online") renderOnline();
      if (screen === "game" && text) { message = text; renderGame(); }
    },
    onError: (text) => {
      online.error = text;
      if (screen === "online") renderOnline();
      if (screen === "game") { message = text; renderGame(); }
    },
    onClosed: (text) => {
      const wasPlaying = !!online?.game;
      online.error = text;
      online.link = null;
      store.remove("online-gast");
      if (wasPlaying && screen === "game") { message = text; renderGame(); } else show("online");
    },
  };
}

// Chat --------------------------------------------------------------------------------------

let chatOpen = false;
const QUICK = ["👍", "😂", "😮", "😢", "👏", "🔥", "Goed gespeeld!", "Pech!", "Haha", "Even wachten"];

/** Plaats op het scherm (1 = onderaan) van een stoel in het spel. */
const tableSize = () => online?.game?.rules?.players ?? online?.rules?.players ?? online?.seats ?? 4;
const viewOfSeat = (seat) => (seat - online.seat + tableSize()) % tableSize() + 1;

function onChatMessage(m, own) {
  if (!online) return;
  online.chat.push(m);
  if (online.chat.length > 100) online.chat.shift();
  if (!own && !chatOpen && !(dockShown() && settings.chatDock !== false)) online.unread++;
  if (!own && screen === "game" && online.game && online.seat) {
    showBubble(viewOfSeat(m.seat), `<span>${esc(m.text)}</span>`, 2500 + m.text.length * 40, "chat");
  }
  renderChat();
  saveOnline();
}

function sendChat(text) {
  const clean = String(text || "").trim().slice(0, 200);
  if (!clean || !online?.link) return;
  if (online.role === "host") {
    online.link.sendChat(clean); // komt via onChat terug als eigen bericht
  } else if (online.link.sendChat(clean)) {
    onChatMessage({ seat: online.seat, name: settings.playerName, text: clean, time: Date.now() }, true);
  } else {
    online.status = "Geen verbinding: het bericht is niet verstuurd.";
    renderOnline();
  }
}

/** Bij samen spelen staat de chat vast onderin het spelscherm; met het pijltje klap je hem in. */
const dockShown = () => !!online && !!online.game && screen === "game";

function renderDock() {
  const dock = $("#chat-dock");
  const show = dockShown();
  const wasHidden = dock.hidden;
  dock.hidden = !show;
  $("#game").classList.toggle("has-dock", show);
  if (!show) { if (!wasHidden) layout(); return; }
  const open = settings.chatDock !== false;
  dock.classList.toggle("closed", !open);
  $("#dock-toggle").setAttribute("aria-label", open ? "Chat verbergen" : "Chat tonen");
  $("#dock-toggle").innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${open ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"}"/></svg>`;
  const msgs = online.chat;
  const last = msgs[msgs.length - 1];
  $("#dock-last").innerHTML = open ? "<b>Chat</b>"
    : last ? `<b>${esc(last.name)}:</b> ${esc(last.text)}` : "<b>Chat</b> <small>tik om iets te zeggen</small>";
  const unread = online.unread ?? 0;
  $("#dock-badge").hidden = open || unread === 0;
  $("#dock-badge").textContent = unread > 9 ? "9+" : String(unread);
  if (open) {
    const list = $("#dock-list");
    list.innerHTML = msgs.length === 0
      ? `<p class="chat-empty">Zeg iets tegen je medespelers!</p>`
      : msgs.slice(-30).map((m) => {
        const me = m.seat === online.seat;
        return `<div class="chat-msg ${me ? "me" : ""}"><small>${esc(m.name)}</small>${esc(m.text)}</div>`;
      }).join("");
    list.scrollTop = list.scrollHeight;
  }
  if (wasHidden || dock.dataset.open !== String(open)) { dock.dataset.open = String(open); layout(); }
}

function setDock(open) {
  settings.chatDock = open;
  saveSettings();
  if (open && online) online.unread = 0;
  renderChat();
}

function renderChat() {
  const show = !!online;
  $("#btn-chat").hidden = !show || dockShown();
  if (dockShown() && chatOpen) chatOpen = false;
  renderDock();
  const unread = online?.unread ?? 0;
  for (const id of ["#chat-badge", "#lobby-chat-badge"]) {
    $(id).hidden = unread === 0;
    $(id).textContent = unread > 9 ? "9+" : String(unread);
  }
  const panel = $("#chat");
  panel.hidden = !(show && chatOpen);
  if (panel.hidden) return;
  const list = $("#chat-list");
  const msgs = online.chat;
  list.innerHTML = msgs.length === 0
    ? `<p class="chat-empty">Nog geen berichten. Zeg iets tegen je medespelers!</p>`
    : msgs.map((m) => {
      const me = m.seat === online.seat;
      return `<div class="chat-msg ${me ? "me" : ""}"><small>${esc(m.name)}</small>${esc(m.text)}</div>`;
    }).join("");
  list.scrollTop = list.scrollHeight;
}

function openChat(open) {
  chatOpen = open;
  if (open && online) online.unread = 0;
  renderChat();
  if (open && !matchMedia("(pointer: coarse)").matches) $("#chat-input").focus();
}

$("#chat-quick").innerHTML = QUICK.map((q) => `<button type="button" class="${q.length > 2 ? "txt" : ""}" data-q="${esc(q)}">${esc(q)}</button>`).join("");
$("#chat-quick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-q]");
  if (b) sendChat(b.dataset.q);
});
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#chat-input");
  sendChat(input.value);
  input.value = "";
});
$("#btn-chat").addEventListener("click", () => openChat(!chatOpen));
$("#dock-quick").innerHTML = $("#chat-quick").innerHTML;
$("#dock-quick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-q]");
  if (b) sendChat(b.dataset.q);
});
$("#dock-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#dock-input");
  sendChat(input.value);
  input.value = "";
});
$(".dock-bar").addEventListener("click", () => setDock(settings.chatDock === false));
$("#btn-lobby-chat").addEventListener("click", () => openChat(!chatOpen));
$("#chat-close").addEventListener("click", () => openChat(false));

/** Sluit de huidige tafel (als die er is). */
function closeOnline() {
  if (!online) return;
  online.link?.close();
  if (online.game) { stopDriver(); game = null; st = null; }
  online = null;
  chatOpen = false;
  renderChat();
  store.remove("online");
  store.remove("online-gast");
}

function openTable(rules) {
  closeOnline();
  store.remove("spel");
  game = null;
  st = null;
  const code = makeCode();
  online = {
    role: "host", code, seat: 1, players: [{ name: settings.playerName, seat: 1, online: true, avatar: myAvatar() }],
    queue: new Map(), game: null, rules, smart: settings.smart, status: "Tafel openen…", error: "", chat: [], unread: 0,
  };
  online.link = new Host(code, settings.playerName, netEvents(), null, myAvatar(), rules.players ?? 4);
  show("online");
}

function joinTable(code) {
  closeOnline();
  online = { role: "guest", code, seat: 0, players: [], queue: new Map(), game: null, status: "Verbinden met de tafel…", error: "", chat: [], unread: 0 };
  online.link = new Guest(code, settings.playerName, clientId(), netEvents(), myAvatar());
  store.set("online-gast", { code, time: Date.now() });
  show("online");
}

/**
 * De gastheer begint (opnieuw) een spel met wie er aan tafel zit. Lege stoelen worden computers,
 * of ([fill] uit) de tafel wordt precies zo groot als het aantal mensen.
 */
function startHostGame(fill) {
  if (online?.role !== "host") return;
  if (!fill && !online.game && online.players.length >= 2 && online.players.length < tableSize()) {
    online.link.compact();
    online.players = online.link.players.map(({ name, seat, online: on, avatar }) => ({ name, seat, online: on, avatar }));
    online.rules = { ...online.rules, players: online.players.length };
    online.chat = online.link.chat.slice(-100);
    renderChat();
  }
  const names = Array.from(defaultNames());
  const humanSeats = [];
  for (const p of online.players) {
    names[p.seat - 1] = p.seat === 1 ? settings.playerName : p.name;
    humanSeats.push(p.seat);
  }
  const g = { rules: online.rules, smart: online.smart, seed: Math.floor(Math.random() * 2147483647), names, humanSeats };
  online.link.start(g);
  startOnlineGame(g, []);
}

function startOnlineGame(g, log) {
  stopDriver();
  tinekeHide();
  currentRules = g.rules;
  currentSmart = g.smart;
  online.game = g;
  online.queue = new Map();
  game = createGame(g.rules, g.smart, g.seed, g.names, log.map((a) => a.value), g.humanSeats, online.seat);
  gameOverHandled = false;
  endComment = null;
  highScorePlace = 0;
  showScores = false;
  lastTurnKey = "";
  announcedRound = 0;
  previousTable = [0, 0, 0, 0, 0];
  clearTransient();
  refresh();
  saveOnline();
  show("game");
  onTurn();
  drive();
}

function onNetStart(g, log) {
  const same = online.game && game && online.game.seed === g.seed;
  if (same && game.actionCount() <= log.length) {
    // Weer verbonden: alleen de gemiste handelingen nog uitvoeren
    log.forEach((a, index) => { if (index >= game.actionCount()) online.queue.set(index, { index, ...a }); });
    message = null;
    if (screen === "game") renderGame();
    drive();
    return;
  }
  startOnlineGame(g, log);
}

function onNetAction(a) {
  if (!game || !online?.game) return;
  if (a.index < game.actionCount()) return;
  online.queue.set(a.index, a);
  saveOnline();
  drive();
}

/** Een eigen handeling naar de anderen sturen. */
function netSend(index, value) {
  if (!online?.game) return;
  online.link?.sendAction(index, online.seat, value);
  saveOnline();
}

function saveOnline() {
  if (online?.role === "host" && online.link && online.game) store.set("online", { ...online.link.snapshot(), time: Date.now(), over: st?.phase === "GAME_OVER" });
}

/** Na het herladen van de pagina: de eigen tafel weer openen, of opnieuw aanschuiven bij een ander. */
/** Hoe lang je na het sluiten van de app automatisch terugkomt aan een online tafel. */
const ONLINE_RESUME_MS = 3 * 60 * 60 * 1000;

function resumeOnline() {
  // Een tafel van lang geleden is er niet meer: dan niet automatisch terug naar dat spel
  const recent = (x) => x && Date.now() - (x.time ?? 0) < ONLINE_RESUME_MS;
  let saved = store.get("online", null);
  if (saved && (saved.over || !recent(saved))) { store.remove("online"); saved = null; }
  if (saved?.started) {
    try {
      online = {
        role: "host", code: saved.code, seat: 1, players: saved.players, queue: new Map(), game: null,
        rules: saved.started.rules, smart: saved.started.smart, status: "", error: "",
        chat: saved.chat ?? [], unread: 0,
      };
      online.link = new Host(saved.code, settings.playerName, netEvents(), saved, myAvatar(), saved.started.rules.players ?? 4);
      online.game = saved.started;
      currentRules = saved.started.rules;
      currentSmart = saved.started.smart;
      game = createGame(saved.started.rules, saved.started.smart, saved.started.seed, saved.started.names,
        saved.log.map((a) => a.value), saved.started.humanSeats, 1);
      refresh();
      return true;
    } catch (e) {
      console.warn("Tafel kon niet worden hersteld", e);
      store.remove("online");
      online = null;
      game = null;
      st = null;
    }
  }
  const guest = store.get("online-gast", null);
  if (guest && !recent(guest)) store.remove("online-gast");
  else if (guest?.code) {
    joinTable(guest.code);
    return true;
  }
  return false;
}

function renderOnline() {
  $("#on-name").value = settings.playerName;
  const inLobby = !!online;
  $("#online-home").hidden = inLobby;
  $("#online-lobby").hidden = !inLobby;
  const msg = $("#online-msg");
  const text = online?.error || online?.status || "";
  msg.textContent = text;
  msg.hidden = !text;
  msg.classList.toggle("info", !online?.error);
  if (!online) return;
  $("#lobby-code").textContent = online.code;
  const isHost = online.role === "host";
  $("#share-row").hidden = !isHost;
  const rules = online.rules ?? online.game?.rules;
  $("#lobby-variant").textContent = rules ? rulesVariantName(rules) : "";
  const names = Array.from(defaultNames());
  const rows = Array.from({ length: tableSize() }, (_, i) => i + 1).map((seat) => {
    const p = online.players.find((x) => x.seat === seat);
    if (p) {
      const me = seat === online.seat;
      return `<div class="lobby-seat"><div class="avatar">${humanAvatarHtml(p.avatar, p.name)}</div>
        <div class="nm">${esc(p.name)}${me ? " (jij)" : ""}<small>${seat === 1 ? "Gastheer" : "Speler"}</small></div>
        <span class="dot ${p.online === false ? "off" : ""}"></span></div>`;
    }
    return `<div class="lobby-seat waiting"><div class="avatar">${faceSvg(SEAT_FACE[seat])}</div>
      <div class="nm">Nog vrij<small>Anders speelt ${names[seat - 1]} hier</small></div></div>`;
  }).join("");
  $("#lobby-seats").innerHTML = rows;
  const humans = online.players.length;
  const start = $("#btn-online-start");
  const free = tableSize() - humans;
  const fill = $("#btn-online-start-fill");
  const canStart = isHost && !online.game;
  // Met minstens twee mensen kun je ook zonder computers spelen; alleen kan dat niet.
  start.hidden = !canStart;
  $("#btn-online-back").hidden = !(online.game && game && st?.phase !== "GAME_OVER");
  fill.hidden = !canStart || free <= 0 || humans < 2;
  start.textContent = free <= 0 ? "Start het spel"
    : humans >= 2 ? `Start met ${humans} spelers, zonder computers`
      : `Start met ${free} ${free === 1 ? "computerspeler" : "computerspelers"}`;
  fill.textContent = `Lege plaatsen aanvullen met ${free} ${free === 1 ? "computerspeler" : "computerspelers"}`;
  let note = "";
  if (online.game && st?.phase === "GAME_OVER") note = `Dit spel is afgelopen. ${isHost ? "Sluit de tafel" : "Verlaat de tafel"} om een nieuwe te openen.`;
  else if (online.game) note = "Het spel is bezig.";
  else if (isHost) note = humans === 1 ? "Deel de link en wacht tot anderen aanschuiven." : "Start zodra iedereen er is.";
  else if (online.seat) note = "Wachten tot de gastheer het spel start…";
  $("#lobby-note").textContent = note;
  $("#btn-leave").textContent = isHost ? "Tafel sluiten" : "Tafel verlaten";
}

// Altijd eerst naar Samen spelen: van daaruit kun je verder spelen of de tafel sluiten en een nieuwe openen
$("#btn-online").addEventListener("click", () => show("online"));
$("#btn-online-back").addEventListener("click", () => { if (online?.game && game) show("game"); });
$("#on-name").addEventListener("input", (e) => {
  settings.playerName = e.target.value.trim() || "Speler";
  renderAvatarPick();
  saveSettings();
});
$("#btn-host").addEventListener("click", () => { newOnline = true; show("newgame"); });
$("#btn-join").addEventListener("click", () => {
  const code = normalizeCode($("#on-code").value);
  if (code.length !== 5) {
    $("#online-msg").hidden = false;
    $("#online-msg").textContent = "Vul de code van vijf tekens in.";
    return;
  }
  joinTable(code);
});
$("#on-code").addEventListener("input", (e) => { e.target.value = normalizeCode(e.target.value); });
$("#btn-online-start").addEventListener("click", () => startHostGame(online.players.length < 2));
$("#btn-online-start-fill").addEventListener("click", () => startHostGame(true));
$("#btn-leave").addEventListener("click", () => { closeOnline(); renderOnline(); renderMenu(); });
$("#btn-share").addEventListener("click", async () => {
  const url = tableLink(online.code);
  if (nativeApp) {
    nativeApp.share(`Speel je mee met 10 op en neer? Code ${online.code}\n${url}`);
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: "10 op en neer", text: `Speel je mee? Code ${online.code}`, url });
      return;
    } catch { /* geannuleerd */ }
  }
  copyLink(url);
});
$("#btn-copy").addEventListener("click", () => copyLink(tableLink(online.code)));
async function copyLink(url) {
  try {
    if (nativeApp) nativeApp.copy(url);
    else await navigator.clipboard.writeText(url);
    online.status = "De link is gekopieerd. Stuur hem naar wie je wilt laten meedoen.";
  } catch {
    online.status = `Stuur deze link: ${url}`;
  }
  renderOnline();
}

// ------------------------------------------------------------------------------------------
// Invoer
// ------------------------------------------------------------------------------------------

document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) {
    const target = go.dataset.go;
    if (target === "back") {
      show(rulesReturn);
      if (rulesReturn === "game") drive();
    } else {
      if (target === "rules") rulesReturn = "menu";
      show(target);
    }
  }
});

$("#btn-resume").addEventListener("click", () => { show("game"); drive(); });
$("#btn-new").addEventListener("click", () => { newOnline = false; show("newgame"); });

$$(".variant").forEach((el) => el.addEventListener("click", () => {
  newBase = el.dataset.variant === "13" ? BOERENBRIDGE : TIEN_OP_EN_NEER;
  newMax = null;
  newRounding = newBase.roundingAllowed;
  newMustTrump = newBase.mustTrump;
  renderNewGame();
}));
$("#opt-smart").addEventListener("change", (e) => { settings.smart = e.target.checked; saveSettings(); });
$("#opt-rounding").addEventListener("change", (e) => { newRounding = e.target.checked; renderNewGame(); });
$("#opt-players").addEventListener("click", (e) => {
  const b = e.target.closest("[data-players]");
  if (!b) return;
  newPlayers = Number(b.dataset.players);
  renderNewGame();
});
$("#opt-max").addEventListener("input", (e) => {
  const v = Number(e.target.value);
  newMax = v >= maxCardsFor(newBase, newPlayers) ? null : v;
  renderNewGame();
});
$("#opt-musttrump").addEventListener("change", (e) => { newMustTrump = e.target.checked; renderNewGame(); });
$("#btn-start").addEventListener("click", () => {
  const rules = newRules();
  if (newOnline) {
    openTable(rules);
    return;
  }
  if (hasGameInProgress()) {
    confirmDialog = {
      title: "Nieuw spel",
      text: "Je huidige spel wordt dan beëindigd. Wil je een nieuw spel beginnen?",
      yes: "Nieuw spel",
      no: "Annuleren",
      action: () => startNewGame(rules),
    };
    renderDialog();
  } else {
    startNewGame(rules);
  }
});

$$("#hs-tabs button").forEach((b) => b.addEventListener("click", () => { hsTab = b.dataset.tab; renderHighScores(); }));
$("#btn-hs-clear").addEventListener("click", () => {
  const name = $(`#hs-tabs [data-tab="${hsTab}"]`).textContent;
  confirmDialog = {
    title: "Highscore wissen",
    text: `Weet je zeker dat je de highscore van ${name} wilt wissen?`,
    yes: "Wissen",
    no: "Annuleren",
    action: () => { store.remove("highscore." + hsTab); renderHighScores(); },
  };
  renderDialog();
});

$("#set-name").addEventListener("input", (e) => {
  settings.playerName = e.target.value.trim() || "Speler";
  renderAvatarPick();
  saveSettings();
  if (game) {
    game.setPlayerName(settings.playerName);
    refresh();
    saveGame();
  }
});
$("#set-speed").addEventListener("input", (e) => { settings.speed = Number(e.target.value); saveSettings(); });
$("#set-desc").addEventListener("change", (e) => { settings.sortDescending = e.target.checked; saveSettings(); });
$("#set-sound").addEventListener("change", (e) => { settings.sound = e.target.checked; saveSettings(); renderSettings(); });
$("#set-speak").addEventListener("change", (e) => { settings.speakBids = e.target.checked; saveSettings(); });
$("#set-help").addEventListener("change", (e) => { settings.tinekeHelp = e.target.checked; settings.tinekeAsked = true; helpLevel = 0; saveSettings(); });

$("#bids").addEventListener("click", (e) => {
  const b = e.target.closest("[data-bid]");
  if (b && !b.disabled) onBid(Number(b.dataset.bid));
});
$("#hand").addEventListener("click", (e) => {
  const c = e.target.closest("[data-code]");
  if (c) onCardTap(Number(c.dataset.code), c);
});
$("#table").addEventListener("click", onTableTap);
$("#btn-tip").addEventListener("click", onTip);
$("#btn-scores").addEventListener("click", () => { showScores = true; renderDialog(); });
$("#btn-gamemenu").addEventListener("click", (e) => { e.stopPropagation(); menuOpen = !menuOpen; $("#gamemenu").hidden = !menuOpen; });
document.addEventListener("click", (e) => {
  if (menuOpen && !e.target.closest("#gamemenu") && !e.target.closest("#btn-gamemenu")) {
    menuOpen = false;
    $("#gamemenu").hidden = true;
  }
});
$("#btn-lasttrick").addEventListener("click", () => {
  menuOpen = false;
  if (st.lastTrickWinner !== 0) showLastTrick = !showLastTrick;
  renderGame();
});
$("#btn-rules-ingame").addEventListener("click", () => {
  stopDriver();
  menuOpen = false;
  rulesReturn = "game";
  show("rules");
});
$("#btn-tomenu").addEventListener("click", leaveGame);

$("#dialog-box").addEventListener("click", (e) => {
  const a = e.target.closest("[data-action]");
  if (!a) return;
  switch (a.dataset.action) {
    case "confirm-yes": {
      const action = confirmDialog.action;
      confirmDialog = null;
      renderDialog();
      action();
      break;
    }
    case "confirm-no": {
      const noAction = confirmDialog.noAction;
      confirmDialog = null;
      renderDialog();
      if (noAction) noAction();
      break;
    }
    case "scores":
      showScores = true;
      renderDialog();
      break;
    case "close-scores":
      showScores = false;
      renderDialog();
      break;
    case "next-round":
      continueAfterRound();
      break;
    case "menu":
      leaveGame();
      break;
    case "new-game":
      newOnline = false;
      show("newgame");
      break;
    case "new-online":
      startHostGame();
      break;
  }
});

// ------------------------------------------------------------------------------------------
// Start
// ------------------------------------------------------------------------------------------

$$(".logo-cards .card-slot").forEach((el) => {
  el.innerHTML = cardHtml(Number(el.dataset.card), "", "--w:70px");
});
$("#menu-faces").innerHTML = [2, 3, 4].map((nr) => avatarHtml(nr, "")).join("");

const joinCode = normalizeCode(new URLSearchParams(location.search).get("spel"));
if (!resumeOnline()) restoreSavedGame();
if (joinCode.length === 5 && !(online?.code === joinCode)) {
  // Geopend via een gedeelde link: meteen aanschuiven
  show("online");
  $("#on-code").value = joinCode;
  if (settings.playerName && settings.playerName !== "Speler") joinTable(joinCode);
  else $("#on-name").focus();
} else if (online && !online.game) {
  show("online");
} else {
  show("menu");
}

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
$("#install-hint").hidden = !(isIOS && !standalone);

if ("serviceWorker" in navigator && location.protocol === "https:" && !nativeApp) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* bijvoorbeeld in een voorbeeldweergave */ });
}

/** De terugknop van Android: geeft true als de app er zelf iets mee deed. */
window.tienBack = () => {
  if (chatOpen) { openChat(false); return true; }
  if (menuOpen) { menuOpen = false; $("#gamemenu").hidden = true; return true; }
  if (screen === "game" && showScores) { showScores = false; renderDialog(); return true; }
  if (screen === "rules") { $("#rules .back").click(); return true; }
  if (screen === "game") { leaveGame(); return true; }
  if (screen !== "menu") { show("menu"); return true; }
  return false;
};

// Voor de tests
window.__tienopenneer = { get state() { return st; }, settings, get busy() { return busy; }, celebrate };
