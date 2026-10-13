// Wat het spel op dit apparaat bewaart (localStorage) en je instellingen. Lukt opslaan niet (privémodus),
// dan werkt alles gewoon, alleen zonder te onthouden.
import { cleanAvatar, cleanVoice } from "./validate.js";

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
    playerName: "Speler", tips: false, speed: 3, sortDescending: false, sound: true, speakBids: true, smart: true,
    tinekeHelp: true, tinekeComments: true, tinekeAsked: false,
  },
  store.get("instellingen", {}),
);
export const saveSettings = () => store.set("instellingen", settings);

/** Je eigen plaatje (gezicht, emoji of foto), gecontroleerd zoals dat van een ander. */
export const myAvatar = () => cleanAvatar(settings.avatar);
/** Je eigen stem bij het voorspellen: man, vrouw of neutraal. */
export const myVoice = () => cleanVoice(settings.voice) ?? "neutraal";
