// Wat het spel op dit apparaat bewaart (localStorage) en je instellingen. Lukt opslaan niet (privémodus),
// dan werkt alles gewoon, alleen zonder te onthouden.
import { cleanAvatar, cleanVoice } from "./validate.js";
import { isEnglish } from "./i18n.js";

/** Naam zolang je zelf geen naam hebt gekozen, in beide talen. */
export const DEFAULT_NAMES = ["Speler", "Player"];

export const store = {
  get(key, fallback) {
    try {
      const v = globalThis.localStorage?.getItem(key) ?? null;
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { globalThis.localStorage?.setItem(key, JSON.stringify(value)); } catch { /* privémodus */ }
  },
  remove(key) {
    try { globalThis.localStorage?.removeItem(key); } catch { /* privémodus */ }
  },
};

/** Je instellingen; één gedeeld object, dat elk scherm kan aanpassen en daarna met saveSettings bewaart. */
export const settings = Object.assign(
  {
    playerName: isEnglish ? "Player" : "Speler", speed: 3, sortDescending: false, sound: true, speakBids: true, smart: false,
    tinekeHelp: true, tinekeNew: true, tinekeSeen: [], tinekeComments: true, tinekeAsked: false, tinekeVoice: true, opener: true,
  },
  store.get("instellingen", {}),
);
export const saveSettings = () => store.set("instellingen", settings);
// Nog de standaardnaam: die in de taal van het spel
if (DEFAULT_NAMES.includes(settings.playerName)) settings.playerName = DEFAULT_NAMES[isEnglish ? 1 : 0];
// Sterke computerspelers stonden vroeger standaard aan; wie ze nooit zelf koos, begint nu met gewone
if (!settings.smartChosen) settings.smart = false;

/** Je eigen plaatje (gezicht, emoji of foto), gecontroleerd zoals dat van een ander. */
export const myAvatar = () => cleanAvatar(settings.avatar);
/** Je eigen stem bij het voorspellen: man, vrouw of neutraal. */
export const myVoice = () => cleanVoice(settings.voice) ?? "neutraal";
