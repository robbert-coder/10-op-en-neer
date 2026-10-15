// Webversie van "10 op en neer". De spelregels en computerspelers komen uit de Kotlin-code
// van de Android-app (tienopenneer.mjs); dit bestand tekent alleen het scherm.
import { defaultNames } from "./tienopenneer.mjs";
import { faceSvg, initialSvg, emojiSvg } from "./faces.js";
import * as tineke from "./tineke.js";
import { BID_LINES, WET_LINES, BID_MS } from "./voices.js";
import { CHARACTERS, CHARACTER_IDS, CLASSIC_CAST, REACTIONS, REACTIONS_EN, drawCast } from "./characters.js";
import { CHANGES } from "./changelog.js";
import { cloudEnabled, makeCloudCode, normalizeCloudCode, formatCloudCode, validCloudCode, fetchStats, saveStats, fetchHallOfFame, onCloudHealth } from "./cloud.js";
import { Host, Guest, PublicLobby, makeCode, normalizeCode, useIdentity, AVATAR_EMOJIS, AVATAR_FACES, cleanAvatar, cleanStats, cleanVoice } from "./net.js";
import { chatLimit, cleanStartGame, cleanText, devParam } from "./validate.js";
import { loadIdentity } from "./ident.js";
import { $, $$, esc, nativeApp, reducedMotion, wait } from "./dom.js";
import { DEFAULT_NAMES, myAvatar, myVoice, saveSettings, settings, store } from "./storage.js";
import { BOERENBRIDGE, TIEN_OP_EN_NEER, createGame, maxCardsFor, maxPlayersFor, variantKey, variantName } from "./rules.js";
import { KINDS, addGame, addHighScore, loadHighScores, matchesVs, playersDetail, loadStats, mergeGames, starRating, starsHtml, statsForKind, statsSummary } from "./stats.js";
import { flushHof, hofCache, hofId, queueHof, sha256Hex } from "./hof.js";
import { cardSound, initSound, loadSound, playSound, soundReady, stopSound } from "./sound.js";
import { OPENERS, PHRASES, PHRASE_GAP_MS, QUICK, RETURNERS, TIP_CHAT, WIRE_TEXTS, openerFile, phraseFile, returnFile, tinekeFile } from "./speech.js";
import { celebrate, isCelebrating } from "./celebrate.js";
import { askNotifications, clearTurnNotice, inBackground, iosBrowser, isIOS, notifyAlways, notifyPermission, notifyUnsupportedText, setAppVisible, turnNotice } from "./notify.js";
import { cardHtml, sortHand, trumpMiniHtml } from "./cards.js";
import { APP_VERSION, isNewerVersion } from "./version.js";
import { cardName, decimal, detailText, engineText, isEnglish, lang, locale, t, translateDom, variantText } from "./i18n.js";

// De vaste teksten van de pagina in de taal van het spel (i18n.js), voordat er iets getekend wordt
translateDom(document);

// Je sleutel voor samen spelen (ident.js). Lukt dat niet (zeer oude browser), dan werkt alleen samen spelen niet.
const identity = await loadIdentity().catch((e) => { console.warn("Geen sleutel:", e); return null; });
useIdentity(identity);

// Statistieken ---------------------------------------------------------------------------

/** Een afgelopen spel bewaren (stats.js); een spel dat al bewaard is (bijvoorbeeld na herladen) telt niet nog eens. */
function recordStats() {
  if (!st || !game) return;
  const me = st.players[0];
  const played = me.rounds.filter((r) => r[2] >= 0);
  const added = addGame({
    id: `${game.seed}|${game.actionCount()}|${st.variant}`,
    time: Date.now(),
    variant: st.variant,
    key: st.variantKey,
    full: st.fullGame,
    players: st.players.length,
    online: !!online?.game,
    score: me.total,
    rank: me.rank,
    won: me.rank === 1,
    rounds: played.length,
    good: played.filter((r) => r[4]).length,
    others: st.players.slice(1).map((p) => p.name),
    tips: tipUsed() || undefined,
  });
  if (!added) return;
  shareStats();
  syncStats();
}

/** Je eigen overzicht naar de tafel sturen (bij aanschuiven en na elk uitgespeeld spel). */
const shareStats = () => online?.link?.setStats?.(statsSummary());

/** Soort spel aan tafel (of aan de online tafel die nog moet beginnen): de sterren gelden per soort. */
function tableKind() {
  if (st?.variantKey) return st.variantKey;
  const rules = online?.rules ?? online?.game?.rules;
  return rules ? variantKey(rules) : "10openneer";
}

/**
 * De statistiek van speler nr in het spel, voor de soort spel aan tafel: van jezelf uit je eigen lijst, van
 * anderen zoals ze het delen.
 */
function statsOfSeat(nr) {
  const p = st?.players[nr - 1];
  if (!p?.human) return null;
  if (!online) return nr === 1 ? statsForKind(statsSummary(), tableKind()) : null;
  return seatStats(p.seat);
}

/** Het overzicht van wie op [seat] van de online tafel zit, voor de soort spel aan tafel. */
function seatStats(seat) {
  const all = seat === online.seat ? statsSummary() : online.players.find((x) => x.seat === seat)?.stats;
  return statsForKind(all ?? null, tableKind());
}

let playerCard = null; // {name, avatar, stats, computer} als je op iemand hebt getikt

function playerCardHtml() {
  const { name, avatarHtml: face, stats, computer, starsOpen } = playerCard;
  const kind = t(KINDS[playerCard.kind ?? tableKind()]);
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const body = computer
    ? `<p>${t("Een computerspeler. Die houdt geen statistiek bij.")}</p>`
    : !stats?.g
      ? `<p>${t("{name} heeft nog geen volledig spel {kind} uitgespeeld{short}, dus er zijn nog geen sterren.", {
        name: esc(name), kind: esc(kind),
        short: stats?.a ? t(stats.a === 1 ? " (wel 1 kort spel)" : " (wel {n} korte spellen)", { n: stats.a }) : "",
      })}</p>`
      : `${starsHtml(starRating(stats), "big")}
        <div class="stat-tiles three">
          <div class="stat-tile"><b>${stats.g}</b><small>${t("gespeeld")}</small></div>
          <div class="stat-tile"><b>${pct(stats.w, stats.g)}%</b><small>${t("gewonnen ({n})", { n: stats.w })}</small></div>
          <div class="stat-tile"><b>${pct(stats.ok, stats.r)}%</b><small>${t("goed voorspeld")}</small></div>
        </div><p class="pcard-note">${t(stats.g === 1 ? "Over 1 volledig spel {kind}{extra}." : "Over {n} volledige spellen {kind}{extra}.", {
          n: stats.g, kind: esc(kind), extra: stats.a > stats.g ? t("; daarnaast {n} kort", { n: stats.a - stats.g }) : "",
        })}</p>`;
  const about = computer ? "" : `<details class="stars-about" ${starsOpen ? "open" : ""}><summary>${t("Hoe werken de sterren?")}</summary>
    <p>${t("De sterren (een halve tot vijf) laten zien hoe goed iemand speelt. Alleen volledige spellen tellen mee, en geen spellen waarin tips zijn gebruikt. Ze gelden per soort spel: 10 op en neer en Boerenbridge apart.")}</p>
    <ul><li>${t("Voor 60% telt hoe hoog je eindigt: eerste is het best, laatste het minst. Zo zijn tafels van 2 tot 5 spelers te vergelijken.")}</li>
    <li>${t("Voor 40% telt hoe vaak je voorspelling precies klopte.")}</li>
    <li>${t("Met weinig spellen blijven de sterren dicht bij het midden; hoe meer je speelt, hoe eerlijker het beeld.")}</li></ul></details>`;
  return `<div class="pcard">${face}<h3>${esc(name)}</h3>${body}${about}</div>
    <div class="actions"><button class="primary" data-action="close-card">${t("Sluiten")}</button></div>`;
}

function openPlayerCard(card) {
  playerCard = card;
  renderDialog();
}

// Online bewaren ------------------------------------------------------------------------------

let cloudBusy = null; // lopende synchronisatie
let cloudStatus = "";
let cloudError = false;

/**
 * Statistieken van dit apparaat en van de server samenvoegen en terugschrijven.
 * De eerste keer krijgt dit apparaat een eigen code; met de code van een ander apparaat deel je ze.
 */
function syncStats() {
  if (!cloudEnabled()) return Promise.resolve();
  if (cloudBusy) return cloudBusy.then(() => syncStats());
  if (!settings.cloudCode) { settings.cloudCode = makeCloudCode(); saveSettings(); }
  const code = settings.cloudCode;
  cloudStatus = t("Bijwerken…");
  cloudError = false;
  renderCloud();
  cloudBusy = (async () => {
    try {
      const remote = await fetchStats(code);
      const clearedAt = Math.max(store.get("statistiek-gewist", 0), remote?.clearedAt ?? 0);
      const local = loadStats();
      const merged = mergeGames(local, remote?.games ?? [], clearedAt);
      store.set("statistiek", merged);
      store.set("statistiek-gewist", clearedAt);
      const same = (list) => list.length === merged.length && list.every((g, i) => g.id === merged[i].id);
      if (!remote || !same(remote.games) || remote.clearedAt !== clearedAt) await saveStats(code, merged, clearedAt);
      cloudStatus = t("Bijgewerkt om {time}", { time: new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) });
      if (!same(local)) {
        shareStats();
        if (screen === "stats") renderStats();
      }
    } catch {
      cloudStatus = t("Kon de statistieken niet online bijwerken. Ze staan wel op dit apparaat en gaan later mee.");
      cloudError = true;
    } finally {
      cloudBusy = null;
      renderCloud();
    }
  })();
  return cloudBusy;
}

function renderCloud() {
  const box = $("#stats-cloud");
  box.hidden = !cloudEnabled();
  if (box.hidden) return;
  const code = settings.cloudCode;
  $("#cloud-text").textContent = code
    ? t("Je statistieken worden online bewaard bij deze code. Vul hem in de app of op een ander apparaat in om overal dezelfde statistieken te zien.")
    : t("Je statistieken worden online bewaard zodra je een spel hebt uitgespeeld.");
  $("#cloud-code").textContent = code ? formatCloudCode(code) : "";
  $("#cloud-code").hidden = !code;
  $("#btn-cloud-copy").parentElement.hidden = !code;
  const status = $("#cloud-status");
  status.textContent = cloudStatus;
  status.classList.toggle("error", cloudError);
}

$("#btn-cloud-copy").addEventListener("click", async () => {
  const text = formatCloudCode(settings.cloudCode ?? "");
  try {
    if (nativeApp?.copy) nativeApp.copy(text);
    else await navigator.clipboard.writeText(text);
    cloudStatus = t("Code gekopieerd.");
  } catch {
    cloudStatus = t("Kopiëren lukte niet. Je code is {code}.", { code: text });
  }
  cloudError = false;
  renderCloud();
});

$("#btn-cloud-use").addEventListener("click", () => {
  const code = normalizeCloudCode($("#cloud-input").value);
  if (!validCloudCode(code)) {
    cloudStatus = t("Dat is geen geldige code. Een code heeft twaalf letters en cijfers, zoals ABCD-EFGH-JKLM.");
    cloudError = true;
    renderCloud();
    return;
  }
  settings.cloudCode = code;
  saveSettings();
  $("#cloud-input").value = "";
  $("#cloud-other").open = false;
  syncStats();
});

let statsTab = "alles";

function renderStats() {
  $$("#stats-tabs button").forEach((b) => b.classList.toggle("selected", b.dataset.tab === statsTab));
  const all = loadStats();
  const list = all.filter((g) => statsTab === "alles" || (statsTab === "samen") === g.online);
  $("#btn-stats-clear").hidden = all.length === 0;
  if (!list.length) {
    $("#stats-body").innerHTML = `<div class="group"><p class="empty-note">${all.length
      ? t("Nog geen spellen in deze lijst.")
      : t("Nog geen spellen. Speel een spel helemaal uit, dan zie je hier hoe je het doet.")}</p></div>`;
    return;
  }
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const won = list.filter((g) => g.won).length;
  const rounds = list.reduce((n, g) => n + g.rounds, 0);
  const good = list.reduce((n, g) => n + g.good, 0);
  const avgRank = list.reduce((n, g) => n + g.rank, 0) / list.length;
  const tile = (value, label) => `<div class="stat-tile"><b>${value}</b><small>${label}</small></div>`;
  // Per spelsoort: alleen spellen met dezelfde regels en lengte zijn te vergelijken
  const byVariant = new Map();
  for (const g of list) {
    const key = `${variantText(g.variant)} · ${t("{n} spelers", { n: g.players })}`;
    if (!byVariant.has(key)) byVariant.set(key, []);
    byVariant.get(key).push(g);
  }
  const variants = [...byVariant.entries()].sort((a, b) => b[1].length - a[1].length).map(([key, gs]) => {
    const avg = Math.round(gs.reduce((n, g) => n + g.score, 0) / gs.length);
    const best = Math.max(...gs.map((g) => g.score));
    return `<div class="stat-row"><span class="name">${esc(key)}<small>${t("{n} gespeeld · {w} gewonnen", { n: gs.length, w: gs.filter((g) => g.won).length })}</small></span>
      <span class="num"><small>${t("gem.")}</small>${avg}</span><span class="num best"><small>${t("beste")}</small>${best}</span></div>`;
  }).join("");
  const date = (time) => new Date(time).toLocaleDateString(locale, { day: "numeric", month: "short" });
  const recent = list.slice(0, 15).map((g) => `<div class="stat-row">
      <span class="name">${esc(variantText(g.variant))}<small>${date(g.time)} · ${g.online ? t("samen") : t("tegen de computer")} · ${t("{n} spelers", { n: g.players })}</small></span>
      <span class="num place">${g.rank === 1 ? `${NL_FLAG} ${ordinal(1)}` : ordinal(g.rank)}</span><span class="num best">${g.score}</span></div>`).join("");
  // Sterren per soort spel, uit al je volledige spellen
  const mine = statsTab === "alles" ? statsSummary(all) : null;
  const stars = !mine ? [] : Object.entries(KINDS).map(([kind, label]) => [t(label), starRating(statsForKind(mine, kind))]).filter(([, s]) => s != null);
  $("#stats-body").innerHTML = `
    ${stars.length ? `<div class="my-rating">${stars.map(([label, s]) => `<div class="kind-stars"><b>${esc(label)}</b>${starsHtml(s, "big")}</div>`).join("")}<small>${t("Per soort spel, uit je volledige spellen. Dit zien de anderen als je samen speelt.")}</small></div>` : ""}
    <div class="stat-tiles">
      ${tile(list.length, t("gespeeld"))}
      ${tile(`${pct(won, list.length)}%`, t("gewonnen ({n})", { n: won }))}
      ${tile(`${pct(good, rounds)}%`, t("goed voorspeld"))}
      ${tile(decimal(avgRank), t("gem. plaats"))}
    </div>
    <h3 class="stat-head">${t("Per spelsoort")}</h3><div class="group">${variants}</div>
    <h3 class="stat-head">${t("Laatste spellen")}</h3><div class="group">${recent}</div>`;
}

$$("#stats-tabs button").forEach((b) => b.addEventListener("click", () => { statsTab = b.dataset.tab; renderStats(); }));
/**
 * Is de online database (Hall of Fame en statistieken) even niet bereikbaar, dan blijft alles speelbaar:
 * alleen een melding in het hoofdmenu en bij de Hall of Fame. Scores gaan later alsnog mee.
 */
let cloudDown = false;
const CLOUD_DOWN_TEXT = t("De online Hall of Fame en statistieken zijn even niet bereikbaar. Je kunt gewoon spelen: je scores en statistieken worden op dit apparaat bewaard en later vanzelf doorgestuurd. Alleen de Hall of Fame van anderen is even niet te zien.");
onCloudHealth((ok) => {
  if (cloudDown === !ok) return;
  cloudDown = !ok;
  const el = $("#cloud-down");
  el.textContent = CLOUD_DOWN_TEXT;
  el.hidden = !cloudDown;
});

// Geluid (sound.js): bij de eerste tik alvast je eigen stem en die van de computerspelers laden, zodat het
// eerste geluid niet hapert
// In de app mag het geluid meteen aan; op de website pas na de eerste tik
initSound(() => {
  if (myVoice() !== "geen") BID_LINES[`speler_${myVoice()}`].forEach((row, n) => loadSound(`bod_speler_${myVoice()}_${n}_0`));
  preloadCast();
  playOpener();
}, !!nativeApp);

/** Truus roept je toe: één keer bij het openen, zolang je nog op het startscherm staat. */
let openerPlayed = false;
function playOpener() {
  if (openerPlayed || screen !== "menu" || !settings.sound || settings.opener === false) return;
  openerPlayed = true;
  playSound(openerFile(Math.floor(Math.random() * OPENERS.length)));
}
/** Terug op het startscherm na een spel: Truus daagt je uit voor nog een potje. */
function playReturn() {
  if (!soundReady() || !settings.sound || settings.opener === false) return;
  openerPlayed = true;
  playSound(returnFile(Math.floor(Math.random() * RETURNERS.length)));
}

/** De stemmen van de computerspelers in het huidige spel alvast laden. */
function preloadCast() {
  if (!soundReady() || !st) return;
  for (let nr = 2; nr <= st.players.length; nr++) {
    const v = faceFor(nr);
    if (!v || !BID_LINES[v]) continue;
    BID_LINES[v].forEach((row, n) => row.forEach((_, k) => loadSound(`bod_${v}_${n}_${k}`)));
    WET_LINES[v].forEach((_, k) => loadSound(`nat_${v}_${k}`));
  }
}

// ------------------------------------------------------------------------------------------
// Toestand
// ------------------------------------------------------------------------------------------

/** Gezicht per stoel in de lobby (voor het spel begint): de vaste bezetting van vroeger. */
const SEAT_FACE = [null, null, ...CLASSIC_CAST];
/** Welke computerspeler op welke stoel zit in het huidige spel (stoel 2 t/m 5). */
let currentCast = SEAT_FACE.slice();
function castOf(seat) {
  const c = (online?.game ? online.game.cast : currentCast)?.[seat];
  return typeof c === "string" && CHARACTERS[c] ? c : SEAT_FACE[seat];
}
/** Namen voor een nieuw spel: jij en de geloofde computerspelers. */
function castNames(cast) {
  const names = Array.from(defaultNames());
  for (let seat = 2; seat <= 5; seat++) if (cast[seat]) names[seat - 1] = CHARACTERS[cast[seat]].name;
  return names;
}

/** Gezicht van de speler op plaats nr van het scherm, of null voor een mens. */
function faceFor(nr) {
  const p = st?.players[nr - 1];
  if (!p) return castOf(nr);
  return p.human ? null : castOf(p.seat);
}
// Een mens zonder stem ("geen") heeft wel teksten nodig; die van neutraal (alleen het getal)
const voiceFor = (nr) => faceFor(nr) ?? `speler_${humanVoice(nr) === "geen" ? "neutraal" : humanVoice(nr)}`;

function humanVoice(nr) {
  const p = st?.players[nr - 1];
  if (online && p && p.seat !== online.seat) return cleanVoice(online.players.find((x) => x.seat === p.seat)?.voice) ?? "neutraal";
  return myVoice();
}

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
// Tips mogen altijd; heb je er een gebruikt, dan telt het spel niet mee
// Per spel (beginwaarde) bijgehouden, zodat een tip in het ene spel niet wegvalt door een ander spel
const tipSeeds = () => { const v = store.get("tip-gebruikt", []); return Array.isArray(v) ? v : [v]; };
const tipUsed = () => !!game && tipSeeds().includes(game.seed);
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
let toldThisGame = new Set(); // uitleg die Tineke maar één keer per spel geeft (troef)
let tinekeHistory = []; // uitleg van dit spel, om met Vorige terug te lezen
let tinekeBrowse = -1; // welke oude uitleg nu in beeld is (-1: de gewone)
let tinekeBrowseWasOpen = false; // stond er een uitleg open toen je op Vorige tikte?
const ONCE_PER_GAME = new Set(["troef", "geen troef"]);
let tinekeWaiting = null; // functie die het spel laat doorgaan na "Begrepen"
let tinekeTimer = null;
let tinekeShown = null; // { text, wait, isHelp } wat Tineke nu zegt
let tinekePending = null; // uitleg die na "Begrepen" weer getoond moet worden
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
/** Een kort spel gaat tot zoveel kaarten (9 rondes). */
const SHORT_MAX = 5;
let hsTab = "10openneer";
let hsShort = false; // de lijst van korte spellen tonen
let hsPlayers = 0; // filter: alleen spellen met zoveel spelers (0 = alle)
let hsVs = ""; // filter tegen wie: "" (iedereen), "sterk" of "gewoon" (alleen computers) of "mensen" (zie matchesVs)
let hsScope = "hof"; // "hof": Hall of Fame van iedereen, "local": op dit apparaat
let highScoreShort = false;
const hsKey = () => (hsShort ? `${hsTab}.kort` : hsTab);

/** De stoel (in het spel) van een andere mens die nu aan de beurt is, of 0. */
function remoteTurn() {
  if (!online?.game || !game) return 0;
  const seat = game.humanToMove();
  return seat && seat !== online.seat ? seat : 0;
}
// Speelt er een computer voor jou (je reageerde niet), dan ben je zelf nooit meer aan de beurt
const meHuman = () => st.players[0]?.human !== false;
const humanBidding = () => st && st.phase === "BIDDING" && st.active === 1 && meHuman();
const humanPlaying = () => st && st.phase === "PLAYING" && st.active === 1 && meHuman();
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

/**
 * Een spel tegen de computer dat nog liep weer openen (na herladen of afsluiten). Het spel wordt
 * opnieuw uitgerekend uit de beginwaarde en jouw handelingen; lukt dat niet, dan begin je opnieuw.
 */
function restoreSavedGame() {
  const saved = store.get("spel", null);
  if (!saved?.rules) return;
  try {
    currentRules = saved.rules;
    currentSmart = saved.smart ?? false;
    currentCast = Array.isArray(saved.cast) ? saved.cast.map((c) => (c && CHARACTERS[c] ? c : null)) : SEAT_FACE.slice();
    game = createGame({ rules: saved.rules, smart: currentSmart, seed: saved.seed, names: saved.names, actions: saved.actions });
    game.setPlayerName(settings.playerName);
    refresh();
  } catch (e) {
    console.warn("Opgeslagen spel kon niet worden hersteld", e);
    store.remove("spel");
    game = null;
    st = null;
  }
}

/**
 * Het lopende spel tegen de computer bewaren: alleen beginwaarde, regels en handelingen, de rest volgt daaruit.
 */
function saveGame() {
  if (online?.game) { saveOnline(); return; }
  if (!game || !st || st.phase === "GAME_OVER") return;
  store.set("spel", {
    rules: currentRules,
    smart: currentSmart,
    seed: game.seed,
    names: st.players.map((p) => p.name),
    actions: Array.from(game.actions()),
    cast: currentCast,
  });
}

function startNewGame(rules) {
  closeOnline();
  if (!settings.tinekeAsked) {
    settings.tinekeAsked = true;
    saveSettings();
    confirmDialog = {
      title: t("Ken je 10 op en neer al?"),
      text: t("Tineke kan je tijdens het eerste spel stap voor stap uitleggen hoe het werkt. Je kunt haar uitleg later altijd aan- of uitzetten in het menu tijdens het spel of bij Instellingen."),
      yes: t("Leg het me uit"),
      no: t("Ik ken het, overslaan"),
      action: () => { settings.tinekeHelp = true; saveSettings(); startNewGame(rules); },
      noAction: () => { settings.tinekeHelp = false; saveSettings(); startNewGame(rules); },
    };
    renderDialog();
    return;
  }
  stopDriver();
  tinekeRelease();
  helpLevel = 0;
  toldThisGame = new Set();
  tinekeHistory = [];
  lastTurnKey = "";
  currentCast = drawCast();
  const names = castNames(currentCast);
  names[0] = settings.playerName;
  currentRules = rules;
  currentSmart = settings.smart;
  game = createGame({ rules, smart: currentSmart, seed: Math.floor(Math.random() * 2147483647), names });
  gameOverHandled = false;
  endComment = null;
  highScorePlace = 0;
  showScores = false;
  previousTable = [0, 0, 0, 0, 0];
  clearTransient();
  refresh();
  saveGame();
  show("game");
  cardSound("shuffle");
  if (settings.tinekeHelp) {
    tinekeHelp("welkom").then(() => { onTurn(); drive(); });
  } else {
    onTurn();
  }
  drive();
}

/**
 * Tijdelijke dingen (melding, tip) weghalen zodra je iets doet; ze horen bij het vorige moment.
 */
function clearTransient() {
  message = null;
  hintCard = 0;
  hintBid = -1;
  showLastTrick = false;
}

/**
 * De stand opnieuw uit de spelmotor halen en reageren op wat er veranderde (geluiden, voorspellingen, nat gaan).
 */
function refresh() {
  if (!game) {
    st = null;
    return;
  }
  st = JSON.parse(game.state());
  if (online?.role === "host" && online.link && online.game) online.link.finished = st.phase === "GAME_OVER";
  const sounds = Array.from(game.takeSounds());
  // Een kaart die net is opgelegd vliegt nog naar de tafel: geluiden en nat gaan pas als hij ligt
  const flying = screen === "game" && !showLastTrick && !inBackground() && !reducedMotion &&
    st.table.some((c, i) => c && c !== previousTable[i]);
  const afterLanding = (fn) => (flying ? setTimeout(() => { if (screen === "game") fn(); }, animMs(360)) : fn());
  // Als de spelers praten, zegt een computerspeler zelf iets als hij nat gaat in plaats van het geluidje
  const voiceWet = settings.speakBids && sounds[sounds.length - 1] === "MEDESPELER_NAT";
  if (settings.sound && sounds.length && !voiceWet) afterLanding(() => playSound(sounds[sounds.length - 1].toLowerCase()));
  if (sounds.includes("SLAG_TE_VEEL") && Math.random() < 1 / 3) afterLanding(() => tinekeComment("te veel"));
  else if (sounds.includes("SLAG_TE_WEINIG") && Math.random() < 1 / 3) afterLanding(() => tinekeComment("te weinig"));
  else if (sounds.includes("GOED_VOORSPELD") && Math.random() < 1 / 4) afterLanding(() => tinekeComment("goed"));
  wetSpoken = false;
  announceBids(afterLanding);
  if (screen === "game") renderGame();
  if (screen === "game") onTurn();
  if (st.phase === "GAME_OVER") handleGameOver();
}

/** Spreekt nieuwe voorspellingen uit, laat het gezicht praten en toont een tekstballon. */
function announceBids(afterLanding = (fn) => fn()) {
  if (announcedRound !== st.round) {
    // Nieuwe ronde: de kaarten worden geschud en gedeeld (niet bij het herstellen van een spel)
    if (announcedRound && screen === "game" && st.phase === "BIDDING") cardSound("shuffle");
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
      // Mensen zeggen alleen het getal; hun stem kan apart uit
      const human = !faceFor(nr);
      const speak = settings.sound && settings.speakBids && !(human && (settings.speakHumans === false || humanVoice(nr) === "geen"));
      const v = voiceFor(nr);
      const k = human ? 0 : pickLine(`bod${nr}`, BID_LINES[v][p.bid].length, true);
      if (speak) playSound(`bod_${v}_${p.bid}_${k}`);
      // In het Engels blijven de opnames Nederlands, maar staat in de ballon alleen het getal
      const line = isEnglish ? "" : BID_LINES[v][p.bid][k];
      const ms = speak ? BID_MS[v][p.bid][k] + 250 : 1300 + (k ? line.length * 25 : 0);
      if (speak) speechUntil = Date.now() + ms;
      if (nr > 1) talkingUntil[nr] = Date.now() + ms;
      showBubble(nr, bidBubble(k ? line : "", p.bid), ms + 300);
      setTimeout(() => { if (screen === "game") updateSeats(); }, ms + 20);
      reactToBid(nr, ms);
    }
    if (!wetShown[nr] && isWet(p) && st.phase !== "BIDDING") {
      wetShown[nr] = true;
      // Gaan er meer spelers tegelijk nat, dan krijgt alleen de eerste een wolkje (en stem); de anderen kijken sip
      if (wetSpoken) continue;
      wetSpoken = true;
      if (!faceFor(nr)) {
        afterLanding(() => showBubble(nr, esc(t("Nat…")), 2200, true));
      } else {
        const v = voiceFor(nr);
        const k = pickLine(`nat${nr}`, WET_LINES[v].length, false);
        const say = settings.sound && settings.speakBids;
        afterLanding(() => {
          if (say) playSound(`nat_${v}_${k}`);
          showBubble(nr, esc(isEnglish ? WET_EN[k % WET_EN.length] : WET_LINES[v][k]), 2600, true);
        });
      }
    }
  }
}

/** Wat een computerspeler in het Engels in zijn ballon zegt als hij nat gaat (de opname blijft Nederlands). */
const WET_EN = ["Oh no!", "That's gone wrong.", "Missed it!", "Well, that's that.", "Bother.", "Not my round.", "There goes my bid.", "Can't make it now.",
  "Oops.", "Drat!", "So close.", "Never mind."];

// Karakters van de computerspelers -------------------------------------------------------------
// Zie characters.js: per spel geloot, elk met een eigen manier van praten. Ze reageren af en toe op elkaar.

/** Of de computerspelers nu mogen reageren: alleen in beeld en niet tijdens de uitleg van Tineke. */
const canReact = () => screen === "game" && !inBackground();

/** Een computerspeler (niet nr) die op een gebeurtenis reageert, of 0. */
function otherComputer(nr) {
  const list = [];
  for (let i = 1; i <= st.players.length; i++) if (i !== nr && faceFor(i)) list.push(i);
  return list.length ? list[Math.floor(Math.random() * list.length)] : 0;
}

function react(nr, kind, delay, mood = "") {
  const who = faceFor(nr);
  const lines = (isEnglish ? REACTIONS_EN : REACTIONS)[kind]?.[who];
  if (!lines || !canReact()) return;
  const round = st.round;
  setTimeout(() => {
    if (!canReact() || st.round !== round) return;
    // Praat er al iemand (wolkje in beeld), dan alleen een gebaar: niet door elkaar heen
    if ($("#flyers .bubble")) { gesture(nr, mood === "sad" ? "sigh" : "react"); return; }
    const k = pickLine(`r-${kind}-${nr}`, lines.length, false);
    showBubble(nr, `<span>${esc(lines[k])}</span>`, 1900, mood);
    gesture(nr, mood === "sad" ? "sigh" : kind === "slag" ? "cheer" : "react");
  }, delay);
}

/** Een kort gebaar van het gezicht, per karakter anders (zie style.css). */
function gesture(nr, kind) {
  const avatar = $(`#seat-${nr} .avatar`);
  if (!avatar) return;
  avatar.classList.remove("g-cheer", "g-react", "g-sigh");
  void avatar.offsetWidth;
  avatar.classList.add(`g-${kind}`);
  setTimeout(() => avatar.classList.remove(`g-${kind}`), 1300);
}

/** Na een voorspelling: soms reageert een ander op een hoog bod, op rondmaken of op over- of onderbieden. */
function reactToBid(nr, ms) {
  if (!canReact()) return;
  const done = st.players.every((p) => p.bid >= 0);
  const p = st.players[nr - 1];
  const other = otherComputer(nr);
  if (!other) return;
  const delay = ms + 250;
  if (done) {
    const total = st.players.reduce((n, x) => n + x.bid, 0);
    if (total === st.cards && st.cards > 1) { if (Math.random() < 0.5) react(other, "rond", delay, "sad"); }
    else if (total > st.cards) { if (Math.random() < 0.35) react(other, "over", delay); }
    else if (total < st.cards) { if (Math.random() < 0.35) react(other, "onder", delay); }
    return;
  }
  const fair = st.cards / st.players.length;
  if (p.bid >= 3 && p.bid >= fair + 2 && Math.random() < 0.4) react(other, "hoog", delay);
}

/** Je vraagt om een tip: een computerspeler heeft het gezien. */
function reactToTip() {
  const other = st ? otherComputer(1) : 0;
  if (other) react(other, "tip", 300);
}

/** Een computerspeler haalt een slag: soms een klein gebaar, af en toe met een opmerking. */
function reactToTrick(nr) {
  if (!faceFor(nr) || !canReact()) return;
  const p = st.players[nr - 1];
  // Er een te veel: daar is hij niet blij mee (het nat-zinnetje volgt vanzelf)
  if (p.bid >= 0 && p.tricks > p.bid) { gesture(nr, "sigh"); return; }
  // Bod gehaald maar nog kaarten over: nu mag hij niets meer halen, dus bezorgd in plaats van blij
  if (p.bid >= 0 && p.tricks === p.bid && p.cardCount > 0) {
    if (Math.random() < 0.4) react(nr, "oei", 350, "sad");
    else if (Math.random() < 0.6) gesture(nr, "sigh");
    return;
  }
  if (Math.random() > 0.35) return;
  if (Math.random() < 0.35) react(nr, "slag", 350);
  else gesture(nr, "cheer");
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

/**
 * Hoe lang te wachten voor de volgende stap: lang genoeg om mee te kijken, met tijd voor de uitgesproken voorspelling.
 */
function stepDelay(phase) {
  // Op de achtergrond kijkt niemand: meteen door, zodat je snel hoort dat je aan de beurt bent
  if (inBackground()) return 0;
  const factor = speedFactor();
  const base = { BIDDING: 550, PLAYING: 700, TRICK_COMPLETE: 1200 }[phase] ?? 300;
  // Tijd om de uitgesproken voorspelling af te laten maken
  const minimum = phase === "BIDDING" ? Math.max(0, speechUntil - Date.now() + 300) : 0;
  return Math.max(base * factor, minimum);
}

/**
 * De motor van het spel: zet de volgende stap (computerspeler, slag ophalen, zet van een ander) na een korte
 * pauze, zodat je kunt volgen wat er gebeurt. Wacht op jou, op Tineke, op een animatie of op een zet van een
 * andere mens; roept zichzelf aan tot er weer gewacht moet worden.
 */
function drive() {
  if (driver !== null || busy || tinekeWaiting || screen !== "game" || !st) return;
  // Samen spelen op de achtergrond: de volgende ronde begint vanzelf
  if (st.phase === "ROUND_COMPLETE" && online?.game && inBackground()) { continueAfterRound(); return; }
  // Speelt er een computer voor jou, dan kijk je mee en gaat de volgende ronde na even vanzelf verder
  if (st.phase === "ROUND_COMPLETE" && online?.game && !meHuman()) {
    driver = setTimeout(() => { driver = null; continueAfterRound(); }, 4000);
    return;
  }
  // Eerst een overname die al klaarstaat (anders kun je een zet doen die bij de anderen niet meer past)
  if (applyTakeovers()) { refresh(); renderGame(); }
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
      if (error) { console.warn("Handeling van een andere speler past niet:", error); resyncOnline(); return; }
      afterStep();
    } else {
      game.advance();
      afterStep();
    }
    drive();
  }, stepDelay(st.phase));
}

/**
 * Na elke stap van het spel: scherm bijwerken en bewaren, zodat herladen of afsluiten niets kost.
 */
function afterStep() {
  refresh();
  if (humanBidding() || humanPlaying()) {
    showLastTrick = false;
    renderGame();
  }
  saveGame();
}

/**
 * De geplande volgende stap annuleren (bij weggaan of een nieuw spel), zodat er niets meer doorloopt.
 */
function stopDriver() {
  if (driver !== null) clearTimeout(driver);
  driver = null;
}

/** De slag schuift naar de winnaar; daarna gaat het spel verder. */
async function collectTrick() {
  if (busy || st.phase !== "TRICK_COMPLETE") return;
  busy = true;
  const winner = st.trickWinner;
  if (screen === "game" && !showLastTrick && !inBackground()) await animateCollect(winner);
  game.advance();
  busy = false;
  afterStep();
  if (settings.tinekeHelp && st.phase === "PLAYING") {
    await tinekeHelp("slag erbij");
    helpLevel++;
  }
}

/**
 * Eén keer na afloop van een spel: statistiek, highscore, Hall of Fame en de feestelijke afsluiting.
 * gameOverHandled voorkomt dat het twee keer gebeurt (bijvoorbeeld na herladen).
 */
function handleGameOver() {
  if (gameOverHandled) return;
  gameOverHandled = true;
  recordStats();
  if (online?.game) turnNotice(t("Het spel is afgelopen. Kijk wie er gewonnen heeft!"));
  // Een afgelopen online spel niet meer automatisch openen na het herladen
  if (online?.role === "host") saveOnline();
  else if (online) store.remove("online-gast");
  const me = st.players[0];
  // Volledige spellen vanaf drie spelers hebben een eigen lijst; korte spellen komen in de lijst "kort",
  // met erbij tot hoeveel kaarten, want die scores zijn onderling minder te vergelijken
  const short = !st.fullGame;
  const upTo = `tot ${(st.rounds + 1) / 2}`;
  highScoreShort = short;
  const humans = st.players.filter((p) => p.human).length;
  const mix = playersDetail(st.players.length, humans, currentSmart);
  const gameId = `${game.seed}|${game.actionCount()}|${st.variant}`;
  if (tipUsed()) highScorePlace = 0; // met tips telt het spel niet mee
  else if (!short && st.players.length >= 3) {
    highScorePlace = addHighScore(st.variantKey, me.name, me.total, mix);
    queueHof({ game: gameId, list: st.variantKey, score: me.total, detail: mix });
  } else if (short) {
    highScorePlace = addHighScore(`${st.variantKey}.kort`, me.name, me.total, `${upTo} · ${mix}`);
    queueHof({ game: gameId, list: `${st.variantKey}.kort`, score: me.total, detail: `${upTo} · ${mix}` });
  }
  else highScorePlace = 0;
  // AfgelopenCommentaar: applaus bij een goed resultaat
  const aloneFirst = me.rank === 1 && st.players.filter((p) => p.rank === 1).length === 1;
  let applause = null;
  if (highScorePlace > 0 || aloneFirst) applause = "zeer_goed_gespeeld";
  else if (me.rank === 1) applause = "goed_gespeeld";
  else if (st.isTienOpEnNeer && me.total >= 190) applause = "zeer_goed_gespeeld";
  else if (st.isTienOpEnNeer && me.total >= 180) applause = "goed_gespeeld";
  if (applause && settings.sound) playSound(applause);
  store.remove("spel");
  celebrateWinners().then(renderDialog);
  renderDialog();
}

/** Het feestje aan het einde (celebrate.js), met de winnaars van dit spel als poppetjes. */
function celebrateWinners(mode = null, kind = undefined) {
  const winners = (st?.players ?? []).map((p, i) => ({ p, nr: i + 1 })).filter((x) => x.p.rank === 1).map(({ p, nr }) => {
    const face = faceFor(nr);
    return { name: p.name, me: nr === 1 && p.human, face, head: face ? faceSvg(face) : humanAvatarHtml(customAvatar(nr), p.name) };
  });
  return celebrate(winners, mode, kind);
}

// ------------------------------------------------------------------------------------------
// Handelingen
// ------------------------------------------------------------------------------------------

function onBid(n) {
  if (applyTakeovers()) { refresh(); renderGame(); if (!humanBidding()) { drive(); return; } }
  const index = game.actionCount();
  const error = game.bid(n);
  if (!error) netSend(index, n);
  clearTransient();
  if (error) message = engineText(error);
  if (!error) {
    tinekeHide();
    tinekeOpinion = adviceBid == null ? 0 : n <= adviceBid - 2 ? 1 : n >= adviceBid + 2 ? 2 : 0;
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
    message = st.phase === "BIDDING" ? t("Je moet eerst het aantal slagen voorspellen.") : t("Je bent nog niet aan de beurt.");
    renderGame();
    return;
  }
  if (applyTakeovers()) { refresh(); renderGame(); if (!humanPlaying()) { drive(); return; } }
  const from = el.getBoundingClientRect();
  const index = game.actionCount();
  const error = game.play(code);
  if (!error) netSend(index, code);
  clearTransient();
  if (error) {
    message = engineText(error);
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
  // De eerste tip in een spel eerst bevestigen: daarna telt het spel niet meer mee
  if (!tipUsed()) {
    confirmDialog = {
      title: t("Tip gebruiken?"),
      text: online?.game
        ? t("Gebruik je een tip, dan telt dit spel niet mee voor de highscores, de Hall of Fame en je sterren, en zien je medespelers dat je een tip gebruikte.")
        : t("Gebruik je een tip, dan telt dit spel niet mee voor de highscores, de Hall of Fame en je sterren."),
      yes: t("Geef een tip"),
      no: t("Toch niet"),
      action: () => { markTipUsed(); giveTip(); },
    };
    renderDialog();
    return;
  }
  giveTip();
}

function giveTip() {
  if (humanBidding()) {
    hintBid = game.hintBid();
    message = t("Tip: voorspel {n}.", { n: hintBid });
  } else if (humanPlaying()) {
    hintCard = game.hintCard();
    if (hintCard) message = t("Tip: speel de {card}.", { card: cardName(hintCard) });
  }
  renderGame();
}

/** Je gebruikt een tip: het spel telt niet meer mee, en je medespelers horen het. */
function markTipUsed() {
  if (!game || tipUsed()) return;
  store.set("tip-gebruikt", [...tipSeeds(), game.seed].slice(-20));
  if (online?.game) sendChat(TIP_CHAT, true); // in het Nederlands; de ontvanger vertaalt (chatText)
  else reactToTip();
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
  tinekeRelease();
  menuOpen = false;
  show("menu");
}

// ------------------------------------------------------------------------------------------
// Tineke
// ------------------------------------------------------------------------------------------

/** Laat Tineke iets zeggen. Bij wait=true pauzeert het spel tot je op Begrepen tikt. */
/** Tineke zegt de zinnen hardop, na elkaar (opnames uit speech.js). Een nieuwe uitleg breekt de vorige af. */
let tinekeVoiceToken = 0;
let tinekeTalking = false;
async function tinekeSpeak(lines) {
  const token = ++tinekeVoiceToken;
  // De opnames zijn Nederlands: in het Engels laat Tineke alleen tekst zien
  if (isEnglish || !soundReady() || !settings.sound || settings.tinekeVoice === false) return;
  for (const line of lines) {
    if (token !== tinekeVoiceToken) return;
    tinekeTalking = true;
    const ms = await playSound(tinekeFile(line));
    if (!ms) break;
    await wait(ms + 150);
  }
  if (token === tinekeVoiceToken) tinekeTalking = false;
}
function tinekeSilence() {
  tinekeVoiceToken++;
  if (tinekeTalking) stopSound();
  tinekeTalking = false;
}
/** Eén keer hardop zeggen wat in een venster staat (dat venster wordt vaker opnieuw getekend). */
let tinekeSpokenKey = "";
function tinekeSpeakOnce(key, lines) {
  if (tinekeSpokenKey === key) return;
  tinekeSpokenKey = key;
  tinekeSpeak(lines);
}

/** Het tekstvak van Tineke vullen (zonder te spreken). */
function renderTinekePanel(text, { isHelp = false, card = 0, old = false } = {}) {
  const panel = $("#tineke-panel");
  panel.className = `tineke-panel ${isHelp ? "" : "comment"}`;
  $("#tineke-text").textContent = text;
  // Een kaart waar de uitleg over gaat (de troefkaart) staat erbij, want het tekstvak kan hem op tafel bedekken
  if (card) $("#tineke-text").insertAdjacentHTML("afterbegin", `<span class="tineke-card">${cardHtml(card, "", "--w:44px")}</span>`);
  $("#tineke-actions").hidden = !isHelp;
  const shown = old ? tinekeBrowse : tinekeHistory.length - 1;
  $("#tineke-prev").hidden = !isHelp || shown < 1;
  $("#tineke-skip").hidden = old;
  $("#tineke-ok").textContent = old ? t("Verder") : t("Begrepen");
  panel.hidden = false;
}

/** Vorige: een eerdere uitleg van dit spel teruglezen. */
function tinekePrevious() {
  if (!tinekeHistory.length) return;
  if (tinekeBrowse === -1) {
    tinekeBrowseWasOpen = !$("#tineke-panel").hidden && !!tinekeShown?.isHelp;
    tinekeBrowse = tinekeHistory.length - (tinekeBrowseWasOpen ? 2 : 1);
  } else tinekeBrowse--;
  if (tinekeBrowse < 0) { tinekeBrowse = 0; return; }
  tinekeSilence();
  clearTimeout(tinekeTimer);
  renderTinekePanel(tinekeHistory[tinekeBrowse].text, { isHelp: true, card: tinekeHistory[tinekeBrowse].card, old: true });
}

/** Klaar met teruglezen: terug naar de uitleg van nu, of het tekstvak weer weg. */
function tinekeEndBrowse() {
  tinekeBrowse = -1;
  if (tinekeBrowseWasOpen && tinekeShown) renderTinekePanel(tinekeShown.text, tinekeShown);
  else $("#tineke-panel").hidden = true;
}

function tinekeSay(text, { wait = false, isHelp = false, say = null, card = 0 } = {}) {
  if (screen !== "game") return Promise.resolve();
  if (tinekeWaiting && !wait) {
    // Eerst de lopende uitleg afmaken
    if (isHelp) tinekePending = { text, wait, isHelp, say, card };
    return Promise.resolve();
  }
  if (wait && tinekeShown?.isHelp && !tinekeShown.wait) tinekePending = tinekeShown;
  clearTimeout(tinekeTimer);
  tinekeShown = { text, wait, isHelp, say, card };
  tinekeSpeak(say ?? [text]);
  tinekeBrowse = -1;
  if (isHelp && tinekeHistory.at(-1)?.text !== text) tinekeHistory = [...tinekeHistory, { text, card }].slice(-30);
  // Begrepen: bij wachten verder met het spel, anders alleen de tekst weg zodat je de tafel ziet
  renderTinekePanel(text, { isHelp, card });
  const panel = $("#tineke-panel");
  panel.style.animation = "none";
  void panel.offsetWidth;
  panel.style.animation = "";
  $("#tineke .avatar").className = "avatar talking";
  setTimeout(() => { const a = $("#tineke .avatar"); if (a) a.className = "avatar"; }, Math.min(3000, 600 + text.length * 35));
  if (!isHelp) tinekeTimer = setTimeout(tinekeHide, 2400 + 80 * text.length);
  if (!wait) return Promise.resolve();
  return new Promise((resolve) => { tinekeWaiting = resolve; });
}

/**
 * Weg van het spel terwijl Tineke op "Begrepen" wacht: het wachten opheffen. Anders blijft het spel
 * (en elk volgend spel) stilstaan, omdat drive() wacht tot Tineke klaar is.
 */
function tinekeRelease() {
  tinekeSilence();
  const resolve = tinekeWaiting;
  tinekeWaiting = null;
  tinekePending = null;
  tinekeHide();
  resolve?.();
}

function tinekeHide() {
  clearTimeout(tinekeTimer);
  tinekeShown = null;
  $("#tineke-panel").hidden = true;
}

/** Doorgaan na een uitleg: het spel loopt weer, en een eerdere uitleg komt terug. */
function tinekeContinue() {
  tinekeSilence();
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
  // Alleen nieuwe tips (instelling): wat je al eens kreeg, slaat Tineke over
  const seen = (k) => (ONCE_PER_GAME.has(k) && toldThisGame.has(k)) || (settings.tinekeNew !== false && settings.tinekeSeen?.includes(k));
  const h = tineke.help(event, st, helpLevel, cardName, { ...extra, seen, wrongZero: currentRules.wrongScoresZero !== false });
  if (!h) return Promise.resolve();
  for (const k of h.keys) toldThisGame.add(k);
  const fresh = h.keys.filter((k) => !settings.tinekeSeen?.includes(k));
  if (fresh.length) { settings.tinekeSeen = [...(settings.tinekeSeen ?? []), ...fresh]; saveSettings(); }
  return tinekeSay(h.text, { wait: h.wait, isHelp: true, say: h.say, card: h.card });
}

function tinekeComment(event, always = false) {
  if (!st) return;
  // Tineke is er alleen als haar uitleg aan staat; dan zegt ze alleen iets bij de vaste momenten
  if (!settings.tinekeHelp || !always) return;
  const text = tineke.comment(event, st, tinekeOpinion);
  if (text) tinekeSay(text);
}

// Meldingen (notify.js) ---------------------------------------------------------------------

window.tienVisible = (visible) => {
  setAppVisible(visible);
  if (visible) { clearTurnNotice(); drive(); if (screen === "online") renderOnline(); }
};
window.tienNotifyChanged = () => { if (screen === "online") renderOnline(); };
document.addEventListener("visibilitychange", () => { if (!document.hidden) clearTurnNotice(); });

/** Toestemming vragen voor meldingen; daarna het scherm Samen spelen bijwerken. */
const askNotify = () => askNotifications(() => { if (screen === "online") renderOnline(); });

/** In de wachtkamer: een knop om meldingen aan te zetten, zolang dat nog niet is gebeurd. */
function renderNotifyRow() {
  const state = notifyPermission();
  const row = $("#notify-row");
  row.hidden = settings.notify === false || state === "granted";
  const unsupported = notifyUnsupportedText();
  const blocked = state === "denied";
  if (unsupported) {
    $("#notify-text").textContent = unsupported;
    $("#btn-notify").hidden = true;
    return;
  }
  $("#notify-text").textContent = blocked
    ? nativeApp
      ? t("Meldingen staan uit voor deze app. Zet ze aan om te horen wanneer je aan de beurt bent.")
      : t("Meldingen staan uit voor deze website. Zet ze aan in de instellingen van je browser (het slotje naast het adres).")
    : t("Krijg een melding als je aan de beurt bent en het spel op de achtergrond staat.");
  $("#btn-notify").hidden = blocked && !nativeApp?.openNotificationSettings;
  $("#btn-notify").textContent = blocked ? t("Instellingen openen") : t("Meldingen aanzetten");
}
$("#btn-notify").addEventListener("click", () => {
  if (notifyPermission() === "denied") nativeApp?.openNotificationSettings?.();
  else askNotify();
  setTimeout(() => { if (screen === "online") renderOnline(); }, 1500);
});

/** Uitleg zodra er iets nieuws gebeurt: jij moet bieden, een kaart kiezen, of een slag is vol. */
function onTurn() {
  if (!st) return;
  const key = `${st.round}|${st.phase}|${st.active}|${st.players.map((p) => p.cardCount).join("")}|${st.trickWinner}`;
  if (key === lastTurnKey) return;
  lastTurnKey = key;
  if (online?.game) {
    if (humanBidding()) turnNotice(t("Je bent aan de beurt: hoeveel slagen denk je te halen? (ronde {n})", { n: st.round }));
    else if (humanPlaying()) turnNotice(t("Je bent aan de beurt: leg een kaart op."));
  }
  if (humanBidding()) {
    // Het advies van Tineke is ook een tip: alleen in het begin van de uitleg, of als je al een tip gebruikte
    adviceBid = helpLevel <= 1 || tipUsed() ? game.hintBid() : null;
    // Eerst (één keer per spel) wat troef is, dan de uitleg bij het voorspellen
    tinekeHelp("troef").then(() => { if (humanBidding()) tinekeHelp("voorspellen", { advice: adviceBid }); });
  } else if (humanPlaying()) {
    tinekeHelp("kies een kaart");
  } else if (st.phase === "TRICK_COMPLETE") {
    tinekeHelp("slag naar hoogste").then(() => drive());
  }
}

$("#tineke").innerHTML = `<div class="avatar">${faceSvg("tineke")}</div>`;
$("#tineke").addEventListener("click", () => {
  // Uitleg per ongeluk weggetikt? Een tik op Tineke laat de laatste weer zien
  if ($("#tineke-panel").hidden && tinekeHistory.length && settings.tinekeHelp) { tinekePrevious(); return; }
  const texts = tineke.clickTexts();
  tinekeClick = tinekeClick % texts.length;
  tinekeSay(texts[tinekeClick++]);
});
$("#tineke-ok").addEventListener("click", () => (tinekeBrowse >= 0 ? tinekeEndBrowse() : tinekeContinue()));
$("#tineke-prev").addEventListener("click", tinekePrevious);
$("#tineke-skip").addEventListener("click", () => {
  settings.tinekeHelp = false;
  saveSettings();
  tinekeContinue();
  renderGame();
});

// ------------------------------------------------------------------------------------------
// Tekenen
// ------------------------------------------------------------------------------------------

/** Het gekozen plaatje van een mens aan tafel: een emoji, een foto of anders de eerste letter. */
function customAvatar(nr) {
  const p = st?.players[nr - 1];
  if (!p?.human) return null;
  if (online) return online.players.find((x) => x.seat === p.seat)?.avatar ?? null;
  return cleanAvatar(settings.avatar);
}

function humanAvatarHtml(avatar, name) {
  if (avatar?.startsWith("data:image/")) return `<img class="face-img" src="${esc(avatar)}" alt="">`;
  if (avatar && AVATAR_FACES.includes(avatar)) return faceSvg(avatar);
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

/**
 * De plaatsen aan tafel opbouwen (alleen als het aantal spelers of de indeling verandert; dat is duur).
 */
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
        <div class="chip"><span class="c bid"><small>${t("bod")}</small><b></b></span><span class="c got"><small>${t("slagen")}</small><b></b></span></div>
        <span class="nat" hidden>${t("nat")}</span>
      </div>
`;
    el.querySelector(".avatar").insertAdjacentHTML("beforeend",
      `<span class="order" hidden></span><span class="lead" hidden>${t("uit")}</span><span class="mini-stars"></span><svg class="turn-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H6m0 0 6-6m-6 6 6 6"/></svg>`);
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

/**
 * De plaatsen aan tafel bijwerken: bod, slagen, wie er aan de beurt is (bij elke stap; daarom los van buildSeats).
 */
function updateSeats() {
  if (!st) return;
  if ($("#seat-1").dataset.key !== seatsKey() || !$("#seat-1 .avatar")) buildSeats();
  for (let nr = 1; nr <= st.players.length; nr++) {
    const p = st.players[nr - 1];
    const el = $(`#seat-${nr}`);
    el.classList.toggle("active", st.active === nr);
    el.classList.toggle("done", hasHadTurn(nr));
    // Tijdens het voorspellen springt een gedaan bod er goud uit, zodat je goed ziet wat de anderen zeiden
    el.classList.toggle("bid-shown", st.phase === "BIDDING" && p.bid >= 0);
    el.classList.toggle("bidding", st.phase === "BIDDING");
    const avatar = el.querySelector(".avatar");
    const stars = starRating(statsOfSeat(nr));
    const g = [...avatar.classList].filter((c) => c.startsWith("g-")).join(" ");
    avatar.className = `avatar ${moodFor(nr)} ${st.active === nr ? "active" : ""} ${stars != null ? "has-stars" : ""} ${g}`;
    el.querySelector(".lead").hidden = st.leader !== nr || st.phase === "ROUND_COMPLETE" || st.phase === "GAME_OVER";
    el.querySelector(".nm").textContent = p.name;
    const mini = el.querySelector(".mini-stars");
    if (mini.dataset.v !== String(stars)) { mini.dataset.v = String(stars); mini.innerHTML = starsHtml(stars); }
    el.querySelector(".tot").textContent = t("{n} pt", { n: p.total });
    el.querySelector(".bid b").textContent = p.bid >= 0 ? p.bid : "–";
    const got = el.querySelector(".got");
    got.querySelector("b").textContent = p.tricks;
    const wet = isWet(p);
    got.classList.toggle("wet", wet);
    got.classList.toggle("ok", !wet && p.bid >= 0 && p.tricks === p.bid);
    el.querySelector(".nat").hidden = !(wet && st.phase !== "BIDDING");
    if (p.tricks !== previousTricks[nr]) {
      if (p.tricks > (previousTricks[nr] ?? 0) && st.phase !== "BIDDING") reactToTrick(nr);
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
  // Eén praatwolkje tegelijk: er klinkt ook maar één stem, dus een vorig wolkje gaat weg
  layer.querySelectorAll(".bubble").forEach((old) => old.remove());
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
  cardSound("collect");
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
    el.innerHTML = `<small>${t("Troef")}</small>${st.trump
      ? cardHtml(st.trump, "", "--w:calc(var(--tw, 56px) * 1.5)")
      : `<div class="none">${t("Geen<br>troef")}</div>`}`;
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
// Ook als alleen de tafel van maat verandert (de hand of de voorspelknoppen verschijnen), anders klopt de ovaal niet
new ResizeObserver(() => { if (screen === "game" && st) { $("#bid-order").dataset.key = ""; renderBidOrder(); } }).observe($("#table"));
window.addEventListener("resize", () => { if (screen === "game" && st) { $("#bid-order").dataset.key = ""; renderBidOrder(); renderSidebar(); } });

function renderGame() {
  if (!st) return;
  // Tineke staat alleen aan tafel als je haar uitleg wilt (niet bij samen spelen)
  const tinekeOn = settings.tinekeHelp && !online?.game;
  $("#tineke").hidden = !tinekeOn;
  if (!tinekeOn) $("#tineke-panel").hidden = true;
  $("#g-round").textContent = t("Ronde {n} van {m}", { n: st.round, m: st.rounds });
  $("#g-cards").textContent = variantText(st.variant);
  $("#g-ncards").textContent = st.cards;
  $("#g-over").textContent = engineText(st.tricksOver);
  $("#g-trump").innerHTML = st.trump ? trumpMiniHtml(st.trump) : `<div class="none">${t("geen<br>troef")}</div>`;

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
    if (isNew) { animateFlyIn(el, i + 1); cardSound("slide"); }
  });
  if (!last) previousTable = st.table.slice();
  humanCardFrom = null;
  $("#table-label").hidden = !last;

  // Statusregel
  let text = message;
  if (!text) {
    if (humanBidding()) text = ""; // de vraag staat boven de knoppen
    else if (humanPlaying()) text = t("Jij bent aan de beurt. Kies een kaart.");
    else if (remoteTurn()) {
      const p = st.players[st.active - 1];
      const off = online.players.find((x) => x.seat === p.seat)?.online === false;
      text = off ? t("{name} heeft geen verbinding. Wachten tot {name} terug is…", { name: p.name }) : t("Wachten op {name}…", { name: p.name });
    }
    else if (st.phase === "TRICK_COMPLETE") text = engineText(st.status); // de slag gaat vanzelf naar de winnaar; tikken mag, maar hoeft niet
    else text = engineText(st.status);
  }
  const status = $("#g-status");
  status.textContent = text;
  status.classList.toggle("msg", !!message);
  $("#btn-tip").hidden = !(humanBidding() || humanPlaying());
  $("#btn-say").hidden = !othersAtTable() || st.phase === "GAME_OVER";

  // Voorspellen
  const bids = $("#bids");
  if (humanBidding()) {
    let html = `<p class="bids-q">${t("Hoeveel slagen denk je te halen?")}</p>`;
    for (let n = 0; n <= st.cards; n++) {
      const forbidden = n === st.forbiddenBid;
      html += `<button data-bid="${n}" class="${forbidden ? "forbidden" : ""} ${n === hintBid ? "hint" : ""}" ${forbidden ? "disabled" : ""}>${n}</button>`;
    }
    if (st.forbiddenBid >= 0) html += `<p>${t("Rondmaken is niet toegestaan: je mag geen {n} zeggen.", { n: st.forbiddenBid })}</p>`;
    bids.innerHTML = html;
    bids.classList.toggle("many", st.cards >= 9);
    bids.hidden = false;
  } else {
    bids.innerHTML = "";
    bids.hidden = true;
  }

  // Hand
  const hand = sortHand(st.hand, settings.sortDescending);
  const playing = humanPlaying();
  $("#hand").innerHTML = hand
    .map((c) => cardHtml(c.code, `${playing && !c.legal ? "dim" : ""} ${playing && c.legal ? "up" : ""} ${c.code === hintCard ? "hl" : ""}`))
    .join("");

  // Menu
  $("#gamemenu").hidden = !menuOpen;
  const lt = $("#btn-lasttrick");
  lt.disabled = st.lastTrickWinner === 0;
  lt.textContent = showLastTrick ? t("Huidige slag tonen") : t("Laatste slag tonen");
  const tk = $("#btn-tineke-ingame");
  tk.hidden = !!online?.game;
  tk.textContent = settings.tinekeHelp ? t("Uitleg van Tineke uitzetten") : t("Uitleg van Tineke aanzetten");

  layout();
  renderSidebar();
  renderDialog();
}

/** Kaartgroottes aanpassen aan het scherm. */
function layout() {
  if (screen !== "game" || !st) return;
  $("#g-round").textContent = window.innerWidth < 440 ? t("Ronde {n}/{m}", { n: st.round, m: st.rounds }) : t("Ronde {n} van {m}", { n: st.round, m: st.rounds });
  // Telefoon dwars: de hand staat in de rechterkolom en mag niet te hoog worden
  const sideways = phoneSideways();
  const width = sideways ? $("#bids").clientWidth : $("#game").clientWidth;
  const handEl = $("#hand");
  const cards = Array.from(handEl.children);
  const n = cards.length;
  const wide = isWide();
  const maxW = wide ? Math.min(118, Math.max(74, window.innerHeight / 8.5)) : sideways ? Math.min(74, Math.max(44, window.innerHeight / 6))
    : isTablet() ? Math.min(120, window.innerWidth / 7) : 74;
  // Door het waaieren steken de buitenste kaarten wat uit; die ruimte houden we vrij
  const available = Math.min(width - 24, wide || isTablet() ? 1000 : 640) - (n > 4 ? maxW * 0.7 : 0);
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
  const tw = Math.max(30, Math.min(wide || isTablet() ? 124 : 74, felt.clientWidth / 3.5, felt.clientHeight / (1.42 * 2.45)));
  felt.style.setProperty("--tw", `${tw}px`);
}
/** De hoogte van het scherm vastzetten in --app-h; na het draaien van een telefoon klopt 100% soms niet. */
function fitHeight() {
  document.documentElement.style.setProperty("--app-h", `${window.innerHeight}px`);
}
fitHeight();
for (const ev of ["resize", "orientationchange"]) {
  window.addEventListener(ev, () => { fitHeight(); setTimeout(() => { fitHeight(); layout(); }, 350); });
}
window.visualViewport?.addEventListener("resize", fitHeight);
window.addEventListener("resize", layout);

function renderDialog() {
  const overlay = $("#dialog");
  const box = $("#dialog-box");
  let html = null;
  let cls = "dialog";
  if (playerCard && !confirmDialog) {
    cls = "dialog card-dialog";
    html = playerCardHtml();
  } else if (confirmDialog) {
    html = `<h3>${confirmDialog.title}</h3><p>${confirmDialog.text}</p><div class="actions">
      ${confirmDialog.no ? `<button data-action="confirm-no">${confirmDialog.no}</button>` : ""}
      <button class="primary" data-action="confirm-yes">${confirmDialog.yes}</button></div>`;
  } else if (screen === "game" && st && showScores) {
    cls = "dialog sheet";
    html = scoreSheetHtml();
  } else if (screen === "game" && st && st.phase === "ROUND_COMPLETE" && !busy) {
    html = roundResultHtml();
  } else if (screen === "game" && st && st.phase === "GAME_OVER" && !isCelebrating()) {
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
      <div class="name">${esc(p.name)}<small>${t(tricks === 1 ? "bod {bid} · 1 slag behaald" : "bod {bid} · {n} slagen behaald", { bid, n: tricks })}</small></div>
      <div class="pts ${good ? "good" : "bad"}">${pts}</div><div class="tot">${p.total}</div></div>`;
  }).join("");
  const h = settings.tinekeHelp ? tineke.help("score", st, helpLevel, cardName) : null;
  if (h) tinekeSpeakOnce(`score${game.seed}|${st.round}`, h.say);
  return `<h3>${t("Ronde {n} is afgelopen", { n: st.round })}</h3>${h ? tinekeLine(h.text) : ""}<div class="result-rows">${rows}</div>
    <div class="actions"><button data-action="scores">${t("Scorelijst")}</button>
    <button class="primary" data-action="next-round">${st.round === st.rounds ? t("Uitslag") : t("Volgende ronde")}</button></div>`;
}

/** Klein Nederlands vlaggetje bij de winnaar in de eindstand. */
const NL_FLAG = `<svg class="nl-flag" viewBox="0 0 9 6" role="img" aria-label="${t("winnaar")}"><rect width="9" height="2" fill="#AE1C28"/><rect y="2" width="9" height="2" fill="#FFFFFF"/><rect y="4" width="9" height="2" fill="#21468B"/></svg>`;
/** Plaats als rangtelwoord: "1e" of "1st". */
const ordinal = (n) => (!isEnglish ? `${n}e` : `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`);
const winnerFlag = (p) => (st.phase === "GAME_OVER" && p.rank === 1 ? NL_FLAG : "");

function gameOverHtml() {
  const me = st.players[0];
  const title = { 1: t("Gewonnen!"), 2: t("Tweede plaats"), 3: t("Derde plaats"), 4: t("Vierde plaats") }[me.rank] ?? t("Vijfde plaats");
  const ranking = st.players.map((p, i) => ({ ...p, nr: i + 1 })).sort((a, b) => a.rank - b.rank);
  const rows = ranking.map((p) => `<div class="result-row ${p.nr === 1 ? "me" : ""}">
      ${avatarHtml(p.nr, p.name, p.rank === 1 ? "happy" : p.rank === st.players.length ? "sad" : "")}
      <div class="name">${esc(p.name)}${winnerFlag(p)}</div><div class="rank">${ordinal(p.rank)}</div><div class="tot">${p.total}</div></div>`).join("");
  const hs = tipUsed() ? `<p class="over-note">${t("Je gebruikte tips, dus dit spel telt niet mee voor de highscores, de Hall of Fame en je sterren.")}</p>`
    : highScorePlace > 0
    ? `<p class="gold">${t(highScoreShort ? "Je staat op plaats {n} in de highscore van korte spellen {kind}." : "Je staat op plaats {n} in de highscore van {kind}.", {
      n: highScorePlace, kind: esc(variantText(st.variant.replace(/ tot \d+$/, ""))) })}</p>` : "";
  const say = settings.tinekeHelp ? endComment ??= tineke.comment("afgelopen", st) : null;
  if (say && !online?.game) tinekeSpeakOnce(`einde${game.seed}`, [say]);
  if (!online?.game) {
    return `<h3>${title}</h3>${say ? tinekeLine(say) : ""}<div class="result-rows">${rows}</div>${hs}
    <div class="actions"><button data-action="scores">${t("Scorelijst")}</button>
    <button data-action="menu">${t("Menu")}</button>
    <button class="primary" data-action="new-game">${t("Nieuw spel")}</button></div>`;
  }
  // Online: geen haast meer. Blijf kletsen, speel nog een potje met hetzelfde gezelschap of ga terug.
  const host = online.role === "host";
  const open = !!online.link;
  const unread = online.unread ?? 0;
  const note = !open ? t("De gastheer heeft de tafel gesloten.")
    : host ? t("Blijf gerust nog even kletsen. Wil je nog een keer? Start een nieuw potje met dezelfde spelers.")
      : t("Blijf gerust nog even kletsen. De gastheer kan een nieuw potje met dezelfde spelers starten.");
  return `<h3>${title}</h3>${say ? tinekeLine(say) : ""}<div class="result-rows">${rows}</div>${hs}
    <p class="over-note">${note}</p>
    <div class="actions wrap"><button data-action="scores">${t("Scorelijst")}</button>
    ${open ? `<button data-action="online-chat">${t("Chat")}${unread ? ` <span class="badge inline">${unread > 9 ? "9+" : unread}</span>` : ""}</button>` : ""}
    <button ${host && open ? "" : `class="primary"`} data-action="online-exit">${online.pub ? t("Terug naar de lobby") : t("Terug naar het hoofdmenu")}</button>
    ${host && open ? `<button class="primary" data-action="new-online">${t("Nieuw potje met dezelfde spelers")}</button>` : ""}</div>`;
}

let endComment = null;
const tinekeLine = (text) => `<div class="tineke-line">${faceAvatar("tineke", "happy")}<p>${esc(text)}</p></div>`;
const faceAvatar = (who, mood = "") => `<div class="avatar ${mood}">${faceSvg(who)}</div>`;

/** Groot scherm (desktop): grotere kaarten en altijd de scorelijst ernaast. */
const wideQuery = window.matchMedia("(min-width: 1000px) and (min-height: 640px)");
const isWide = () => wideQuery.matches;
const sidewaysQuery = window.matchMedia("(orientation: landscape) and (max-height: 639px) and (min-width: 600px)");
const phoneSideways = () => sidewaysQuery.matches;
const tabletQuery = window.matchMedia("(orientation: portrait) and (min-width: 700px) and (min-height: 900px)");
const isTablet = () => tabletQuery.matches;
wideQuery.addEventListener?.("change", () => { if (screen === "game") { buildSeats(); renderGame(); } });

function renderSidebar() {
  const el = $("#sidebar");
  // Smal (tablet rechtop): leeg, en de sleutel ook weg, zodat de lijst terugkomt als het scherm weer breed wordt
  if (!isWide()) { if (el.innerHTML) { el.innerHTML = ""; el.dataset.key = ""; } return; }
  const html = `<h3>${t("Scorelijst")}</h3><div class="scroll">${sheetTableHtml()}</div>
    <p class="legend">${t("Klein doorgestreept getal: de voorspelling klopte niet.")}</p>`;
  if (el.dataset.key === html) return;
  el.dataset.key = html;
  el.innerHTML = html;
  el.querySelector("tr.current")?.scrollIntoView({ block: "center" });
}

function scoreSheetHtml() {
  return `<h3>${t("Scorelijst")} · ${esc(variantText(st.variant))}</h3>
    <div class="scroll">${sheetTableHtml()}</div>
    <p class="legend">${t("Klein doorgestreept getal: de voorspelling klopte niet.")}</p>
    <div class="actions"><button class="primary" data-action="close-scores">${t("Sluiten")}</button></div>`;
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
  return `<table><tr><th>${t("Ronde")}</th>${head}</tr>${rows}<tr class="total"><td>${t("Totaal")}</td>${totals}</tr></table>`;
}

function cardsInRound(r) {
  const max = (st.rounds + 1) / 2;
  return max - Math.abs(r - max);
}

// ------------------------------------------------------------------------------------------
// Schermen
// ------------------------------------------------------------------------------------------

function show(name) {
  if (name === "menu" && screen === "game") playReturn();
  screen = name;
  $$(".screen").forEach((el) => el.classList.toggle("active", el.id === name));
  if (name === "menu") renderMenu();
  if (name === "newgame") renderNewGame();
  if (name === "highscores") renderHighScores();
  if (name === "stats") { renderStats(); renderCloud(); syncStats(); }
  if (name === "settings") renderSettings();
  if (name === "online") renderOnline();
  else stopPublicLobby();
  if (name === "online" || name === "settings") renderAvatarPick();
  renderVoicePick();
  if (name !== "game" && name !== "online" && chatOpen) { chatOpen = false; }
  renderChat();
  if (name === "game") {
    preloadCast();
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
  $("#btn-play").className = inProgress ? "" : "primary";
}

const newMaxCards = () => Math.min(newMax ?? newBase.maxCards, maxCardsFor(newBase, newPlayers));
const newRules = () => ({
  ...newBase, maxCards: newMaxCards(), players: newPlayers, roundingAllowed: newRounding, mustTrump: newMustTrump,
});

let newOnline = false; // wordt het nieuwe spel een tafel voor samen spelen?
let newPublic = false; // een openbare tafel, te zien in de lobby
let newTitle = "";

function renderNewGame() {
  $("#ng-name").value = settings.playerName;
  renderAvatarPick();
  $("#newgame h2").textContent = newOnline ? (newPublic ? t("Openbare tafel openen") : t("Privé tafel openen")) : t("Nieuw spel");
  $("#ng-public").hidden = !newOnline;
  // Tineke helpt alleen tegen de computer
  $("#ng-tineke-row").hidden = newOnline;
  $("#ng-tineke").checked = settings.tinekeHelp;
  $$("#opt-public button").forEach((b) => b.classList.toggle("selected", (b.dataset.public === "1") === newPublic));
  $("#row-title").hidden = !newPublic;
  if ($("#opt-title").value !== newTitle) $("#opt-title").value = newTitle;
  $("#btn-start").textContent = newOnline ? t("Tafel openen") : t("Start");
  $$(".variant").forEach((el) => el.classList.toggle("selected", (el.dataset.variant === "13") === (newBase === BOERENBRIDGE)));
  $$("#opt-players button").forEach((b) => {
    b.classList.toggle("selected", Number(b.dataset.players) === newPlayers);
    b.disabled = Number(b.dataset.players) > maxPlayersFor(newBase);
  });
  $("#players-note").textContent = newOnline
    ? t("Tot {n} mensen kunnen aanschuiven. Je kiest bij het starten of lege plaatsen computerspelers worden.", { n: newPlayers })
    : t("Wie er tegen je spelen, wordt elk spel geloot uit Henk, Truus, Kees, Ria, Bram, Gerda, Sjef en Mo.")
      + (newBase === BOERENBRIDGE ? ` ${t("Boerenbridge gaat tot 13 kaarten, dus met hoogstens 4 spelers.")}` : "");
  const full = maxCardsFor(newBase, newPlayers);
  $$("#opt-length button").forEach((b) => b.classList.toggle("selected", (b.dataset.length === "normaal") === (newMax == null)));
  $("#len-normaal").textContent = t("{n} rondes", { n: 2 * full - 1 });
  $("#len-kort").textContent = t("{n} rondes", { n: newMax == null ? 2 * SHORT_MAX - 1 : 2 * newMax - 1 });
  const slider = $("#opt-max");
  slider.max = String(maxCardsFor(newBase, newPlayers));
  slider.value = String(newMaxCards());
  $("#max-label").textContent = `${newMaxCards()}`;
  const rounds = 2 * newMaxCards() - 1;
  $("#max-note").textContent = t("1 tot en met {n} kaarten en weer terug: {rounds} rondes.", { n: newMaxCards(), rounds });
  $("#opt-smart").checked = settings.smart;
  $("#opt-rounding").checked = newRounding;
  $("#opt-musttrump").checked = newMustTrump;
  $("#variant-name").textContent = t("Je speelt: {variant} met {n} spelers", { variant: variantText(variantName(newRules())), n: newPlayers });
}

const hsFiltered = () => !!hsPlayers || !!hsVs;
/** Bij het filter op sterke of gewone computers: oudere scores weten de sterkte niet. */
const vsNote = () => (hsVs === "sterk" || hsVs === "gewoon" ? ` ${t("Scores van vóór versie 2.36 staan alleen bij Iedereen.")}` : "");

/** Past een score bij de filters? De omschrijving is bijvoorbeeld "tot 5 · 4 spelers: 1 mens, 3 computers". */
function matchesHsFilter(h) {
  if (!hsFiltered()) return true;
  const n = Number(h.detail?.match(/(\d+) spelers/)?.[1] ?? (hsShort ? 0 : 4));
  if (hsPlayers && n !== hsPlayers) return false;
  return matchesVs(h.detail, hsVs);
}

function renderHsFilters() {
  // Volledige spellen tellen vanaf drie spelers
  if (!hsShort && hsPlayers === 2) hsPlayers = 0;
  $$("#hs-players button").forEach((b) => {
    b.hidden = !hsShort && b.dataset.n === "2";
    b.classList.toggle("selected", Number(b.dataset.n || 0) === hsPlayers);
  });
  $$("#hs-vs button").forEach((b) => b.classList.toggle("selected", b.dataset.vs === hsVs));
}

function renderHighScores() {
  $("#hs-scope").hidden = !cloudEnabled();
  if (!cloudEnabled()) hsScope = "local";
  $$("#hs-players button").forEach((b) => b.addEventListener("click", () => { hsPlayers = Number(b.dataset.n || 0); renderHighScores(); }));
$$("#hs-vs button").forEach((b) => b.addEventListener("click", () => { hsVs = b.dataset.vs; renderHighScores(); }));
$$("#hs-scope button").forEach((b) => b.classList.toggle("selected", b.dataset.scope === hsScope));
  $$("#hs-tabs button").forEach((b) => b.classList.toggle("selected", b.dataset.tab === hsTab));
  $$("#hs-length button").forEach((b) => b.classList.toggle("selected", (b.dataset.len === "kort") === hsShort));
  renderHsFilters();
  if (hsScope === "hof") { renderHallOfFame(); return; }
  $("#hof-players").innerHTML = "";
  $("#hs-note").textContent = hsShort
    ? t("Spellen die niet tot het hoogste aantal kaarten gaan. Erbij staat tot hoeveel kaarten en met hoeveel mensen en computers.")
    : t("Spellen die helemaal tot het hoogste aantal kaarten gaan, met drie of meer spelers. Erbij staat met hoeveel mensen en computers.");
  $("#hs-note").textContent += vsNote();
  const list = loadHighScores(hsKey()).filter(matchesHsFilter);
  $("#hs-list").innerHTML = list.length === 0 && hsFiltered()
    ? `<p class="empty-note">${t("Geen scores met deze filters.")}</p>`
    : list.length === 0
    ? `<p class="empty-note">${t("Nog geen scores. Speel een spel uit om in de lijst te komen.")}</p>`
    : list.map((h, i) => `<div class="hs-row"><span class="pos">${i + 1}</span><span class="name">${esc(h.name)}${h.detail ? `<small>${esc(detailText(h.detail))}</small>` : ""}</span><span class="date">${h.date}</span><span class="score">${h.score}</span></div>`).join("");
  $("#btn-hs-clear").hidden = list.length === 0;
}

const hofDate = (d) => (/^\d{4}-\d\d-\d\d$/.test(d ?? "") ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}` : "");
const hofFace = (p) => `<span class="hof-face">${humanAvatarHtml(cleanAvatar(p.avatar), String(p.name ?? "?"))}</span>`;

/** De Hall of Fame: de beste score van iedereen in deze lijst, en bij volledige spellen de beste spelers. */
async function renderHallOfFame() {
  const key = `${hsKey()}|${hsPlayers}|${hsVs}`;
  const cur = () => `${hsKey()}|${hsPlayers}|${hsVs}`;
  $("#btn-hs-clear").hidden = true;
  $("#hs-note").textContent = (hsShort
    ? t("De beste korte spellen van alle spelers, met erbij tot hoeveel kaarten en met hoeveel spelers.")
    : t("De beste volledige spellen (vanaf drie spelers) van iedereen. Iedereen staat er één keer in, met zijn beste score."))
    + vsNote() + (settings.hof === false ? ` ${t("Je doet zelf niet mee; dat zet je aan bij Instellingen.")}` : "");
  const cached = hofCache.get(key);
  if (!cached) { $("#hs-list").innerHTML = `<p class="empty-note">${t("Hall of Fame laden…")}</p>`; $("#hof-players").innerHTML = ""; }
  let data = cached?.data;
  if (!cached || Date.now() - cached.time > 60000) {
    try {
      await flushHof();
      data = await fetchHallOfFame(hsKey(), hsPlayers || null, hsVs || null);
      hofCache.set(key, { time: Date.now(), data });
    } catch {
      if (!data) {
        if (hsScope === "hof" && cur() === key) $("#hs-list").innerHTML = `<p class="empty-note">${t("De Hall of Fame is nu niet bereikbaar. Je kunt gewoon spelen; je scores worden bewaard en later doorgestuurd. Je eigen highscores zie je bij \"Op dit apparaat\".")}</p>`;
        return;
      }
    }
  }
  if (hsScope !== "hof" || cur() !== key) return; // intussen naar een andere lijst gegaan
  // De database geeft alleen een hash van het spelersnummer terug (het nummer zelf is je "wachtwoord")
  const me = await sha256Hex(hofId());
  if (hsScope !== "hof" || cur() !== key) return;
  const mine = (x) => x.p === me || x.p === settings.hofId;
  $("#hs-list").innerHTML = data.scores.length === 0
    ? `<p class="empty-note">${hsFiltered() ? t("Nog niemand met deze filters.") : t("Nog niemand in deze lijst. Speel een spel uit en kom er als eerste in!")}</p>`
    : data.scores.map((h, i) => `<div class="hs-row hof${mine(h) ? " me" : ""}"><span class="pos">${i + 1}</span>${hofFace(h)}<span class="name">${esc(String(h.name ?? ""))}${h.detail ? `<small>${esc(detailText(String(h.detail)))}</small>` : ""}</span><span class="date">${hofDate(h.date)}</span><span class="score">${Number(h.score) || 0}</span></div>`).join("");
  if (hsShort) { $("#hof-players").innerHTML = ""; return; }
  const players = data.players
    .map((p) => ({ ...p, s: statsForKind(cleanStats(p.stats), hsTab) }))
    .map((p) => ({ ...p, stars: starRating(p.s) }))
    .filter((p) => p.stars != null)
    .sort((a, b) => b.stars - a.stars || b.s.f - a.s.f || b.s.g - a.s.g)
    .slice(0, 25);
  $("#hof-players").innerHTML = players.length === 0 ? "" : `<h3 class="stat-head">${t("Beste spelers")}</h3>
    <p class="hs-note">${t("Op sterren: hoe hoog je eindigt en hoe vaak je goed voorspelt, gemiddeld over je volledige spellen van deze soort. Met weinig spellen blijven de sterren dicht bij het midden.")}</p>
    <div class="group">${players.map((p, i) => `<div class="hs-row hof${mine(p) ? " me" : ""}"><span class="pos">${i + 1}</span>${hofFace(p)}<span class="name">${esc(String(p.name ?? ""))}<small>${t("{g} spellen · {w} gewonnen · {pct}% goed", { g: p.s.g, w: p.s.w, pct: p.s.r ? Math.round((100 * p.s.ok) / p.s.r) : 0 })}</small></span>${starsHtml(p.stars)}</div>`).join("")}</div>`;
}

// ------------------------------------------------------------------------------------------
// Eigen plaatje
// ------------------------------------------------------------------------------------------

const CAMERA_SVG = `<svg class="face-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.1)"/>
  <path d="M30 40h9l5-7h12l5 7h9v28H30z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="50" cy="54" r="8" fill="none" stroke="currentColor" stroke-width="4"/></svg>`;

function renderAvatarPick() {
  const cur = myAvatar() ?? "";
  const photo = cur.startsWith("data:image/");
  const opt = (value, html, sel, label) =>
    `<button type="button" class="av-opt ${sel ? "sel" : ""}" data-av="${value}" aria-label="${label}">${html}</button>`;
  // Per plek opnieuw tekenen: elk gezicht heeft eigen id's voor kleurverloop en haar, en dubbele id's
  // laten het gezicht op een andere plek (bijvoorbeeld bij samen spelen) kaal en vreemd gekleurd zien
  const html = () => [
    opt("", initialSvg(settings.playerName), !cur, t("Eerste letter van je naam")),
    ...AVATAR_FACES.map((f, i) => opt(f, faceSvg(f), cur === f, t("Gezicht {n}", { n: i + 1 }))),
    opt("foto", photo ? humanAvatarHtml(cur, "") : CAMERA_SVG, photo, t("Eigen foto kiezen")),
  ].join("");
  $$(".avatar-pick").forEach((el) => { el.innerHTML = html(); });
}

function setAvatar(v) {
  settings.avatar = cleanAvatar(v);
  saveSettings();
  online?.link?.setAvatar?.(settings.avatar);
  pubLobby?.setMe({ avatar: settings.avatar });
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
    alert(t("Deze foto kon niet worden geopend. Probeer een andere."));
  }
});

function renderSettings() {
  $("#set-name").value = settings.playerName;
  $("#set-speed").value = settings.speed;
  $("#set-desc").checked = settings.sortDescending;
  $("#set-sound").checked = settings.sound;
  $("#set-speak").checked = settings.speakBids;
  $("#set-speak-humans").checked = settings.speakHumans !== false;
  $("#row-speak").hidden = !settings.sound;
  $("#row-cards").hidden = !settings.sound;
  $("#set-cards").checked = settings.cardSounds !== false;
  renderVoicePick();
  $("#set-tineke-voice").checked = settings.tinekeVoice !== false;
  // Tineke spreekt alleen Nederlands; in het Engels laat ze alleen tekst zien
  $("#row-tineke-voice").hidden = !settings.sound || isEnglish;
  $("#set-opener").checked = settings.opener !== false;
  $("#row-opener").hidden = !settings.sound;
  $("#row-speak-humans").hidden = !settings.sound || !settings.speakBids;
  $("#app-version").textContent = t("Versie {v}", { v: APP_VERSION }) + (nativeApp ? " (app)" : "");
  renderLangPick();
  $("#set-help").checked = settings.tinekeHelp;
  $("#set-tineke-new").checked = settings.tinekeNew !== false;
  $("#set-tineke-reset").textContent = t("Alle tips opnieuw laten zien");
  $("#set-tineke-reset").disabled = !settings.tinekeSeen?.length;
  $("#set-notify").checked = settings.notify !== false;
  $("#row-hof").hidden = !cloudEnabled();
  $("#set-hof").checked = settings.hof !== false;
  renderNotifyStatus();
}

const RULES_TEXT = [
  [t("Doel van het spel"), t("Haal zoveel mogelijk punten, en meer dan je drie tegenspelers. Het leuke van dit spel is dat je ook met slechte kaarten kunt winnen.")],
  [t("Ronden"), t("Ieder krijgt in de eerste ronde 1 kaart, in de volgende ronde 2, enzovoort tot en met 10 kaarten. Daarna weer 9, 8, enzovoort tot en met 1. Vandaar de naam: in totaal zijn er 19 ronden. Bij Boerenbridge gaat het tot 13 kaarten (25 ronden); in de ronde met 13 kaarten is er geen troef.")],
  [t("Troef"), t("Aan het begin van elke ronde wordt een kaart van de stapel omgedraaid. De kleur van die kaart is troef. Je ziet hem rechtsboven in beeld.")],
  [t("Voorspellen"), t("Aan het begin van elke ronde zegt iedere speler hoeveel slagen hij denkt te halen. Bij elke speler zie je steeds twee cijfers: het bod en het aantal slagen dat hij al heeft. Wordt het slagen-cijfer rood, dan is die speler nat: hij kan zijn voorspelling niet meer halen. Bovenin zie je of er in totaal slagen over zijn of te weinig.")],
  [t("Rondmaken"), t("Als rondmaken niet is toegestaan (zoals bij Boerenbridge), mag de laatste speler niet zo voorspellen dat het totaal van alle voorspellingen gelijk is aan het aantal kaarten. Dan haalt er altijd minstens één speler zijn voorspelling niet.")],
  [t("Kaarten opleggen"), t("De speler met het label \"uit\" komt uit: hij legt als eerste een kaart op. Daarna legt de volgende speler (met de klok mee) een kaart bij. Je moet kleur bekennen: als je een kaart hebt van de kleur die is uitgekomen, moet je die spelen. Kun je geen kleur bekennen, dan mag je elke kaart spelen (bij verplicht introeven moet je dan troef spelen als je die hebt).")],
  [t("Een slag halen"), t("Als alle vier de spelers een kaart hebben opgelegd, krijgt de hoogste kaart de slag. De volgorde is 2 tot en met 10, boer, vrouw, heer, aas. Een kaart van een andere kleur dan die is uitgekomen is altijd lager, behalve troef: troef is hoger dan alle andere kleuren. Wie de slag haalt, moet daarna uitkomen.")],
  [t("Voorbeeld"), t("Harten is troef. Speler 1 komt uit met klaver heer. Speler 2 legt schoppen aas bij (dat mag, want hij heeft geen klaver). Speler 3 legt klaver vijf (hij heeft klaver en moet dus kleur bekennen). Speler 4 legt harten twee (een troef; dat mag, want hij heeft geen klaver). De slag gaat naar speler 4.")],
  [t("Punten bij 10 op en neer"), t("Haal je precies het aantal slagen dat je voorspeld hebt, dan krijg je 10 punten plus 1 punt per slag. Lukt dat niet, dan krijg je niets. Een score van 170 is zeer goed, boven de 200 is bijna niet te halen.")],
  [t("Punten bij Boerenbridge"), t("Goed voorspeld: 10 punten plus 3 punten per slag. Fout voorspeld: 10 punten min 3 punten per slag verschil (niet lager dan 0).")],
  [t("Sterke computerspelers"), t("Met deze instelling rekenen de computerspelers bij elke beslissing een groot aantal mogelijke verdelingen van de kaarten door. Ze spelen dan een stuk slimmer. Zet je hem uit, dan spelen ze eenvoudiger en sneller.")],
  [t("Tips"), t("Tik op Tip om te zien wat de computer zou doen. Tik op de tafel om een volle slag meteen binnen te halen. Via het menu linksboven kun je de laatste slag nog eens bekijken.")],
  [t("Op je beginscherm"), t("Op een iPhone of iPad: open deze pagina in Safari, tik op Deel en kies Zet op beginscherm. Op Android: kies in het menu van Chrome Toevoegen aan startscherm. Daarna start het spel als een gewone app en werkt het ook zonder internet.")],
  [t("Over dit spel"), t("Gebaseerd op het Windows-spel \"10 op en neer\" van A.A. Brink (sourceforge.net/projects/tienopenneer). Vrije software onder de GNU General Public License versie 3.")],
];
$("#rules-text").innerHTML = RULES_TEXT.map(([h, b]) => `<h3>${h}</h3><p>${b}</p>`).join("");

// ------------------------------------------------------------------------------------------
// Samen spelen via internet
// ------------------------------------------------------------------------------------------

/** Je nummer bij samen spelen: afgeleid van je sleutel, zodat niemand het kan namaken (ident.js). */
const clientId = () => identity?.id ?? "";

/** In de Android-app draait de website vanuit de app zelf; gedeelde links wijzen dan naar de echte website. */
const SITE_URL = "https://robbert-coder.github.io/10-op-en-neer/";
// Met het nummer van de gastheer erin: wie via de link komt, weet zo zeker dat hij met de echte gastheer praat
const tableLink = (code) => `${nativeApp ? SITE_URL : location.origin + location.pathname}?spel=${code}${identity ? `&h=${identity.id}` : ""}`;

/**
 * Kom je terug na een nieuwe versie, dan zie je dat in het hoofdmenu, met uitklapbaar wat er nieuw is.
 * De vorige versie wordt onthouden; wie voor het eerst speelt, krijgt geen bericht.
 */
function showNews() {
  const last = store.get("laatste-versie", null);
  const el = $("#news");
  if (!last) { store.set("laatste-versie", APP_VERSION); return; }
  const fresh = CHANGES.filter((c) => isNewerVersion(c.v, last) && !isNewerVersion(c.v, APP_VERSION));
  if (!isNewerVersion(APP_VERSION, last) || !fresh.length) { store.set("laatste-versie", APP_VERSION); el.hidden = true; return; }
  el.innerHTML = `<div class="news-head"><b>${t("🎉 Welkom terug! Er is een nieuwe versie: {v}", { v: esc(APP_VERSION) })}</b>
    <button class="news-close" id="news-close" aria-label="${t("Sluiten")}">✕</button></div>
    <details><summary>${t("Wat is er nieuw?")}</summary>${fresh.map((c) => `<div class="news-v"><small>${t("Versie {v}", { v: esc(c.v) })}</small>
      <ul>${(isEnglish ? c.en : c.items).map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>`).join("")}</details>`;
  el.hidden = false;
  $("#news-close").addEventListener("click", () => { store.set("laatste-versie", APP_VERSION); el.hidden = true; });
}

/**
 * In de app (die als losse APK geïnstalleerd kan zijn) kijken we op GitHub of er een nieuwere
 * versie is; dan komt er een knop in het menu om die te downloaden. De website werkt zichzelf al bij.
 */
async function checkForUpdate() {
  if (!nativeApp && devParam("updatecheck") == null) return;
  try {
    const res = await fetch("https://api.github.com/repos/robbert-coder/10-op-en-neer/releases/latest", { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return;
    const rel = await res.json();
    const installed = nativeApp?.appVersion?.() ?? APP_VERSION;
    if (!rel.tag_name || !isNewerVersion(rel.tag_name, installed)) return;
    const apk = (rel.assets ?? []).find((a) => a.name?.endsWith(".apk"));
    const banner = $("#update-banner");
    banner.href = apk?.browser_download_url ?? rel.html_url;
    banner.innerHTML = `${t("Nieuwe versie {v} beschikbaar", { v: esc(rel.tag_name.replace(/^v/, "")) })}<small>${t("Tik om te downloaden en daarna te installeren")}</small>`;
    banner.hidden = false;
  } catch {
    // Geen internet: dan later nog eens
  }
}

/**
 * De koppeling tussen de verbinding (net.js) en het spel: wat er gebeurt als er iets binnenkomt.
 */
function netEvents() {
  return {
    onWelcome: (seat) => {
      online.seat = seat;
      online.status = "";
      renderOnline();
    },
    onLobby: (players, seats, pub) => {
      online.players = players;
      online.seats = seats;
      if (online.role === "guest") online.pub = pub;
      if (screen === "online") renderOnline();
      if (screen === "game") renderGame();
      saveOnline();
    },
    onStart: (g, log) => onNetStart(g, log),
    // Alleen bij de gastheer: past de zet van een gast? Bij twijfel (ons spel loopt nog achter) doorlaten
    validate: (index, seat) => {
      if (!game || game.actionCount() !== index) return undefined;
      const turn = game.humanToMove();
      return turn === 0 || turn === seat ? undefined : false;
    },
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
    onVotes: (v) => onVotes(v),
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
// De snelle berichten (speech.js) gaan in het Nederlands over de lijn, ook vanaf een Engelse speler; op het scherm
// vertaald. Alles wat mensen zelf typen blijft zoals het is.
const chatText = (text) => (WIRE_TEXTS.has(text) ? t(text) : text);

/** Plaats op het scherm (1 = onderaan) van een stoel in het spel. */
const tableSize = () => online?.game?.rules?.players ?? online?.rules?.players ?? online?.seats ?? 4;
const viewOfSeat = (seat) => (seat - online.seat + tableSize()) % tableSize() + 1;

function onChatMessage(m, own) {
  if (!online) return;
  if (!own) hearPhrase(m);
  online.chat.push(m);
  if (online.chat.length > 100) online.chat.shift();
  if (!own && !chatOpen && !(dockShown() && settings.chatDock !== false)) online.unread++;
  if (!own && screen === "game" && online.game && online.seat) {
    showBubble(viewOfSeat(m.seat), `<span>${esc(chatText(m.text))}</span>`, 2500 + m.text.length * 40, "chat");
  }
  renderChat();
  renderDialog();
  saveOnline();
}

/** Hoe vaak je zelf een chatbericht mag sturen (aan tafel en in de lobby); de ontvangers controleren het ook. */
const myChatLimit = chatLimit();
function chatTooFast() {
  if (myChatLimit.allow("ik")) return false;
  const secs = Math.ceil(myChatLimit.wait("ik") / 1000);
  showChatNotice(t(secs === 1 ? "Even rustig aan: over 1 seconde kun je weer een bericht sturen." : "Even rustig aan: over {n} seconden kun je weer een bericht sturen.", { n: secs }));
  return true;
}

/** Een chatbericht aan tafel. [force]: meldingen van de app zelf (zoals een gebruikte tip) tellen niet mee. Geeft false als het niet verstuurd is. */
function sendChat(text, force = false) {
  const clean = cleanText(text, 200);
  if (!clean || !online?.link || (!force && chatTooFast())) return false;
  if (online.role === "host") {
    online.link.sendChat(clean); // komt via onChat terug als eigen bericht
  } else if (online.link.sendChat(clean)) {
    onChatMessage({ seat: online.seat, name: settings.playerName, text: clean, time: Date.now() }, true);
  } else {
    online.status = t("Geen verbinding: het bericht is niet verstuurd.");
    renderOnline();
    return false;
  }
  return true;
}

/** Een melding over de chat zelf (te snel), alleen voor jou: in de tafelchat of in de lobby. */
function showChatNotice(text) {
  if (online) systemChat(text);
  else { pubStatus = text; renderPublicLobby(); setTimeout(() => { if (pubStatus === text) { pubStatus = ""; renderPublicLobby(); } }, 4000); }
}

/** Bij samen spelen staat de chat vast onderin het spelscherm; met het pijltje klap je hem in. */
// Na afloop staat de uitslag in beeld; dan gaat de chat via de knop in de uitslag
const dockShown = () => !!online && !!online.game && screen === "game" && st?.phase !== "GAME_OVER";

function renderDock() {
  const dock = $("#chat-dock");
  const show = dockShown();
  const wasHidden = dock.hidden;
  dock.hidden = !show;
  $("#game").classList.toggle("has-dock", show);
  if (!show) { if (!wasHidden) layout(); return; }
  const open = settings.chatDock !== false;
  dock.classList.toggle("closed", !open);
  $("#dock-toggle").setAttribute("aria-label", open ? t("Chat verbergen") : t("Chat tonen"));
  $("#dock-toggle").innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${open ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"}"/></svg>`;
  const msgs = online.chat;
  const last = msgs[msgs.length - 1];
  $("#dock-last").innerHTML = open ? `<b>${t("Chat")}</b>`
    : last ? (last.system ? esc(last.text) : `<b>${esc(last.name)}:</b> ${esc(chatText(last.text))}`) : `<b>${t("Chat")}</b> <small>${t("tik om iets te zeggen")}</small>`;
  const unread = online.unread ?? 0;
  $("#dock-badge").hidden = open || unread === 0;
  $("#dock-badge").textContent = unread > 9 ? "9+" : String(unread);
  if (open) {
    const list = $("#dock-list");
    list.innerHTML = msgs.length === 0
      ? `<p class="chat-empty">${t("Zeg iets tegen je medespelers!")}</p>`
      : msgs.slice(-30).map((m) => {
        if (m.system) return `<div class="chat-msg system">${esc(m.text)}</div>`;
        const me = m.seat === online.seat;
        return `<div class="chat-msg ${me ? "me" : ""}"><small>${esc(m.name)}</small>${esc(chatText(m.text))}</div>`;
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
    ? `<p class="chat-empty">${t("Nog geen berichten. Zeg iets tegen je medespelers!")}</p>`
    : msgs.map((m) => {
      if (m.system) return `<div class="chat-msg system">${esc(m.text)}</div>`;
      const me = m.seat === online.seat;
      return `<div class="chat-msg ${me ? "me" : ""}"><small>${esc(m.name)}</small>${esc(chatText(m.text))}</div>`;
    }).join("");
  list.scrollTop = list.scrollHeight;
}

function openChat(open) {
  chatOpen = open;
  if (open && online) online.unread = 0;
  renderChat();
  if (open && !window.matchMedia("(pointer: coarse)").matches) $("#chat-input").focus();
}

// Snelle zinnen (speech.js): je laat ze in je eigen stem zeggen, hoogstens één per 30 seconden. Ze gaan als gewoon
// chatbericht, dus wie een oudere versie heeft, ziet alleen de tekst.
let lastSaid = 0;
const heardAt = new Map();
const sayWait = () => Math.max(0, lastSaid + PHRASE_GAP_MS - Date.now());
const othersAtTable = () => !!online?.game && online.players.some((p) => p.seat !== online.seat && !p.left);
function renderSayMenu() {
  const left = Math.ceil(sayWait() / 1000);
  $("#say-menu").innerHTML = `<p>${left ? t(left === 1 ? "Over 1 seconde kun je weer iets zeggen." : "Over {n} seconden kun je weer iets zeggen.", { n: left }) : t("Zeg hardop tegen de anderen:")}</p>` +
    PHRASES.map((q, k) => `<button type="button" data-say="${k}"${left ? " disabled" : ""}>${esc(t(q))}</button>`).join("");
}
$("#btn-say").addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = $("#say-menu");
  menu.hidden = !menu.hidden;
  if (!menu.hidden) renderSayMenu();
});
$("#say-menu").addEventListener("click", (e) => {
  e.stopPropagation();
  const b = e.target.closest("[data-say]");
  if (!b || sayWait()) return;
  const k = Number(b.dataset.say);
  if (!sendChat(PHRASES[k])) return;
  lastSaid = Date.now();
  $("#say-menu").hidden = true;
  // De opnames zijn Nederlands: in het Engels zie je alleen de tekst
  if (!isEnglish && soundReady() && settings.sound && myVoice() !== "geen") playSound(phraseFile(myVoice(), k));
});
document.addEventListener("click", (e) => { if (!e.target.closest("#say-menu")) $("#say-menu").hidden = true; });
setInterval(() => { if (!$("#say-menu").hidden) renderSayMenu(); }, 1000);

/** Een snelle zin van een medespeler hardop, in zijn stem (en niet vaker dan de afzender mag). */
function hearPhrase(m) {
  const k = PHRASES.indexOf(m.text);
  if (k < 0 || isEnglish || !settings.sound || settings.speakHumans === false || !soundReady()) return;
  if (Date.now() - (heardAt.get(m.seat) ?? 0) < PHRASE_GAP_MS - 5000) return;
  heardAt.set(m.seat, Date.now());
  const voice = cleanVoice(online.players.find((p) => p.seat === m.seat)?.voice) ?? "neutraal";
  if (voice !== "geen") playSound(phraseFile(voice, k));
}

$("#chat-quick").innerHTML = QUICK.map((q) => `<button type="button" class="${q.length > 2 ? "txt" : ""}" data-q="${esc(q)}">${esc(t(q))}</button>`).join("");
$("#chat-quick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-q]");
  if (b) sendChat(b.dataset.q);
});
$("#chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#chat-input");
  if (sendChat(input.value)) input.value = "";
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
  if (sendChat(input.value)) input.value = "";
});
$(".dock-bar").addEventListener("click", () => setDock(settings.chatDock === false));
$("#pub-people-head").addEventListener("click", () => { pubPeopleOpen = !pubPeopleOpen; renderPublicLobby(); });
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

/**
 * Een eigen tafel openen voor samen spelen (jij bent de gastheer).
 */
function openTable(rules) {
  closeOnline();
  askNotify();
  store.remove("spel");
  game = null;
  st = null;
  const code = makeCode();
  online = {
    role: "host", code, seat: 1, players: [{ name: settings.playerName, seat: 1, online: true, avatar: myAvatar() }],
    queue: new Map(), game: null, rules, smart: settings.smart, status: t("Tafel openen…"), error: "", chat: [], unread: 0,
  };
  const pub = newPublic ? {
    title: newTitle.trim().slice(0, 40),
    variant: variantName(rules), rounds: 2 * rules.maxCards - 1,
  } : null;
  online.pub = pub;
  online.link = new Host(code, settings.playerName, netEvents(), null, myAvatar(), rules.players ?? 4, pub);
  online.link.setVoice(myVoice());
  shareStats();
  show("online");
}

/** Aanschuiven bij een tafel. [hostId]: het nummer van de gastheer, als we dat weten (link of lobby). */
function joinTable(code, hostId = null) {
  closeOnline();
  askNotify();
  online = { role: "guest", code, seat: 0, players: [], queue: new Map(), game: null, status: t("Verbinden met de tafel…"), error: "", chat: [], unread: 0 };
  if (!identity) { online.error = t("Samen spelen werkt niet in deze browser."); show("online"); return; }
  online.link = new Guest(code, settings.playerName, clientId(), netEvents(), myAvatar(), hostId);
  online.link.voice = myVoice();
  shareStats();
  store.set("online-gast", { code, hostId: hostId ?? null, time: Date.now() });
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
    online.players = online.link.players.map(({ name, seat, online: on, avatar, voice }) => ({ name, seat, online: on, avatar, voice }));
    online.rules = { ...online.rules, players: online.players.length };
    online.chat = online.link.chat.slice(-100);
    renderChat();
  }
  const cast = drawCast();
  const names = castNames(cast);
  const humanSeats = [];
  for (const p of online.players) {
    names[p.seat - 1] = p.seat === 1 ? settings.playerName : p.name;
    humanSeats.push(p.seat);
  }
  const g = { rules: online.rules, smart: online.smart, cast, seed: Math.floor(Math.random() * 2147483647), names, humanSeats };
  online.link.start(g);
  startOnlineGame(g, []);
}

/**
 * Een spel aan een online tafel (opnieuw) opbouwen uit de startgegevens en het logboek. Alle tijdelijke
 * toestand van een vorig spel gaat weg, zodat niets van het oude spel doorwerkt.
 */
function startOnlineGame(g, log) {
  stopDriver();
  tinekeRelease();
  currentRules = g.rules;
  currentSmart = g.smart;
  online.game = g;
  online.queue = new Map();
  game = createGame({
    rules: g.rules, smart: g.smart, seed: g.seed, names: g.names, actions: log.map((a) => a.value),
    humanSeats: g.humanSeats, viewSeat: online.seat,
  });
  markTakenOver();
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

/**
 * De gastheer stuurt het spel en het logboek: bij het begin, na opnieuw verbinden, of omdat we niet gelijk
 * liepen. Klopt alles wat we al hebben met het logboek, dan alleen het ontbrekende aanvullen; anders
 * (bijvoorbeeld een eigen zet die niet doorging) het spel opnieuw opbouwen.
 */
function onNetStart(raw, log) {
  const g = cleanStartGame(raw, CHARACTER_IDS);
  if (!g) return;
  const same = online.game && game && online.game.seed === g.seed;
  const mine = same ? Array.from(game.actions()) : [];
  if (same && mine.length <= log.length && mine.every((v, i) => v === log[i].value)) {
    // Weer verbonden: alleen de gemiste handelingen nog uitvoeren
    log.forEach((a, index) => { if (index >= game.actionCount()) online.queue.set(index, { index, ...a }); });
    message = null;
    if (screen === "game") renderGame();
    drive();
    return;
  }
  startOnlineGame(g, log);
}

/** Een handeling van een ander (via de gastheer). Ze kunnen in de verkeerde volgorde binnenkomen; daarom een wachtrij op volgnummer. */
function onNetAction(a) {
  if (!game || !online?.game) return;
  if (a.index < game.actionCount() || a.index > game.actionCount() + 500) return;
  online.queue.set(a.index, a);
  if (applyTakeovers()) { refresh(); if (screen === "game") renderGame(); }
  saveOnline();
  drive();
}

/**
 * Iemand heeft het spel verlaten (handeling -stoel): meteen een computer laten spelen, zonder op
 * zijn beurt te wachten. Geeft true als er iets veranderde.
 */
function applyTakeovers() {
  if (!online?.game || !game) return false;
  let changed = false;
  for (;;) {
    const a = online.queue.get(game.actionCount());
    if (!a || !(a.value < 0)) break;
    online.queue.delete(game.actionCount());
    const error = game.applyRemote(a.seat, a.value);
    if (error) { console.warn("Overnemen lukt niet:", error); break; }
    changed = true;
    const seat = -a.value;
    const name = online.game.names?.[seat - 1] ?? t("Een speler");
    const idle = online.takenIdle?.includes(seat);
    message = !idle ? t("{name} heeft het spel verlaten. Een computer speelt nu verder voor {name}.", { name })
      : seat === online.seat ? t("Je reageerde niet en de anderen waren akkoord: een computer speelt nu verder voor je. Je kunt blijven kijken en chatten.")
        : t("{name} reageerde niet en iedereen was akkoord: een computer speelt nu verder voor {name}.", { name });
    online.chat.push({ seat: 0, name: "", text: message, time: Date.now(), system: true });
  }
  if (changed) { markTakenOver(); renderChat(); turnNotice(message); }
  return changed;
}

/** Stoelen waar een computer het van een mens heeft overgenomen, krijgen "(computer)" achter de naam. */
function markTakenOver() {
  if (!online?.game || !game) return;
  const s = JSON.parse(game.state());
  for (const p of s.players) {
    if (online.game.humanSeats.includes(p.seat) && !p.human && !p.name.endsWith(" (computer)")) {
      game.setSeatName(p.seat, `${p.name} (computer)`);
    }
  }
}

// Wie niet reageert -------------------------------------------------------------------------
// Na 1 minuut krijgt de speler die aan de beurt is een waarschuwing, de laatste 30 seconden een
// grote aftelling. De anderen zien dat ook. Na 2 minuten stemmen zij of een computer het overneemt;
// alleen als iedereen akkoord is, gebeurt dat. Na afloop van het spel is er geen tijdslimiet.

const IDLE_FAST = devParam("idle") === "fast"; // om te testen (alleen op de eigen computer)
const IDLE_WARN_MS = IDLE_FAST ? 6000 : 60000;
const IDLE_COUNT_MS = IDLE_FAST ? 9000 : 90000;
const IDLE_LIMIT_MS = IDLE_FAST ? 12000 : 120000;
let idleKey = "";
let idleClosed = ""; // weggeklikte melding: idleKey|stap
let idleSince = 0;
let idleStage = 0; // 1 = gewaarschuwd, 2 = aftellen, 3 = tijd om (voor de meldingen in de chat)
let idleHtml = null;
let wasOver = false;

const seatName = (seat) => online?.game?.names?.[seat - 1] ?? t("Speler {n}", { n: seat });

function systemChat(text) {
  if (!online) return;
  online.chat.push({ seat: 0, name: "", text, time: Date.now(), system: true });
  if (online.chat.length > 100) online.chat.shift();
  renderChat();
}

function onVotes(v) {
  if (!online) return;
  online.votes ??= {};
  if (v.done) {
    delete online.votes[v.seat];
    if (v.taken) (online.takenIdle ??= []).push(v.seat);
  } else online.votes[v.seat] = v;
  idleTick();
}

/**
 * Twee keer per seconde: wie is er aan de beurt en hoe lang al? Toont de waarschuwing, het aftellen en
 * de stemming (stap 1, 2 en 3) aan de speler zelf en aan de anderen.
 */
function idleTick() {
  const over = !!(online?.game && st?.phase === "GAME_OVER");
  if (over !== wasOver) { wasOver = over; renderChat(); }
  let seat = 0;
  let count = 0;
  if (screen === "game" && online?.game && game && st && (st.phase === "BIDDING" || st.phase === "PLAYING")) {
    seat = game.humanToMove() || 0;
    count = Math.max(game.actionCount(), online.queue.size ? Math.max(...online.queue.keys()) + 1 : 0);
  }
  const key = seat ? `${online.game.seed}|${seat}|${count}` : "";
  if (key !== idleKey) { idleKey = key; idleSince = Date.now(); idleStage = 0; }
  const waited = seat ? Date.now() - idleSince : 0;
  const mine = seat && seat === online.seat;
  const name = seat ? seatName(seat) : "";
  const hostSeat = seat === 1;
  const meLeft = !!online?.players?.find((p) => p.seat === online.seat)?.left;
  const secs = Math.max(0, Math.ceil((IDLE_LIMIT_MS - waited) / 1000));
  let html = "";
  if (seat && waited >= IDLE_WARN_MS) {
    const stage = waited >= IDLE_LIMIT_MS ? 3 : waited >= IDLE_COUNT_MS ? 2 : 1;
    if (mine) {
      if (stage > idleStage) idleNotice(stage, hostSeat);
      if (hostSeat) {
        html = `<p><b>${waited >= IDLE_LIMIT_MS ? t("Je bent al 2 minuten aan de beurt.") : t("Je bent al een minuut aan de beurt.")}</b> ${t("De anderen wachten op je.")}</p>`;
      } else if (stage === 1) {
        html = `<p><b>${t("Ben je er nog?")}</b> ${t("Je bent al een minuut aan de beurt. Als je binnen een minuut niets doet, mogen de anderen een computer voor je laten spelen.")}</p>`;
      } else if (stage === 2) {
        html = `<div class="idle-row"><div class="idle-big">${secs}</div>
          <p><b>${t("Speel nu!")}</b> ${t(secs === 1 ? "Over 1 seconde mogen de anderen een computer voor je laten spelen." : "Over {n} seconden mogen de anderen een computer voor je laten spelen.", { n: secs })}</p></div>`;
      } else {
        const v = online.votes?.[seat];
        html = `<p><b>${t("De anderen mogen nu stemmen")}</b> ${t("om een computer voor je te laten spelen. Speel snel, dan gaat het spel gewoon met jou verder.")}</p>
          ${v ? `<p class="idle-votes">${t(v.yes.length === 1 ? "1 van de {need} spelers wil dat een computer het overneemt." : "{yes} van de {need} spelers willen dat een computer het overneemt.", { yes: v.yes.length, need: v.need.length })}</p>` : ""}`;
      }
    } else if (!meLeft) {
      if (stage > idleStage) {
        if (stage === 1) systemChat(t("{name} reageert al een minuut niet.", { name }));
        if (stage === 3) systemChat(hostSeat
          ? t("{name} (gastheer) reageert al 2 minuten niet. Het spel loopt via de gastheer, dus wachten jullie tot die terug is.", { name })
          : t("{name} reageert al 2 minuten niet. Jullie kunnen nu stemmen of een computer verder speelt voor {name}.", { name }));
      }
      if (stage < 3) {
        const next = hostSeat ? t("Even geduld.")
          : t(secs === 1
            ? "Blijft het stil, dan kunnen jullie over 1 seconde samen beslissen of een computer verder speelt voor {name}. Dat gebeurt alleen als iedereen akkoord is."
            : "Blijft het stil, dan kunnen jullie over {n} seconden samen beslissen of een computer verder speelt voor {name}. Dat gebeurt alleen als iedereen akkoord is.", { n: secs, name: esc(name) });
        const text = `<p><b>${t(stage === 1 ? "{name} reageert al een minuut niet." : "{name} reageert al anderhalve minuut niet.", { name: esc(name) })}</b> ${t("{name} heeft een waarschuwing gekregen.", { name: esc(name) })} ${next}</p>`;
        html = stage === 2 ? `<div class="idle-row"><div class="idle-big other">${secs}</div>${text}</div>` : text;
      } else if (hostSeat) {
        html = `<p><b>${t("{name} reageert al 2 minuten niet.", { name: esc(name) })}</b> ${t("Het spel loopt via het apparaat van de gastheer, dus een computer kan het niet overnemen. Wacht tot de gastheer terug is, of verlaat de tafel.")}</p>`;
      } else {
        const v = online.votes?.[seat];
        const yes = v?.yes ?? [];
        const need = v?.need ?? [];
        const iSaid = yes.includes(online.seat);
        const who = (list) => list.map((s) => (s === online.seat ? t("jij") : esc(seatName(s)))).join(", ");
        const waiting = need.filter((s) => !yes.includes(s));
        html = `<p><b>${t("{name} reageert al 2 minuten niet.", { name: esc(name) })}</b> ${t("Zal een computer verder spelen voor {name}? Dat gebeurt alleen als iedereen akkoord is. Speelt {name} intussen, dan gaat het spel gewoon verder.", { name: esc(name) })}</p>
          ${v && yes.length ? `<p class="idle-votes">${t("Akkoord: {who}", { who: who(yes) })}${waiting.length ? t(". Wacht nog op: {who}", { who: who(waiting) }) : ""}.</p>` : ""}
          <div class="idle-actions">
            <button class="${iSaid ? "" : "primary"}" data-vote="0">${t("Nog even wachten")}</button>
            <button class="${iSaid ? "primary selected" : ""}" data-vote="1">${iSaid ? "✓ " : ""}${t("Computer laten spelen")}</button>
          </div>`;
      }
    }
    idleStage = Math.max(idleStage, stage);
    // Weggeklikt: pas bij de volgende stap (aftellen, stemmen) komt de melding terug
    if (idleClosed === `${idleKey}|${stage}`) html = "";
    else if (html) html = `<button class="idle-close" data-close="${stage}" aria-label="${t("Sluit deze melding")}">✕</button>${html}`;
  }
  const panel = $("#idle-panel");
  if (html !== idleHtml) {
    idleHtml = html;
    panel.innerHTML = html;
    panel.dataset.seat = String(seat);
    panel.classList.toggle("mine", !!mine);
    panel.hidden = !html;
  }
}

$("#idle-panel").addEventListener("click", (e) => {
  const close = e.target.closest("[data-close]");
  if (close) { idleClosed = `${idleKey}|${close.dataset.close}`; idleTick(); return; }
  const b = e.target.closest("[data-vote]");
  const seat = Number($("#idle-panel").dataset.seat);
  if (!b || !seat || !online?.link?.vote) return;
  online.link.vote(seat, b.dataset.vote === "1");
});
setInterval(idleTick, 500);

/** Wie niet reageert krijgt ook een melding (als de app op de achtergrond staat) en een trilling. */
function idleNotice(stage, hostSeat) {
  const what = st.phase === "BIDDING" ? t("Voorspel hoeveel slagen je haalt") : t("Speel een kaart");
  const text = hostSeat ? t(stage === 3 ? "Schiet op! Je bent al 2 minuten aan de beurt en de anderen wachten op je. {what}." : "Schiet op! Je bent al een minuut aan de beurt en de anderen wachten op je. {what}.", { what })
    : stage === 1 ? t("Schiet op! Je bent al een minuut aan de beurt. {what}, anders mogen de anderen straks een computer voor je laten spelen.", { what })
      : stage === 2 ? t("Nog 30 seconden! {what}, anders mogen de anderen een computer voor je laten spelen.", { what })
        : t("De anderen mogen nu een computer voor je laten spelen. {what}, dan speel je zelf verder.", { what });
  turnNotice(text);
  try { navigator.vibrate?.(stage === 1 ? 200 : [200, 120, 200]); } catch { /* geen trilfunctie */ }
}

/** Na afloop: nog een potje met wie er nog aan tafel zit. Lege plaatsen worden computers. */
function newRoundSameGroup() {
  if (online?.role !== "host" || !online.link) return;
  online.link.prepareNewGame();
  online.players = online.link.players.map(({ name, seat, online: on, avatar, stats }) => ({ name, seat, online: on, avatar, stats }));
  online.votes = {};
  online.takenIdle = [];
  startHostGame(true);
}

/** Een eigen handeling naar de anderen sturen. */
/** Je eigen zet naar de anderen. Past hij bij de gastheer niet meer (er kwam net iets tussen), dan opnieuw gelijk lopen. */
function netSend(index, value) {
  if (!online?.game) return;
  if (online.link?.sendAction(index, online.seat, value) === false) resyncOnline();
  saveOnline();
}

/**
 * We lopen niet gelijk met de gastheer. Een gast vraagt de hele stand opnieuw op; de gastheer bouwt
 * zijn eigen spel opnieuw op uit zijn logboek (dat is de waarheid voor iedereen).
 */
function resyncOnline() {
  if (!online?.game || !online.link) return;
  if (online.role === "host") setTimeout(() => startOnlineGame(online.game, online.link.log.slice()), 0);
  else online.link.resync?.();
}

/**
 * De gastheer bewaart zijn tafel, zodat hij na herladen verder kan en de gasten vanzelf terugkomen.
 */
function saveOnline() {
  if (online?.role === "host" && online.link && online.game) store.set("online", { ...online.link.snapshot(), time: Date.now(), over: st?.phase === "GAME_OVER" });
}

/** Na het herladen van de pagina: de eigen tafel weer openen, of opnieuw aanschuiven bij een ander. */
/** Hoe lang je na het sluiten van de app automatisch terugkomt aan een online tafel. */
const ONLINE_RESUME_MS = 3 * 60 * 60 * 1000;

/**
 * Na herladen terug naar je online tafel (als gastheer of als gast), als die niet te oud is.
 */
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
      online.link.setVoice(myVoice());
      shareStats();
      online.game = saved.started;
      currentRules = saved.started.rules;
      currentSmart = saved.started.smart;
      game = createGame({
        ...saved.started, actions: saved.log.map((a) => a.value), viewSeat: 1,
      });
      markTakenOver();
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
    joinTable(guest.code, typeof guest.hostId === "string" ? guest.hostId : null);
    return true;
  }
  return false;
}

// Openbare lobby -----------------------------------------------------------------------------

let pubLobby = null;
let pubTables = [];
let pubPeople = [];
let pubChat = [];
let pubStatus = "";

/** In de lobby zolang je op het scherm Samen spelen bent en nog niet aan een tafel zit. */
function startPublicLobby() {
  if (pubLobby) return;
  pubTables = []; pubPeople = []; pubChat = []; pubStatus = t("Verbinden met de lobby…");
  pubLobby = new PublicLobby({ id: clientId(), name: settings.playerName, avatar: myAvatar() }, {
    onTables: (list) => { pubTables = list; renderPublicLobby(); },
    onPeople: (list) => { pubPeople = list; renderPublicLobby(); },
    onChat: (m) => { pubChat.push(m); if (pubChat.length > 60) pubChat.shift(); renderPublicLobby(true); },
    onStatus: (text) => { pubStatus = text; renderPublicLobby(); },
  });
}

function stopPublicLobby() {
  pubLobby?.close();
  pubLobby = null;
}

let pubPeopleOpen = false; // de namen van de aanwezigen in de lobby tonen

function renderPublicLobby(scrollChat = false) {
  if (!pubLobby) return;
  const tables = pubTables.map((tb) => {
    const taken = tb.seats - tb.free;
    const title = tb.title || t("Tafel van {name}", { name: tb.host });
    return `<div class="pub-table"><div class="avatar">${humanAvatarHtml(tb.avatar, tb.host)}</div>
      <div class="info"><b>${esc(title)}</b>
        <small>${esc(variantText(tb.variant))}${tb.rounds ? ` · ${t("{n} rondes", { n: tb.rounds })}` : ""}</small>
        <small>${t("{n} spelers · {taken} bezet", { n: tb.seats, taken })} · <span class="free">${tb.free ? t("{n} vrij", { n: tb.free }) : t("vol")}</span></small>
        <small>${tb.players.map(esc).join(", ")}</small>
        ${tb.away ? `<small class="away">${t("{name} is even weg. Schuif gerust aan: je komt binnen zodra {name} terug is.", { name: esc(tb.host) })}</small>` : ""}</div>
      <button class="${tb.free ? "primary" : ""}" data-pub-join="${esc(tb.code)}" ${tb.free ? "" : "disabled"}>${tb.free ? t("Aanschuiven") : t("Vol")}</button></div>`;
  }).join("");
  $("#pub-tables").innerHTML = tables || `<p class="empty-note">${t("Er staat nu geen openbare tafel open. Open er zelf een!")}</p>`;
  $("#pub-status").textContent = pubStatus;
  $("#pub-status").hidden = !pubStatus;
  const n = pubPeople.length;
  // De namen pas na een tik op de knop, zodat een volle lobby het scherm niet vult
  const head = $("#pub-people-head");
  head.hidden = !n;
  head.textContent = `👥 ${t("Aanwezigen ({n})", { n })} ${pubPeopleOpen ? "▴" : "▾"}`;
  head.setAttribute("aria-expanded", String(pubPeopleOpen));
  $("#pub-people").hidden = !pubPeopleOpen || !n;
  $("#pub-people").innerHTML = pubPeople.map((p) =>
    `<span class="pub-person${p.me ? " me" : ""}"><span class="avatar">${humanAvatarHtml(p.avatar, p.name)}</span>${esc(p.name)}${p.me ? ` ${t("(jij)")}` : ""}</span>`).join("");
  const box = $("#pub-chat");
  const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 30;
  box.innerHTML = pubChat.map((m) => `<p><b>${esc(m.name)}:</b> ${esc(m.text)}</p>`).join("");
  if (scrollChat || atEnd) box.scrollTop = box.scrollHeight;
}

let onlineMode = "openbaar"; // tabblad op het scherm Samen spelen: "openbaar" of "prive"

function renderOnline() {
  $("#on-name").value = settings.playerName;
  $$("#online-mode button").forEach((b) => b.classList.toggle("selected", b.dataset.mode === onlineMode));
  $("#online-public").hidden = onlineMode !== "openbaar";
  $("#online-private").hidden = onlineMode !== "prive";
  if (!online && screen === "online" && onlineMode === "openbaar") { startPublicLobby(); renderPublicLobby(); } else stopPublicLobby();
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
  const hostName = online.players.find((x) => x.seat === 1)?.name ?? settings.playerName;
  const pubTitle = online.pub ? (online.pub.title || t("Tafel van {name}", { name: hostName })) : "";
  // Een openbare tafel vind je in de lobby: geen code of link nodig
  $("#lobby-code").hidden = !!online.pub;
  $("#lobby-title").textContent = pubTitle;
  $("#lobby-title").hidden = !pubTitle;
  $("#lobby-kind").textContent = online.pub ? t("Openbare tafel, te zien in de lobby") : t("Code van de tafel");
  const isHost = online.role === "host";
  $("#share-row").hidden = !isHost || !!online.pub;
  const rules = online.rules ?? online.game?.rules;
  $("#lobby-variant").textContent = rules ? variantText(variantName(rules)) : "";
  const rows = Array.from({ length: tableSize() }, (_, i) => i + 1).map((seat) => {
    const p = online.players.find((x) => x.seat === seat);
    if (p) {
      const me = seat === online.seat;
      const stats = seatStats(seat);
      const games = stats?.a ? t(stats.a === 1 ? "1 spel" : "{n} spellen", { n: stats.a }) : t("nog geen spellen");
      return `<div class="lobby-seat" data-seat="${seat}" role="button" tabindex="0"><div class="avatar">${humanAvatarHtml(p.avatar, p.name)}</div>
        <div class="nm">${esc(p.name)}${me ? ` ${t("(jij)")}` : ""}<small>${seat === 1 ? t("Gastheer") : t("Speler")} · ${games}</small>${starsHtml(starRating(stats))}</div>
        <span class="dot ${p.online === false ? "off" : ""}"></span></div>`;
    }
    return `<div class="lobby-seat waiting"><div class="avatar happy">${faceSvg(SEAT_FACE[seat])}</div>
      <div class="nm">${t("Nog vrij")}<small>${t("Anders speelt hier een computer")}</small></div></div>`;
  }).join("");
  $("#lobby-seats").innerHTML = rows;
  const humans = online.players.length;
  const start = $("#btn-online-start");
  const free = tableSize() - humans;
  const fill = $("#btn-online-start-fill");
  const canStart = isHost && !online.game;
  // Met minstens twee mensen kun je ook zonder computers spelen; alleen kan dat niet.
  start.hidden = !canStart;
  $("#btn-online-back").hidden = !(online.game && game);
  $("#btn-online-back").textContent = st?.phase === "GAME_OVER" ? t("Terug naar de uitslag") : t("Terug naar het spel");
  fill.hidden = !canStart || free <= 0 || humans < 2;
  start.textContent = free <= 0 ? t("Start het spel")
    : humans >= 2 ? t("Start met {n} spelers, zonder computers", { n: humans })
      : t(free === 1 ? "Start met 1 computerspeler" : "Start met {n} computerspelers", { n: free });
  fill.textContent = t(free === 1 ? "Lege plaatsen aanvullen met 1 computerspeler" : "Lege plaatsen aanvullen met {n} computerspelers", { n: free });
  let note = "";
  if (online.game && st?.phase === "GAME_OVER") note = isHost
    ? t("Dit spel is afgelopen. Ga terug naar de uitslag om een nieuw potje met dezelfde spelers te starten, of sluit de tafel.")
    : t("Dit spel is afgelopen. Wacht tot de gastheer een nieuw potje start, of verlaat de tafel.");
  else if (online.game) note = t("Het spel is bezig.");
  else if (isHost) note = humans === 1
    ? (online.pub ? t("Je tafel staat in de openbare lobby. Wacht tot anderen aanschuiven.") : t("Deel de link en wacht tot anderen aanschuiven."))
    : t("Start zodra iedereen er is.");
  else if (online.seat) note = t("Wachten tot de gastheer het spel start…");
  $("#lobby-note").textContent = note;
  renderNotifyRow();
  $("#btn-leave").textContent = isHost ? t("Tafel sluiten") : t("Tafel verlaten");
}

// Altijd eerst naar Samen spelen: van daaruit kun je verder spelen of de tafel sluiten en een nieuwe openen
$("#btn-online").addEventListener("click", () => show("online"));
$("#btn-online-back").addEventListener("click", () => { if (online?.game && game) show("game"); });
$("#on-name").addEventListener("input", (e) => {
  settings.playerName = e.target.value.trim() || t("Speler");
  pubLobby?.setMe({ name: settings.playerName });
  renderAvatarPick();
  saveSettings();
});
$("#btn-host").addEventListener("click", () => { newOnline = true; newPublic = false; show("newgame"); });
$$("#online-mode button").forEach((b) => b.addEventListener("click", () => { onlineMode = b.dataset.mode; renderOnline(); }));
$("#btn-host-public").addEventListener("click", () => { newOnline = true; newPublic = true; show("newgame"); });
$$("#opt-public button").forEach((b) => b.addEventListener("click", () => { newPublic = b.dataset.public === "1"; renderNewGame(); }));
$("#opt-title").addEventListener("input", (e) => { newTitle = e.target.value; });
$("#pub-tables").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pub-join]");
  if (b && !b.disabled) {
    const code = normalizeCode(b.dataset.pubJoin);
    joinTable(code, pubTables.find((t) => t.code === code)?.hostId ?? null);
  }
});
$("#pub-chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#pub-chat-input");
  if (!cleanText(input.value, 200) || chatTooFast()) return;
  if (pubLobby?.sendChat(input.value)) input.value = "";
});
$("#btn-join").addEventListener("click", () => {
  const code = normalizeCode($("#on-code").value);
  if (code.length !== 5) {
    $("#online-msg").hidden = false;
    $("#online-msg").textContent = t("Vul de code van vijf tekens in.");
    return;
  }
  joinTable(code);
});
$("#on-code").addEventListener("input", (e) => { e.target.value = normalizeCode(e.target.value); });
$("#btn-online-start").addEventListener("click", () => startHostGame(online.players.length < 2));
$("#btn-online-start-fill").addEventListener("click", () => startHostGame(true));
$("#btn-leave").addEventListener("click", () => {
  const leave = () => { closeOnline(); renderOnline(); renderMenu(); };
  if (online?.game && st && st.phase !== "GAME_OVER") {
    const host = online.role === "host";
    confirmDialog = {
      title: host ? t("Tafel sluiten") : t("Spel verlaten"),
      text: host
        ? t("Het spel is nog bezig. Als je de tafel sluit, stopt het spel voor iedereen.")
        : t("Het spel is nog bezig. Als je weggaat, speelt een computer verder op jouw plaats en kun je niet meer terug."),
      yes: host ? t("Tafel sluiten") : t("Spel verlaten"),
      no: t("Blijven"),
      action: leave,
    };
    renderDialog();
    return;
  }
  leave();
});
$("#btn-share").addEventListener("click", async () => {
  const url = tableLink(online.code);
  if (nativeApp) {
    nativeApp.share(`${t("Speel je mee met 10 op en neer? Code {code}", { code: online.code })}\n${url}`);
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: "10 op en neer", text: t("Speel je mee? Code {code}", { code: online.code }), url });
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
    online.status = t("De link is gekopieerd. Stuur hem naar wie je wilt laten meedoen.");
  } catch {
    online.status = t("Stuur deze link: {url}", { url });
  }
  renderOnline();
}

// ------------------------------------------------------------------------------------------
// Taal (i18n.js): met de vlaggetjes in het hoofdmenu en bij Instellingen
// ------------------------------------------------------------------------------------------

function renderLangPick() {
  $$("[data-lang]").forEach((b) => {
    b.classList.toggle("selected", b.dataset.lang === lang);
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  });
}

/**
 * Een andere taal: bewaren en de pagina opnieuw laden. Een spel tegen de computer gaat daarna gewoon verder
 * (het wordt na elke stap bewaard). Aan een tafel voor samen spelen niet: dan eerst de tafel verlaten.
 */
function setLang(next) {
  if (next === lang) return;
  if (online) {
    confirmDialog = {
      title: t("Taal wijzigen"),
      text: t("Je zit aan een tafel voor samen spelen. Verlaat eerst de tafel; daarna kun je de taal wijzigen."),
      yes: t("OK"),
      action: () => {},
    };
    renderDialog();
    return;
  }
  saveGame();
  settings.lang = next;
  saveSettings();
  location.reload();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-lang]");
  if (b) setLang(b.dataset.lang);
});
renderLangPick();

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
$("#btn-play").addEventListener("click", () => show("play"));
// Het spel delen: een QR-code naar de webapp (qr.svg), en een link sturen
const APP_URL = "https://robbert-coder.github.io/10-op-en-neer/";
$("#btn-share-app").addEventListener("click", () => { $("#qr-sheet").hidden = false; });
$("#qr-close").addEventListener("click", () => { $("#qr-sheet").hidden = true; });
$("#qr-sheet").addEventListener("click", (e) => { if (e.target.id === "qr-sheet") $("#qr-sheet").hidden = true; });
$("#qr-share").addEventListener("click", async () => {
  const text = t("Speel je mee met 10 op en neer? Gratis, in je browser of als app.");
  if (nativeApp) { nativeApp.share(`${text}\n${APP_URL}`); return; }
  if (navigator.share) {
    try { await navigator.share({ title: "10 op en neer", text, url: APP_URL }); return; } catch { /* geannuleerd */ }
  }
  try { await navigator.clipboard.writeText(APP_URL); $("#qr-share").textContent = t("Link gekopieerd"); } catch { /* dan staat de link er nog */ }
});
$("#btn-new").addEventListener("click", () => { newOnline = false; show("newgame"); });

$$(".variant").forEach((el) => el.addEventListener("click", () => {
  newBase = el.dataset.variant === "13" ? BOERENBRIDGE : TIEN_OP_EN_NEER;
  newMax = null;
  newPlayers = Math.min(newPlayers, maxPlayersFor(newBase));
  newRounding = newBase.roundingAllowed;
  newMustTrump = newBase.mustTrump;
  renderNewGame();
}));
$("#opt-smart").addEventListener("change", (e) => { settings.smart = e.target.checked; settings.smartChosen = true; saveSettings(); });
$("#opt-rounding").addEventListener("change", (e) => { newRounding = e.target.checked; renderNewGame(); });
$("#opt-players").addEventListener("click", (e) => {
  const b = e.target.closest("[data-players]");
  if (!b || b.disabled) return;
  newPlayers = Math.min(Number(b.dataset.players), maxPlayersFor(newBase));
  renderNewGame();
});
$("#opt-length").addEventListener("click", (e) => {
  const b = e.target.closest("[data-length]");
  if (!b) return;
  if (b.dataset.length === "normaal") newMax = null;
  else if (newMax == null) newMax = Math.min(SHORT_MAX, maxCardsFor(newBase, newPlayers) - 1);
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
      title: t("Nieuw spel"),
      text: t("Je huidige spel wordt dan beëindigd. Wil je een nieuw spel beginnen?"),
      yes: t("Nieuw spel"),
      no: t("Annuleren"),
      action: () => startNewGame(rules),
    };
    renderDialog();
  } else {
    startNewGame(rules);
  }
});

$$("#hs-tabs button").forEach((b) => b.addEventListener("click", () => { hsTab = b.dataset.tab; renderHighScores(); }));
$$("#hs-length button").forEach((b) => b.addEventListener("click", () => { hsShort = b.dataset.len === "kort"; renderHighScores(); }));
$$("#hs-scope button").forEach((b) => b.addEventListener("click", () => { hsScope = b.dataset.scope; renderHighScores(); }));
$("#btn-stats-clear").addEventListener("click", () => {
  confirmDialog = {
    title: t("Statistieken wissen"),
    text: cloudEnabled() && settings.cloudCode
      ? t("Weet je zeker dat je al je statistieken wilt wissen? Ze verdwijnen ook online en op je andere apparaten.")
      : t("Weet je zeker dat je al je statistieken op dit apparaat wilt wissen?"),
    yes: t("Wissen"),
    no: t("Annuleren"),
    action: () => {
      store.remove("statistiek");
      store.set("statistiek-gewist", Date.now());
      renderStats();
      shareStats();
      syncStats();
    },
  };
  renderDialog();
});
$("#btn-hs-clear").addEventListener("click", () => {
  const kind = $(`#hs-tabs [data-tab="${hsTab}"]`).textContent;
  confirmDialog = {
    title: t("Highscore wissen"),
    text: t(hsShort ? "Weet je zeker dat je de highscore van korte spellen {kind} wilt wissen?" : "Weet je zeker dat je de highscore van {kind} wilt wissen?", { kind: esc(kind) }),
    yes: t("Wissen"),
    no: t("Annuleren"),
    action: () => { store.remove("highscore." + hsKey()); renderHighScores(); },
  };
  renderDialog();
});

$("#ng-name").addEventListener("input", (e) => {
  settings.playerName = e.target.value.trim() || t("Speler");
  renderAvatarPick();
  saveSettings();
});
// Staat er nog "Speler", dan is het in één keer te vervangen
for (const id of ["#ng-name", "#on-name", "#set-name"]) $(id).addEventListener("focus", (e) => e.target.select());
$("#set-name").addEventListener("input", (e) => {
  settings.playerName = e.target.value.trim() || t("Speler");
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
$("#set-sound").addEventListener("change", (e) => { settings.sound = e.target.checked; saveSettings(); renderSettings(); renderMuteButtons(); });

/** De mute-knoppen (startscherm en spel) laten zien of het geluid aan of uit staat. */
function renderMuteButtons() {
  const label = settings.sound ? t("Geluid uit") : t("Geluid aan");
  $$(".mute-btn").forEach((b) => {
    b.classList.toggle("muted", !settings.sound);
    b.setAttribute("aria-label", label);
    b.title = label;
  });
  $("#btn-sound-ingame").textContent = label;
}

/** Mute-knop: al het geluid in één tik uit (of weer aan), zonder naar Instellingen te hoeven. */
function toggleSound() {
  settings.sound = !settings.sound;
  saveSettings();
  if (!settings.sound) { stopSound(); tinekeSilence(); }
  renderMuteButtons();
}
$$(".mute-btn").forEach((b) => b.addEventListener("click", toggleSound));
$("#btn-sound-ingame").addEventListener("click", () => { menuOpen = false; $("#gamemenu").hidden = true; toggleSound(); });
renderMuteButtons();
// Je stem kies je bij Instellingen, bij een nieuw spel en aan een tafel; overal dezelfde keuze
const renderVoicePick = () => $$(".voice-pick button").forEach((b) => b.classList.toggle("selected", b.dataset.voice === myVoice()));
document.addEventListener("click", (e) => {
  const b = e.target.closest(".voice-pick button");
  if (!b) return;
  settings.voice = b.dataset.voice;
  saveSettings();
  renderVoicePick();
  online?.link?.setVoice?.(settings.voice);
  if (soundReady() && settings.sound && myVoice() !== "geen") playSound(`bod_speler_${myVoice()}_${2 + Math.floor(Math.random() * 6)}_0`);
});
$("#set-tineke-voice").addEventListener("change", (e) => { settings.tinekeVoice = e.target.checked; saveSettings(); if (!e.target.checked) tinekeSilence(); });
$("#set-opener").addEventListener("change", (e) => { settings.opener = e.target.checked; saveSettings(); });
$("#set-cards").addEventListener("change", (e) => { settings.cardSounds = e.target.checked; saveSettings(); });
$("#set-speak-humans").addEventListener("change", (e) => { settings.speakHumans = e.target.checked; saveSettings(); });
$("#set-speak").addEventListener("change", (e) => { settings.speakBids = e.target.checked; saveSettings(); renderSettings(); });
$("#set-hof").addEventListener("change", (e) => {
  settings.hof = e.target.checked;
  saveSettings();
  hofCache.clear();
  if (settings.hof) flushHof();
});
$("#set-notify").addEventListener("change", (e) => {
  settings.notify = e.target.checked;
  saveSettings();
  askNotify();
  setTimeout(renderNotifyStatus, 1500);
  renderNotifyStatus();
});

/** Onder de schakelaar bij Instellingen: kan dit apparaat meldingen geven? */
function renderNotifyStatus() {
  const el = $("#notify-status");
  const state = notifyPermission();
  el.textContent = settings.notify === false ? ""
    : notifyUnsupportedText()
      ?? (state === "denied"
        ? (nativeApp ? t("Meldingen staan uit voor deze app in de Android-instellingen.") : t("Meldingen zijn geblokkeerd voor deze website. Zet ze aan via het slotje naast het adres."))
        : state === "granted" ? t("Meldingen staan aan.") : t("Nog geen toestemming gegeven. Zet de schakelaar uit en weer aan om het te vragen."));
}
$("#ng-tineke").addEventListener("change", (e) => { settings.tinekeHelp = e.target.checked; settings.tinekeAsked = true; helpLevel = 0; saveSettings(); });
$("#set-help").addEventListener("change", (e) => { settings.tinekeHelp = e.target.checked; settings.tinekeAsked = true; helpLevel = 0; saveSettings(); });
$("#set-tineke-new").addEventListener("change", (e) => { settings.tinekeNew = e.target.checked; saveSettings(); });
$("#set-tineke-reset").addEventListener("click", () => {
  settings.tinekeSeen = [];
  saveSettings();
  $("#set-tineke-reset").textContent = t("Alle tips komen weer");
});

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
// Tineke tijdens het spel weer aan (of uit) zetten; aan begint ze opnieuw met uitgebreide uitleg
$("#btn-tineke-ingame").addEventListener("click", () => {
  menuOpen = false;
  settings.tinekeHelp = !settings.tinekeHelp;
  settings.tinekeAsked = true;
  saveSettings();
  if (settings.tinekeHelp) {
    helpLevel = 0;
    lastTurnKey = "";
    renderGame();
    onTurn();
  } else {
    tinekeContinue();
    renderGame();
  }
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
      if (!confirmDialog) break; // dubbel getikt: het venster is al weg
      const action = confirmDialog.action;
      confirmDialog = null;
      renderDialog();
      action();
      break;
    }
    case "confirm-no": {
      if (!confirmDialog) break; // dubbel getikt: het venster is al weg
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
    case "close-card":
      playerCard = null;
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
      newRoundSameGroup();
      break;
    case "online-chat":
      openChat(true);
      break;
    case "online-exit": {
      const pub = !!online?.pub;
      closeOnline();
      if (pub) { onlineMode = "openbaar"; show("online"); } else show("menu");
      break;
    }
  }
});

// ------------------------------------------------------------------------------------------
// Start
// ------------------------------------------------------------------------------------------

$$(".logo-cards .card-slot").forEach((el) => {
  el.innerHTML = cardHtml(Number(el.dataset.card), "", "--w:70px");
});
// Op het startscherm kijken de spelers blij: zin in een potje
$("#menu-faces").innerHTML = [2, 3, 4].map((nr) => `<div class="menu-face">${avatarHtml(nr, "")}</div>`).join("");

const linkParams = new URLSearchParams(location.search);
const joinCode = normalizeCode(linkParams.get("spel"));
const joinHost = /^[A-Za-z0-9_-]{22}$/.test(linkParams.get("h") ?? "") ? linkParams.get("h") : null;
if (!resumeOnline()) restoreSavedGame();
if (settings.cloudCode) syncStats();
flushHof();
if (joinCode.length === 5 && !(online?.code === joinCode)) {
  // Geopend via een gedeelde link: meteen aanschuiven
  show("online");
  $("#on-code").value = joinCode;
  if (online?.link && online.code) {
    // Je zit nog aan een andere tafel: niet zomaar weggaan (dat zou dat spel voor de anderen beëindigen)
    confirmDialog = {
      title: t("Naar een andere tafel?"),
      text: t("Je speelt nog een spel aan tafel {code}. Als je naar tafel {other} gaat, verlaat je dat spel.", { code: online.code, other: joinCode }),
      yes: t("Naar de andere tafel"), no: t("Blijven"),
      action: () => joinTable(joinCode, joinHost),
      noAction: () => show("game"),
    };
    renderDialog();
  } else if (settings.playerName && !DEFAULT_NAMES.includes(settings.playerName)) joinTable(joinCode, joinHost);
  else $("#on-name").focus();
} else if (online && !online.game) {
  show("online");
} else {
  show("menu");
}

$("#install-hint").hidden = !iosBrowser();
// Op de website (niet in de app zelf, en niet op een iPhone of iPad) een link naar de Android-app
$("#android-link").hidden = !!nativeApp || isIOS;
showNews();
$("#menu-version").textContent = t("Versie {v}", { v: APP_VERSION }) + (nativeApp ? " · app" : "");
checkForUpdate();

if ("serviceWorker" in navigator && location.protocol === "https:" && !nativeApp) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* bijvoorbeeld in een voorbeeldweergave */ });
}

/**
 * Staat de website open (ook op de achtergrond), dan kijken we af en toe of er een nieuwe versie is.
 * Zo ja: een melding (als meldingen aan staan) en een balk in het hoofdmenu om te verversen.
 * De app zelf kijkt dagelijks op GitHub (zie checkForUpdate).
 */
let webUpdateTold = "";
async function checkWebVersion() {
  if (nativeApp || location.protocol !== "https:") return;
  try {
    const res = await fetch(`versie.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const v = String((await res.json()).v ?? "");
    if (!v || !isNewerVersion(v, APP_VERSION) || webUpdateTold === v) return;
    webUpdateTold = v;
    const banner = $("#update-banner");
    banner.href = location.pathname;
    banner.innerHTML = `${t("Nieuwe versie {v} beschikbaar", { v: esc(v) })}<small>${hasGameInProgress() ? t("Tik om te verversen; je spel gaat gewoon verder") : t("Tik om te verversen")}</small>`;
    banner.hidden = false;
    banner.onclick = (e) => { e.preventDefault(); location.reload(); };
    await notifyAlways(t("Er is een nieuwe versie ({v}) van 10 op en neer. Open het spel om te kijken wat er nieuw is.", { v }));
  } catch {
    // Geen internet: later nog eens
  }
}
setInterval(checkWebVersion, 30 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkWebVersion(); });
setTimeout(checkWebVersion, 20000);

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
window.__tienopenneer = { get state() { return st; }, settings, get busy() { return busy; }, celebrate: celebrateWinners, voiceFor,
  debug: () => ({ count: game?.actionCount(), queue: [...(online?.queue?.keys() ?? [])], seat: online?.seat, busy, driver, tineke: !!tinekeWaiting, msg: message }) };

// Tikken op een speler: zijn statistiek en sterren -----------------------------------------

$("#lobby-seats").addEventListener("click", (e) => {
  const row = e.target.closest(".lobby-seat[data-seat]");
  if (!row || !online) return;
  const seat = Number(row.dataset.seat);
  const p = online.players.find((x) => x.seat === seat);
  if (!p) return;
  openPlayerCard({ name: p.name, avatarHtml: `<div class="avatar">${humanAvatarHtml(p.avatar, p.name)}</div>`,
    stats: seatStats(seat) });
});

// Tik op een gezicht, naam of de sterren (ook bij jezelf): het kaartje met statistiek en uitleg over de sterren
function onSeatTap(e) {
  const seatEl = e.target.closest(".seat");
  if (!seatEl || !e.target.closest(".avatar, .who, .mini-stars") || !st) return;
  const nr = Number(seatEl.id.replace("seat-", ""));
  const p = st.players[nr - 1];
  if (!p) return;
  openPlayerCard({ name: p.name, avatarHtml: avatarHtml(nr, p.name), stats: statsOfSeat(nr), computer: !p.human,
    starsOpen: !!e.target.closest(".mini-stars") });
}
$("#arena").addEventListener("click", onSeatTap);
$("#seat-1").addEventListener("click", onSeatTap);
