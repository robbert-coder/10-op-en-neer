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
