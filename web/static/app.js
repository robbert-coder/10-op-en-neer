// Webversie van "10 op en neer". De spelregels en computerspelers komen uit de Kotlin-code
// van de Android-app (tienopenneer.mjs); dit bestand tekent alleen het scherm.
import { WebGame, describeCard, defaultNames } from "./tienopenneer.mjs";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

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
  { playerName: "Speler", speed: 3, sortDescending: false, sound: true, speakBids: true },
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

function createGame(rules, seed, names, actions) {
  return new WebGame(
    rules.maxCards, rules.pointsPerTrick, rules.wrongScoresZero, rules.penaltyPerTrick,
    rules.negativeScores, rules.roundingAllowed, rules.mustTrump,
    seed, names, actions,
  );
}

function variantKey(st) {
  if (st.isTienOpEnNeer) return "10openneer";
  if (st.variant === "Boerenbridge") return "boerenbridge";
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
    for (const v of VOICES) for (let n = 0; n <= 13; n++) loadSound(`bod_${v}_${n}`);
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

/** Een nieuw geluid onderbreekt het vorige, net als in het origineel. */
async function playSound(name) {
  if (!audio) return;
  const buffer = await loadSound(name);
  if (!buffer) return;
  if (currentSource) {
    try { currentSource.stop(); } catch { /* al gestopt */ }
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.connect(audio.destination);
  src.start();
  currentSource = src;
}

// ------------------------------------------------------------------------------------------
// Toestand
// ------------------------------------------------------------------------------------------

let game = null;
let st = null; // laatste toestand uit de spelcode
let screen = "menu";
let rulesReturn = "menu";
let driver = null;
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
let previousTable = [0, 0, 0, 0];

let newBase = TIEN_OP_EN_NEER;
let newRounding = true;
let newMustTrump = false;
let hsTab = "10openneer";

const humanBidding = () => st && st.phase === "BIDDING" && st.active === 1;
const humanPlaying = () => st && st.phase === "PLAYING" && st.active === 1;
const hasGameInProgress = () => st !== null && st.phase !== "GAME_OVER";

function restoreSavedGame() {
  $$(".logo-cards .card-slot").forEach((el) => {
  el.innerHTML = cardHtml(Number(el.dataset.card), "", "--w:70px");
});

const saved = store.get("spel", null);
  if (!saved) return;
  try {
    game = createGame(saved.rules, saved.seed, saved.names, saved.actions);
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
  if (!game || !st || st.phase === "GAME_OVER") return;
  store.set("spel", {
    rules: currentRules,
    seed: game.seed,
    names: st.players.map((p) => p.name),
    actions: Array.from(game.actions()),
  });
}

let currentRules = TIEN_OP_EN_NEER;

function startNewGame(rules) {
  stopDriver();
  const names = Array.from(defaultNames());
  names[0] = settings.playerName;
  currentRules = rules;
  game = createGame(rules, Math.floor(Math.random() * 2147483647), names, []);
  gameOverHandled = false;
  highScorePlace = 0;
  showScores = false;
  previousTable = [0, 0, 0, 0];
  clearTransient();
  refresh();
  saveGame();
  show("game");
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
  if (settings.sound && sounds.length) playSound(sounds[sounds.length - 1].toLowerCase());
  announceBids();
  if (screen === "game") renderGame();
  if (st.phase === "GAME_OVER") handleGameOver();
}

function announceBids() {
  if (announcedRound !== st.round) {
    announcedRound = st.round;
    // Bij een hersteld spel de al gedane voorspellingen niet opnieuw zeggen
    for (let nr = 1; nr <= 4; nr++) announced[nr] = st.players[nr - 1].bid >= 0;
    return;
  }
  for (let nr = 1; nr <= 4; nr++) {
    const bid = st.players[nr - 1].bid;
    if (bid >= 0 && !announced[nr]) {
      announced[nr] = true;
      if (settings.sound && settings.speakBids) playSound(`bod_${VOICES[nr - 1]}_${bid}`);
    }
  }
}

function stepDelay(phase) {
  const factor = { 1: 2.0, 2: 1.4, 3: 1.0, 4: 0.65, 5: 0.35 }[settings.speed] ?? 1.0;
  const base = { BIDDING: 550, PLAYING: 700, TRICK_COMPLETE: 1400 }[phase] ?? 300;
  // Tijd om de uitgesproken voorspelling af te laten maken
  const minimum = phase === "BIDDING" && settings.sound && settings.speakBids ? 2800 * Math.min(factor, 1.0) : 0;
  return Math.max(base * factor, minimum);
}

function drive() {
  if (driver !== null || screen !== "game" || !st) return;
  if (st.phase === "GAME_OVER" || st.phase === "ROUND_COMPLETE" || humanBidding() || humanPlaying()) return;
  driver = setTimeout(() => {
    driver = null;
    game.advance();
    refresh();
    if (humanBidding() || humanPlaying()) {
      showLastTrick = false;
      renderGame();
    }
    saveGame();
    drive();
  }, stepDelay(st.phase));
}

function stopDriver() {
  if (driver !== null) clearTimeout(driver);
  driver = null;
}

function handleGameOver() {
  if (gameOverHandled) return;
  gameOverHandled = true;
  const me = st.players[0];
  highScorePlace = addHighScore(variantKey(st), me.name, me.total);
  // AfgelopenCommentaar: applaus bij een goed resultaat
  const aloneFirst = me.rank === 1 && st.players.filter((p) => p.rank === 1).length === 1;
  let applause = null;
  if (highScorePlace > 0 || aloneFirst) applause = "zeer_goed_gespeeld";
  else if (me.rank === 1) applause = "goed_gespeeld";
  else if (st.isTienOpEnNeer && me.total >= 190) applause = "zeer_goed_gespeeld";
  else if (st.isTienOpEnNeer && me.total >= 180) applause = "goed_gespeeld";
  if (applause && settings.sound) playSound(applause);
  store.remove("spel");
  renderDialog();
}

// ------------------------------------------------------------------------------------------
// Handelingen
// ------------------------------------------------------------------------------------------

function onBid(n) {
  const error = game.bid(n);
  clearTransient();
  if (error) message = error;
  refresh();
  if (!error) saveGame();
  renderGame();
  drive();
}

function onCardTap(code) {
  if (!humanPlaying()) {
    message = st.phase === "BIDDING" ? "Je moet eerst het aantal slagen voorspellen." : "Je bent nog niet aan de beurt.";
    renderGame();
    return;
  }
  const error = game.play(code);
  clearTransient();
  if (error) message = error;
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

function onTableTap() {
  if (showLastTrick) {
    showLastTrick = false;
    renderGame();
    return;
  }
  if (st.phase === "TRICK_COMPLETE") {
    stopDriver();
    game.advance();
    refresh();
    saveGame();
    renderGame();
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
  menuOpen = false;
  show("menu");
}

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
  return `<div class="card ${red} ${extra}" style="${style}" data-code="${code}"><div class="rank"><b>${label}</b><i>${SUIT[suit]}</i></div><div class="pip">${SUIT[suit]}</div></div>`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * De rondjes uit het origineel: een rondje per voorspelde slag, gevuld als de slag binnen is,
 * rood als het een onvoorspelde slag is of als de voorspelde slag niet meer te halen is.
 */
function dotsHtml(p) {
  if (p.bid < 0) return `<span class="dots-text">…</span>`;
  if (p.bid === 0 && p.tricks === 0) return `<span class="dots-text">0 slagen</span>`;
  let html = "";
  for (let i = 1; i <= Math.max(p.bid, p.tricks); i++) {
    let cls = "dot";
    if (i <= p.bid && i <= p.tricks) cls += " got";
    else if (i <= p.bid && i - p.tricks <= p.cardCount) cls += "";
    else if (i <= p.bid) cls += " lost";
    else cls += " extra";
    html += `<span class="${cls}"></span>`;
  }
  return `<span class="dots">${html}</span>`;
}

function seatHtml(nr) {
  const p = st.players[nr - 1];
  const lead = st.leader === nr ? `<span class="lead"></span>` : "";
  const name = `<div class="name">${lead}<span>${esc(p.name)}</span></div>`;
  if (nr === 1) return `${name}<span class="pts">${p.total} pt</span>${dotsHtml(p)}`;
  const backs = p.cardCount > 0 ? `<div class="backs"><div class="card back" style="--w:22px"></div> × ${p.cardCount}</div>` : "";
  return `${name}<span class="pts">${p.total} pt</span>${dotsHtml(p)}${backs}`;
}

function renderGame() {
  if (!st) return;
  $("#g-round").textContent = window.innerWidth < 380 ? `Ronde ${st.round}/${st.rounds}` : `Ronde ${st.round} van ${st.rounds}`;
  $("#g-cards").textContent = `${st.cards} ${st.cards === 1 ? "kaart" : "kaarten"} · ${st.variant}`;
  $("#g-over").textContent = st.tricksOver;
  $("#g-trump").innerHTML = st.trump ? cardHtml(st.trump, "", "--w:30px") : `<div class="none">–</div>`;
  $("#g-trump-label").textContent = st.trump ? "Troef" : "Geen troef";

  for (let nr = 1; nr <= 4; nr++) {
    const el = $(`#seat-${nr}`);
    el.innerHTML = seatHtml(nr);
    el.classList.toggle("active", st.active === nr);
  }

  // Tafel
  const last = showLastTrick && st.lastTrickWinner !== 0;
  const cards = last ? st.lastTrick : st.table;
  const winner = last ? st.lastTrickWinner : st.trickWinner;
  $$("#table .tcard").forEach((el, i) => {
    const isNew = !last && cards[i] && cards[i] !== previousTable[i];
    el.innerHTML = cardHtml(cards[i], `${winner === i + 1 ? "hl" : ""} ${isNew ? "new" : ""}`);
  });
  if (!last) previousTable = st.table.slice();
  $("#table-label").hidden = !last;

  // Statusregel
  let text = message;
  if (!text) {
    if (humanBidding()) text = "Hoeveel slagen denk je te halen?";
    else if (humanPlaying()) text = "Kies een kaart.";
    else if (st.phase === "TRICK_COMPLETE") text = st.status + " Tik op tafel om door te gaan.";
    else text = st.status;
  }
  const status = $("#g-status");
  status.textContent = text;
  status.classList.toggle("msg", !!message);
  $("#btn-tip").hidden = !(humanBidding() || humanPlaying());

  // Voorspellen
  const bids = $("#bids");
  if (humanBidding()) {
    let html = "";
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
  let hand = st.hand.slice();
  if (settings.sortDescending) {
    hand.sort((a, b) => Math.floor(a.code / 100) - Math.floor(b.code / 100) || (b.code % 100) - (a.code % 100));
  }
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
  renderDialog();
}

/** Kaartgroottes aanpassen aan het scherm, zoals de Android-app dat ook doet. */
function layout() {
  if (screen !== "game" || !st) return;
  const width = $("#game").clientWidth;
  const handEl = $("#hand");
  const cards = Array.from(handEl.children);
  const n = cards.length;
  const available = width - 16;
  const hw = n <= 1 ? 72 : Math.min(72, available / (0.56 * (n - 1) + 1));
  const spacing = n <= 1 ? 0 : Math.min(hw + 4, (available - hw) / (n - 1));
  handEl.style.setProperty("--hw", `${hw}px`);
  handEl.style.width = `${n === 0 ? 0 : hw + spacing * (n - 1)}px`;
  cards.forEach((el, i) => { el.style.left = `${spacing * i}px`; });

  const middle = $(".middle");
  const tw = Math.max(24, Math.min(76, (middle.clientWidth - 78 * 2 - 16) / 3.3, middle.clientHeight / (1.4 * 2.35)));
  $("#table").style.setProperty("--tw", `${tw}px`);
}
window.addEventListener("resize", layout);

function renderDialog() {
  const overlay = $("#dialog");
  const box = $("#dialog-box");
  let html = null;
  box.className = "dialog";
  if (confirmDialog) {
    html = `<h3>${confirmDialog.title}</h3><p>${confirmDialog.text}</p><div class="actions">
      <button class="text" data-action="confirm-no">${confirmDialog.no}</button>
      <button class="text" data-action="confirm-yes">${confirmDialog.yes}</button></div>`;
  } else if (screen === "game" && st && showScores) {
    box.className = "dialog sheet";
    html = scoreSheetHtml();
  } else if (screen === "game" && st && st.phase === "ROUND_COMPLETE") {
    html = roundResultHtml();
  } else if (screen === "game" && st && st.phase === "GAME_OVER") {
    html = gameOverHtml();
  }
  overlay.hidden = html === null;
  if (html !== null) box.innerHTML = html;
}

function roundResultHtml() {
  const r = st.round - 1;
  const rows = st.players.map((p, i) => {
    const [bid, tricks, score, crossed, good] = p.rounds[r];
    const pts = good ? `+${score}` : crossed ? "0" : `+${score}`;
    return `<tr class="${i === 0 ? "me" : ""}"><td>${esc(p.name)}</td><td>${bid}</td><td>${tricks}</td>
      <td class="${good ? "good" : "bad"}">${pts}</td><td><b>${p.total}</b></td></tr>`;
  }).join("");
  return `<h3>Ronde ${st.round} is afgelopen</h3>
    <table><tr><th></th><th>Gezegd</th><th>Gehaald</th><th>Punten</th><th>Totaal</th></tr>${rows}</table>
    <div class="actions"><button class="text" data-action="scores">Scorelijst</button>
    <button class="text" data-action="next-round">${st.round === st.rounds ? "Uitslag" : "Volgende ronde"}</button></div>`;
}

function gameOverHtml() {
  const me = st.players[0];
  const title = { 1: "Gewonnen!", 2: "Tweede plaats", 3: "Derde plaats" }[me.rank] ?? "Vierde plaats";
  const ranking = st.players.map((p, i) => ({ ...p, nr: i + 1 })).sort((a, b) => a.rank - b.rank);
  const list = ranking.map((p) => `<div class="${p.nr === 1 ? "me" : ""}"><span class="pos">${p.rank}.</span><span class="name">${esc(p.name)}</span><b>${p.total}</b></div>`).join("");
  const hs = highScorePlace > 0 ? `<p class="gold">Je staat op plaats ${highScorePlace} in de highscore van ${esc(st.variant)}.</p>` : "";
  return `<h3>${title}</h3><div class="rank-list">${list}</div>${hs}
    <div class="actions"><button class="text" data-action="scores">Scorelijst</button>
    <button class="text" data-action="menu">Menu</button>
    <button class="text" data-action="new-game">Nieuw spel</button></div>`;
}

function scoreSheetHtml() {
  const head = st.players.map((p) => `<th>${esc(p.name)}</th>`).join("");
  let rows = "";
  for (let r = 1; r <= st.rounds; r++) {
    const cards = cardsInRound(r);
    const cells = st.players.map((p) => {
      const [bid, , score, crossed, good] = p.rounds[r - 1];
      if (score >= 0) {
        const b = `<span class="b ${good ? "good" : "bad"}">${bid}</span>`;
        return `<td>${b}${crossed ? "" : score}</td>`;
      }
      if (r === st.round && p.bid >= 0) return `<td><span class="b open">${p.bid}</span></td>`;
      return `<td></td>`;
    }).join("");
    rows += `<tr class="${r === st.round ? "current" : ""}"><td class="dots-text">${r} (${cards})</td>${cells}</tr>`;
  }
  const totals = st.players.map((p) => `<td>${p.total}</td>`).join("");
  return `<h3>Scorelijst · ${esc(st.variant)}</h3>
    <div class="scroll"><table><tr><th>Rnd</th>${head}</tr>${rows}<tr class="total"><td>Totaal</td>${totals}</tr></table></div>
    <p class="legend">Klein getal: voorspelling. Doorgestreept: fout voorspeld.</p>
    <div class="actions"><button class="text" data-action="close-scores">Sluiten</button></div>`;
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
  if (name === "game") renderGame();
  renderDialog();
}

function renderMenu() {
  const inProgress = hasGameInProgress();
  $("#btn-resume").hidden = !inProgress;
  $("#btn-new").className = inProgress ? "" : "primary";
}

function rulesVariantName(rules) {
  const isTien = rules.maxCards === 10 && rules.wrongScoresZero && rules.penaltyPerTrick === 0 &&
    rules.roundingAllowed && !rules.mustTrump && rules.pointsPerTrick === 1;
  const isBoeren = rules.maxCards === 13 && rules.penaltyPerTrick > 0 && !rules.roundingAllowed && !rules.mustTrump;
  if (isTien) return "10 op en neer";
  if (isBoeren) return "Boerenbridge";
  return `Hybride (${rules.roundingAllowed ? "r" : "nr"}${rules.mustTrump ? ", iv" : ""})`;
}

const newRules = () => ({ ...newBase, roundingAllowed: newRounding, mustTrump: newMustTrump });

function renderNewGame() {
  $$(".variant").forEach((el) => el.classList.toggle("selected", Number(el.dataset.variant) === newBase.maxCards));
  $("#opt-rounding").checked = newRounding;
  $("#opt-musttrump").checked = newMustTrump;
  $("#variant-name").textContent = `Je speelt: ${rulesVariantName(newRules())}`;
}

function renderHighScores() {
  $$("#hs-tabs button").forEach((b) => b.classList.toggle("selected", b.dataset.tab === hsTab));
  const list = loadHighScores(hsTab);
  $("#hs-list").innerHTML = list.length === 0
    ? `<p class="dots-text">Nog geen scores. Speel een spel uit om in de lijst te komen.</p>`
    : list.map((h, i) => `<div class="hs-row"><span class="pos">${i + 1}.</span><span class="name">${esc(h.name)}</span><span class="date">${h.date}</span><span class="score">${h.score}</span></div>`).join("");
  $("#btn-hs-clear").hidden = list.length === 0;
}

function renderSettings() {
  $("#set-name").value = settings.playerName;
  $("#set-speed").value = settings.speed;
  $("#set-desc").checked = settings.sortDescending;
  $("#set-sound").checked = settings.sound;
  $("#set-speak").checked = settings.speakBids;
  $("#row-speak").hidden = !settings.sound;
}

const RULES_TEXT = [
  ["Doel van het spel", "Haal zoveel mogelijk punten, en meer dan je drie tegenspelers. Het leuke van dit spel is dat je ook met slechte kaarten kunt winnen."],
  ["Ronden", "Ieder krijgt in de eerste ronde 1 kaart, in de volgende ronde 2, enzovoort tot en met 10 kaarten. Daarna weer 9, 8, enzovoort tot en met 1. Vandaar de naam: in totaal zijn er 19 ronden. Bij Boerenbridge gaat het tot 13 kaarten (25 ronden); in de ronde met 13 kaarten is er geen troef."],
  ["Troef", "Aan het begin van elke ronde wordt een kaart van de stapel omgedraaid. De kleur van die kaart is troef. Je ziet hem rechtsboven in beeld."],
  ["Voorspellen", "Aan het begin van elke ronde zegt iedere speler hoeveel slagen hij denkt te halen. De bolletjes bij de naam laten zien hoeveel slagen iemand voorspeld heeft en hoeveel hij er al heeft. Bovenin zie je of er in totaal slagen over zijn of te weinig."],
  ["Rondmaken", "Als rondmaken niet is toegestaan (zoals bij Boerenbridge), mag de laatste speler niet zo voorspellen dat het totaal van alle voorspellingen gelijk is aan het aantal kaarten. Dan haalt er altijd minstens één speler zijn voorspelling niet."],
  ["Kaarten opleggen", "De speler met het gele bolletje komt uit: hij legt als eerste een kaart op. Daarna legt de volgende speler (met de klok mee) een kaart bij. Je moet kleur bekennen: als je een kaart hebt van de kleur die is uitgekomen, moet je die spelen. Kun je geen kleur bekennen, dan mag je elke kaart spelen (bij verplicht introeven moet je dan troef spelen als je die hebt)."],
  ["Een slag halen", "Als alle vier de spelers een kaart hebben opgelegd, krijgt de hoogste kaart de slag. De volgorde is 2 tot en met 10, boer, vrouw, heer, aas. Een kaart van een andere kleur dan die is uitgekomen is altijd lager, behalve troef: troef is hoger dan alle andere kleuren. Wie de slag haalt, moet daarna uitkomen."],
  ["Voorbeeld", "Harten is troef. Speler 1 komt uit met klaver heer. Speler 2 legt schoppen aas bij (dat mag, want hij heeft geen klaver). Speler 3 legt klaver vijf (hij heeft klaver en moet dus kleur bekennen). Speler 4 legt harten twee (een troef; dat mag, want hij heeft geen klaver). De slag gaat naar speler 4."],
  ["Punten bij 10 op en neer", "Haal je precies het aantal slagen dat je voorspeld hebt, dan krijg je 10 punten plus 1 punt per slag. Lukt dat niet, dan krijg je niets. Een score van 170 is zeer goed, boven de 200 is bijna niet te halen."],
  ["Punten bij Boerenbridge", "Goed voorspeld: 10 punten plus 3 punten per slag. Fout voorspeld: 10 punten min 3 punten per slag verschil (niet lager dan 0)."],
  ["Tips", "Tik op Tip om te zien wat de computer zou doen. Tik op de tafel om een volle slag meteen binnen te halen. Via het menu rechtsboven (⋮) kun je de laatste slag nog eens bekijken."],
  ["Op je beginscherm", "Op een iPhone of iPad: open deze pagina in Safari, tik op Deel en kies Zet op beginscherm. Op Android: kies in het menu van Chrome Toevoegen aan startscherm. Daarna start het spel als een gewone app en werkt het ook zonder internet."],
  ["Over dit spel", "Gebaseerd op het Windows-spel \"10 op en neer\" van A.A. Brink (sourceforge.net/projects/tienopenneer). De computerspelers gebruiken dezelfde strategie als het origineel. Vrije software onder de GNU General Public License versie 3."],
];
$("#rules-text").innerHTML = RULES_TEXT.map(([h, b]) => `<h3>${h}</h3><p>${b}</p>`).join("");

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
$("#btn-new").addEventListener("click", () => show("newgame"));

$$(".variant").forEach((el) => el.addEventListener("click", () => {
  newBase = el.dataset.variant === "13" ? BOERENBRIDGE : TIEN_OP_EN_NEER;
  newRounding = newBase.roundingAllowed;
  newMustTrump = newBase.mustTrump;
  renderNewGame();
}));
$("#opt-rounding").addEventListener("change", (e) => { newRounding = e.target.checked; renderNewGame(); });
$("#opt-musttrump").addEventListener("change", (e) => { newMustTrump = e.target.checked; renderNewGame(); });
$("#btn-start").addEventListener("click", () => {
  const rules = newRules();
  if (hasGameInProgress()) {
    confirmDialog = {
      title: "Nieuw spel",
      text: "Je huidige spel wordt dan beëindigd. Wil je een nieuw spel beginnen?",
      yes: "Ja",
      no: "Nee",
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

$("#bids").addEventListener("click", (e) => {
  const b = e.target.closest("[data-bid]");
  if (b && !b.disabled) onBid(Number(b.dataset.bid));
});
$("#hand").addEventListener("click", (e) => {
  const c = e.target.closest("[data-code]");
  if (c) onCardTap(Number(c.dataset.code));
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
    case "confirm-no":
      confirmDialog = null;
      renderDialog();
      break;
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
      show("newgame");
      break;
  }
});

// ------------------------------------------------------------------------------------------
// Start
// ------------------------------------------------------------------------------------------

$$(".logo-cards .card-slot").forEach((el) => {
  el.innerHTML = cardHtml(Number(el.dataset.card), "", "--w:70px");
});

const saved = store.get("spel", null);
if (saved?.rules) currentRules = saved.rules;
restoreSavedGame();
show("menu");

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
$("#install-hint").hidden = !(isIOS && !standalone);

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => { /* bijvoorbeeld in een voorbeeldweergave */ });
}

// Voor de tests
window.__tienopenneer = { get state() { return st; }, settings };
