// Geluid: stemmen en geluidjes (mp3 in sounds/) en kaartgeluiden die ter plekke uit ruis gemaakt worden.
// Een nieuw stemgeluid onderbreekt het vorige; kaartgeluiden klinken erdoorheen.
import { inBackground } from "./notify.js";
import { settings } from "./storage.js";

let audio = null;
const buffers = new Map();
let currentSource = null;
let voiceEndsAt = 0; // performance.now() waarop de huidige stem klaar is
let voicesLoading = 0; // stemmen die nog geladen worden en zo gaan klinken
let onUnlock = () => {};

/**
 * Browsers laten pas geluid toe na een tik of toets. Bij de eerste tik maken we het geluid aan en roepen
 * we [onUnlock] aan (zie initSound), zodat de app alvast stemmen kan laden.
 */
function unlockAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
    onUnlock();
  }
  if (audio.state === "suspended") audio.resume();
}

/** Luisteren naar de eerste tik; [unlocked] wordt dan één keer aangeroepen. [now]: meteen (de app mag dat). */
export function initSound(unlocked, now = false) {
  onUnlock = unlocked;
  for (const ev of ["touchend", "click", "keydown"]) document.addEventListener(ev, unlockAudio, true);
  if (now) setTimeout(unlockAudio, 0); // pas als de app helemaal geladen is
}

/** Kan er geluid klinken (heeft de speler al getikt)? */
export const soundReady = () => !!audio;

/**
 * Kaartgeluiden, ter plekke gemaakt met ruis (geen bestanden): schudden bij een nieuwe ronde, een kaart die
 * over tafel schuift en het bij elkaar vegen van een slag. Ze lopen naast de stemmen, zonder die te onderbreken.
 */
export function cardSound(kind) {
  if (!audio || !settings.sound || settings.cardSounds === false || inBackground() || audio.state !== "running") return;
  const now = audio.currentTime;
  const rate = audio.sampleRate;
  const noise = (sec) => {
    const buf = audio.createBuffer(1, Math.max(1, Math.floor(rate * sec)), rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  };
  // Eén schuifje: gefilterde ruis die snel opkomt en wegsterft, met een licht dalende toon
  const swish = (at, sec, freq, vol, q = 0.9) => {
    const src = audio.createBufferSource();
    src.buffer = noise(sec);
    const f = audio.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, at);
    f.frequency.exponentialRampToValueAtTime(freq * 0.6, at + sec);
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + Math.min(0.02, sec / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, at + sec);
    src.connect(f).connect(g).connect(audio.destination);
    src.start(at);
    src.stop(at + sec + 0.02);
  };
  if (kind === "slide") {
    // Papier dat over het laken schuift: zachte, brede ruis die rustig aanzwelt en wegglijdt, zonder tik
    const sec = 0.3 + Math.random() * 0.06;
    const src = audio.createBufferSource();
    src.buffer = noise(sec);
    const hp = audio.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 700;
    const lp = audio.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2200, now);
    lp.frequency.linearRampToValueAtTime(4200 + Math.random() * 800, now + sec * 0.45);
    lp.frequency.exponentialRampToValueAtTime(1500, now + sec);
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + sec * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, now + sec);
    src.connect(hp).connect(lp).connect(g).connect(audio.destination);
    src.start(now);
    src.stop(now + sec + 0.02);
  } else if (kind === "collect") {
    swish(now, 0.28, 2000, 0.3, 0.6);
    swish(now + 0.08, 0.2, 2800, 0.15, 0.8);
  } else if (kind === "shuffle") {
    // Ritselend schudden: een snelle reeks klikjes, daarna het delen
    for (let i = 0; i < 16; i++) swish(now + i * 0.028 + Math.random() * 0.01, 0.03, 3200 + Math.random() * 1500, 0.22, 3);
    for (let i = 0; i < 4; i++) swish(now + 0.62 + i * 0.13, 0.11, 2400 + Math.random() * 500, 0.25);
  }
}

/**
 * Een kort belletje (twee tonen, ter plekke gemaakt) als jij aan de beurt bent. Nodig omdat sommige spelers het
 * niet zien als ze even wegkijken. Staat los van de kaartgeluiden, met een eigen instelling (Beurtsignaal).
 */
export function turnChime() {
  if (!audio || !settings.sound || settings.turnSignal === false || inBackground() || audio.state !== "running") return;
  const now = audio.currentTime;
  [[880, 0], [1320, 0.13]].forEach(([freq, delay]) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, now + delay);
    g.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.5);
    osc.connect(g).connect(audio.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.55);
  });
}

/** Een geluid uit sounds/ laden (één keer; daarna uit het geheugen). Geeft null als het er niet is. */
export function loadSound(name) {
  if (!buffers.has(name)) {
    const p = fetch(`sounds/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((data) => new Promise((resolve, reject) => audio.decodeAudioData(data, resolve, reject)))
      .catch(() => null);
    buffers.set(name, p);
  }
  return buffers.get(name);
}

/** Het stemgeluid dat nu klinkt stoppen. */
export function stopSound() {
  try { currentSource?.stop(); } catch { /* al gestopt */ }
  currentSource = null;
  voiceEndsAt = 0;
}

/**
 * Klinkt er nu een stem (of wordt er een geladen die zo gaat klinken)? Nodig om de uitslag van een ronde pas te
 * tonen als iedereen uitgepraat is (zie pacing.js). Kaartgeluiden tellen niet mee.
 */
export function voicePlaying() {
  return voicesLoading > 0 || performance.now() < voiceEndsAt;
}

/** Speelt een geluid; een nieuw geluid onderbreekt het vorige. Geeft de duur in ms. */
export async function playSound(name) {
  if (!audio) return 0;
  let buffer;
  voicesLoading++;
  try {
    buffer = await loadSound(name);
  } finally {
    voicesLoading--;
  }
  if (!buffer) return 0;
  if (currentSource) {
    try { currentSource.stop(); } catch { /* al gestopt */ }
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.connect(audio.destination);
  src.start();
  currentSource = src;
  voiceEndsAt = performance.now() + buffer.duration * 1000;
  return buffer.duration * 1000;
}
