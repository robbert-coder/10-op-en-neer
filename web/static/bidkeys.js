// Voorspellen met de cijfertoetsen van een toetsenbord. Los van het scherm, zodat het te testen is.

/** Hoe lang we na een "1" wachten op een tweede cijfer (voor 10 of meer), als dat kan. */
export const BID_KEY_WAIT_MS = 700;

/**
 * Een cijfertoets verwerken. [pending] is een eerder getypt cijfer dat nog op een tweede wacht ("" als er
 * niets is). Geeft { bid } als het bod vaststaat, { pending } als we op een tweede cijfer wachten, of null
 * voor een toets die geen cijfer is of een bod dat niet kan. Nodig omdat een ronde meer dan 9 kaarten kan
 * hebben: "1" kan het begin van "10" zijn.
 */
export function bidFromKey(pending, key, maxBid) {
  if (!/^[0-9]$/.test(key)) return null;
  if (pending) {
    const both = Number(pending + key);
    return both <= maxBid ? { bid: both } : { bid: Number(pending) };
  }
  const d = Number(key);
  if (d > maxBid) return null;
  return d > 0 && d * 10 <= maxBid ? { pending: key } : { bid: d };
}

/**
 * Het cijfer van een toetsaanslag, of "" als het geen cijfer is. Kijkt naar het teken én naar de toets zelf
 * (Digit1, Numpad1), zodat het ook werkt op een toetsenbord waar je voor een cijfer Shift moet gebruiken
 * (bijvoorbeeld Belgisch AZERTY) of waar Num Lock uit staat.
 */
export function keyDigit(key, code) {
  if (typeof key === "string" && /^[0-9]$/.test(key)) return key;
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(typeof code === "string" ? code : "");
  return m ? m[1] : "";
}

/**
 * Mag een cijfertoets een bod zijn terwijl er een tekstvak focus heeft? Alleen als dat vak niet te zien is
 * (focus blijft soms in een gesloten chat hangen) of als het een leeg chatvak is: anders gingen je cijfers de
 * chat in terwijl je wilde voorspellen. In een vak waar je al iets typt, blijft een cijfer gewoon tekst.
 */
export function digitMayBid(field) {
  if (!field) return true;
  if (!field.visible) return true;
  return field.chat === true && field.value === "";
}
