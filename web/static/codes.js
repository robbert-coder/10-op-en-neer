// Willekeurige codes: voor tafels (5 tekens), je statistiek (12) en de Hall of Fame (16). Eén plek, zodat
// alle codes even goed willekeurig zijn (crypto) en dezelfde tekens gebruiken.

/** Tekens die je makkelijk overtypt: zonder 0/O en 1/I. */
export const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Letters en cijfers, voor codes die niemand hoeft over te typen. */
export const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Een code van [length] tekens uit [chars]. */
export function randomCode(length, chars = CODE_CHARS) {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => chars[b % chars.length]).join("");
}

/** Wat iemand intypt of in een link zet: hoofdletters, alleen letters en cijfers, hooguit [length] tekens. */
export const normalizeCode = (s, length = Infinity) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, length);

/** Bestaat de code precies uit [length] tekens uit [chars]? */
export const isCode = (c, length, chars = CODE_CHARS) => typeof c === "string" && c.length === length && [...c].every((ch) => chars.includes(ch));
