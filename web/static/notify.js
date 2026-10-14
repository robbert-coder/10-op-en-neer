// Meldingen (notificaties) als het spel op de achtergrond staat, bijvoorbeeld als je aan de beurt bent bij
// samen spelen. In de Android-app via de app zelf, op de website via de browser.
import { nativeApp } from "./dom.js";
import { settings } from "./storage.js";
import { t } from "./i18n.js";

/** In de app zegt de app zelf of hij op de achtergrond staat (setAppVisible); in de browser zegt de pagina het. */
let appVisible = true;
export const setAppVisible = (visible) => { appVisible = visible; };
export const inBackground = () => document.hidden || !appVisible;

/** Mogen we meldingen tonen? "granted", "denied", "default" (nog niet gevraagd) of "unsupported". */
export function notifyPermission() {
  if (nativeApp?.notificationState) return nativeApp.notificationState();
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Toestemming vragen voor meldingen (bij het openen van of aanschuiven bij een tafel, of via de knop).
 * [answered] wordt aangeroepen als de browser het antwoord geeft, zodat het scherm kan bijwerken.
 */
export function askNotifications(answered = () => {}) {
  if (settings.notify === false) return;
  if (nativeApp?.askNotifications) { nativeApp.askNotifications(); return; }
  if (notifyPermission() === "default") Notification.requestPermission().then(answered).catch(() => {});
}

export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
/** Een iPhone of iPad die de website in Safari opent (niet vanaf het beginscherm). */
export const iosBrowser = () => isIOS && !standalone;

/** Waarom meldingen hier niet kunnen, of null als ze wel kunnen. */
export function notifyUnsupportedText() {
  if (notifyPermission() !== "unsupported") return null;
  if (iosBrowser()) {
    return t("Op iPhone en iPad kan een website alleen meldingen geven als je hem op je beginscherm zet: tik in Safari op Deel en dan op Zet op beginscherm, en open het spel daarna vanaf je beginscherm.");
  }
  return t("Deze browser kan geen meldingen geven. Gebruik de Android-app of een andere browser, zoals Chrome.");
}

/** Een melding als het spel op de achtergrond staat, bijvoorbeeld omdat je aan de beurt bent. */
export async function turnNotice(text) {
  if (settings.notify === false || !inBackground()) return;
  await notifyAlways(text);
}

/** Een melding, ook als het spel in beeld is (zolang meldingen aan staan). */
export async function notifyAlways(text) {
  if (settings.notify === false) return;
  if (nativeApp?.notify) { nativeApp.notify("10 op en neer", text); return; }
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const opts = { body: text, tag: "beurt", renotify: true, icon: "icons/icon-192.png", badge: "icons/icon-192.png" };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification("10 op en neer", opts); return; }
  } catch { /* dan de gewone manier */ }
  try {
    const n = new Notification("10 op en neer", opts);
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* meldingen kunnen hier niet */ }
}

/** De beurtmelding weghalen zodra je weer kijkt: die is dan niet meer nodig. */
export async function clearTurnNotice() {
  nativeApp?.clearNotification?.();
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    for (const n of (await reg?.getNotifications({ tag: "beurt" })) ?? []) n.close();
  } catch { /* niets te sluiten */ }
}
