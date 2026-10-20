// Wanneer de uitslag van een ronde in beeld mag komen. Los van de rest, zodat het zonder browser te testen is.

/** Altijd even wachten na de laatste slag: een stem die pas begint als de kaart geland is, telt dan ook mee. */
export const RESULT_MIN_WAIT_MS = 600;
/** Nooit langer wachten dan dit, ook niet als er (door een fout) iets blijft spelen. */
export const RESULT_MAX_WAIT_MS = 8000;

/**
 * Hoeveel ms de uitslag van de ronde nog moet wachten (0 = nu tonen).
 * Nodig omdat het scorebord anders over de spelers heen valt terwijl ze nog praten (nat gaan, goed voorspeld):
 * eerst uitpraten, dan de uitslag. [waitedMs]: hoe lang de ronde al klaar is; [voiceBusy]: klinkt er nog een stem.
 */
export function resultWait(waitedMs, voiceBusy) {
  const waited = Number.isFinite(waitedMs) ? Math.max(0, waitedMs) : RESULT_MAX_WAIT_MS;
  if (waited >= RESULT_MAX_WAIT_MS) return 0;
  if (waited < RESULT_MIN_WAIT_MS) return RESULT_MIN_WAIT_MS - waited;
  return voiceBusy ? 200 : 0;
}

/** Na zoveel ms jouw beurt maakt een computerspeler een bijdehante opmerking dat hij op je wacht. */
export const WAITING_REMARK_MS = 30000;
/** Hooguit zoveel van die opmerkingen per beurt, zodat het grappig blijft en niet gaat zeuren. */
export const MAX_WAITING_REMARKS = 2;
/** Zo lang na de laatste slag zegt iemand iets als iedereen nat is (eerst het nat-zinnetje laten uitklinken). */
export const ALL_WET_REMARK_MS = 1200;
/** Zo lang staat zo'n opmerking in beeld; de uitslag van de ronde wacht daarop. */
export const REMARK_SHOW_MS = 2200;

/** Een kort berichtje (toast) staat minstens zo lang, en langer naarmate er meer te lezen is. */
export const TOAST_MIN_MS = 2600;
export const TOAST_MAX_MS = 8000;
/** Per teken extra leestijd. */
const TOAST_MS_PER_CHAR = 55;

/**
 * Hoe lang een berichtje blijft staan. Nodig omdat "Je bent nog niet aan de beurt" snel gelezen is, maar
 * "Een computer speelt nu verder voor je..." niet; zo verdwijnt geen enkel bericht voordat je het kon lezen.
 */
export function toastMs(text) {
  const length = typeof text === "string" ? text.length : 0;
  return Math.min(TOAST_MAX_MS, Math.max(TOAST_MIN_MS, length * TOAST_MS_PER_CHAR));
}

/** Extra pauze voor de eerste voorspelling van een ronde: eerst rustig de kaarten en de troef bekijken. */
export const FIRST_BID_PAUSE_MS = 1500;
