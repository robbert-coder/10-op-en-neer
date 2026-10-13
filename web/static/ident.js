// Ondertekende berichten voor samen spelen. De doorgeefservers zijn openbaar: iedereen kan er berichten
// op zetten, ook met de naam of het nummer van een ander. Daarom heeft elk apparaat een eigen sleutelpaar
// (ECDSA P-256, WebCrypto) en ondertekent het elk bericht. Je nummer (id) is afgeleid van je openbare
// sleutel, dus niemand kan zich voor een ander uitgeven zonder diens geheime sleutel.

const STORE_KEY = "tienopenneer:sleutel";
const ALGO = { name: "ECDSA", namedCurve: "P-256" };
const SIGN = { name: "ECDSA", hash: "SHA-256" };
/** Hoe oud een bericht mag zijn (klokken lopen niet overal gelijk); ouder is een herhaling of te laat. */
const MAX_AGE_MS = 5 * 60 * 1000;

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (buf) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Het nummer bij een openbare sleutel: een stuk van de hash, kort genoeg voor een topicnaam. */
export async function idOf(publicKey) {
  return b64url(await crypto.subtle.digest("SHA-256", unb64(publicKey))).slice(0, 22);
}

/**
 * Jouw sleutelpaar: bij het eerste gebruik gemaakt en daarna bewaard, zodat je na herladen dezelfde
 * speler bent (en terug kunt naar je stoel). [storage] is te vervangen voor tests.
 */
export async function loadIdentity(storage = globalThis.localStorage) {
  let saved = null;
  try { saved = JSON.parse(storage?.getItem(STORE_KEY) ?? "null"); } catch { /* opnieuw maken */ }
  let keys;
  if (saved?.priv && saved?.pub) {
    try {
      keys = {
        privateKey: await crypto.subtle.importKey("jwk", saved.priv, ALGO, false, ["sign"]),
        publicKey: saved.pub,
      };
    } catch { keys = null; }
  }
  if (!keys) {
    const pair = await crypto.subtle.generateKey(ALGO, true, ["sign", "verify"]);
    const pub = b64(await crypto.subtle.exportKey("raw", pair.publicKey));
    const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
    try { storage?.setItem(STORE_KEY, JSON.stringify({ pub, priv })); } catch { /* alleen voor deze sessie */ }
    keys = { privateKey: pair.privateKey, publicKey: pub };
  }
  return new Identity(keys.privateKey, keys.publicKey, await idOf(keys.publicKey));
}

/** Een sleutelpaar met het bijbehorende nummer. */
export class Identity {
  constructor(privateKey, publicKey, id) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.id = id;
    this.last = 0;
  }

  /**
   * Een bericht inpakken en ondertekenen voor [topic]. De tijd loopt altijd op, zodat een ontvanger een
   * opgevangen en opnieuw verstuurd bericht herkent; het topic zit erin, zodat het niet elders bruikbaar is.
   */
  async seal(topic, msg) {
    this.last = Math.max(Date.now(), this.last + 1);
    const body = JSON.stringify({ ...msg, ts: this.last, to: topic });
    const sig = await crypto.subtle.sign(SIGN, this.privateKey, new TextEncoder().encode(body));
    return { b: body, k: this.publicKey, s: b64(sig) };
  }
}

/**
 * Controleert ingepakte berichten: klopt de handtekening, is het voor dit topic bedoeld en is het niet al
 * eerder binnengekomen? Geeft {from, msg} of null. Per afzender (en per server) moet de tijd oplopen.
 */
export class Verifier {
  constructor(maxSenders = 500) {
    this.keys = new Map(); // openbare sleutel -> {key, id}
    this.last = new Map(); // afzender|kanaal -> laatste tijd
    this.maxSenders = maxSenders;
  }

  async open(topic, wire, channel = "") {
    if (!wire || typeof wire !== "object" || typeof wire.b !== "string" || typeof wire.k !== "string" || typeof wire.s !== "string") return null;
    if (wire.b.length > 200000 || wire.k.length > 200 || wire.s.length > 200) return null;
    let entry = this.keys.get(wire.k);
    try {
      if (!entry) {
        const key = await crypto.subtle.importKey("raw", unb64(wire.k), ALGO, false, ["verify"]);
        entry = { key, id: await idOf(wire.k) };
        if (this.keys.size >= this.maxSenders) this.keys.delete(this.keys.keys().next().value);
        this.keys.set(wire.k, entry);
      }
      const ok = await crypto.subtle.verify(SIGN, entry.key, unb64(wire.s), new TextEncoder().encode(wire.b));
      if (!ok) return null;
    } catch {
      return null;
    }
    let msg;
    try { msg = JSON.parse(wire.b); } catch { return null; }
    if (!msg || typeof msg !== "object" || msg.to !== topic || !Number.isFinite(msg.ts)) return null;
    if (Math.abs(Date.now() - msg.ts) > MAX_AGE_MS) return null;
    const seenKey = `${entry.id}|${channel}`;
    if (msg.ts <= (this.last.get(seenKey) ?? 0)) return null; // herhaling
    if (this.last.size >= this.maxSenders * 4) this.last.delete(this.last.keys().next().value);
    this.last.set(seenKey, msg.ts);
    delete msg.to;
    return { from: entry.id, msg };
  }
}
