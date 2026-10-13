// De online Hall of Fame: jouw scores en sterren naar de database sturen. Zonder internet blijven ze in een
// wachtrij op dit apparaat en gaan ze later alsnog mee; het spel wacht er nooit op.
import { cloudEnabled, sendHofScore, sendHofPlayer } from "./cloud.js";
import { ID_CHARS, randomCode } from "./codes.js";
import { statsSummary } from "./stats.js";
import { myAvatar, saveSettings, settings, store } from "./storage.js";

/** Doe je mee aan de Hall of Fame (je naam, plaatje en scores zijn dan voor iedereen te zien)? */
export const hofOn = () => cloudEnabled() && settings.hof !== false;

/** SHA-256 als hex, zoals de database die van je Hall of Fame-nummer teruggeeft. */
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Je vaste, willekeurige nummer in de Hall of Fame (los van de geheime statistiekcode). */
export function hofId() {
  if (!/^[A-Za-z0-9]{16}$/.test(settings.hofId ?? "")) {
    settings.hofId = randomCode(16, ID_CHARS);
    saveSettings();
  }
  return settings.hofId;
}

/** Alleen een getekend gezicht of een emoji gaat mee; een eigen foto blijft op je apparaat. */
const hofAvatar = () => { const a = myAvatar(); return a && a.length <= 16 ? a : ""; };
const hofName = () => (settings.playerName || "Speler").trim().slice(0, 24) || "Speler";

/** Opgehaalde lijsten, zodat wisselen tussen tabbladen niet steeds de database vraagt. */
export const hofCache = new Map();

let hofBusy = null;
let hofRetrying = false; // één extra ronde, geen eindeloze herhaling zonder internet

/** De wachtrij versturen, en daarna je sterren bijwerken. */
export function flushHof() {
  if (!hofOn()) return Promise.resolve();
  if (hofBusy) return hofBusy;
  const run = async () => {
    try {
      for (const e of store.get("hof-wachtrij", [])) {
        await sendHofScore(hofId(), hofName(), hofAvatar(), e);
        store.set("hof-wachtrij", store.get("hof-wachtrij", []).filter((x) => x.game !== e.game));
      }
      const sum = statsSummary();
      if (sum?.g) await sendHofPlayer(hofId(), hofName(), hofAvatar(), sum);
      hofCache.clear();
    } catch {
      // Geen verbinding of de Hall of Fame is nog niet ingesteld: later opnieuw
    }
  };
  // Kwam er tijdens het versturen iets bij in de wachtrij, dan dat er meteen achteraan
  hofBusy = run().finally(() => {
    hofBusy = null;
    if (store.get("hof-wachtrij", []).length && !hofRetrying) { hofRetrying = true; flushHof().finally(() => { hofRetrying = false; }); }
  });
  return hofBusy;
}

/** Een score voor de Hall of Fame in de wachtrij zetten: zonder internet gaat hij later alsnog mee. */
export function queueHof(entry) {
  if (!hofOn()) return;
  const q = store.get("hof-wachtrij", []).filter((x) => x.game !== entry.game);
  q.push(entry);
  store.set("hof-wachtrij", q.slice(-50));
  flushHof();
}
