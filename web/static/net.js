// Samen spelen via internet. Alle berichten gaan via een openbare doorgeefserver (MQTT over een websocket),
// zodat het op elk netwerk werkt, ook als twee apparaten elkaar niet rechtstreeks kunnen bereiken.
// Wie de tafel opent is de gastheer: alle berichten gaan via hem. Iedereen rekent het spel zelf uit; dat kan omdat het spel met dezelfde
// beginwaarde (seed) en dezelfde handelingen van de mensen altijd precies hetzelfde verloopt.

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Volgorde waarin mensen een stoel krijgen, per aantal plaatsen: bij vier eerst tegenover elkaar. */
const SEAT_ORDERS = { 2: [1, 2], 3: [1, 2, 3], 4: [1, 3, 2, 4], 5: [1, 3, 4, 2, 5] };

export function makeCode() {
  let c = "";
  for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

/** Emoji's die oudere versies als plaatje gebruikten; worden nog getoond als iemand ze heeft. */
export const AVATAR_EMOJIS = ["🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯", "🐨", "🐷", "🐙", "🦉", "🐧",
  "😎", "🤠", "👑", "🌷", "⚽", "🎸", "☕", "🍀"];

/** De getekende gezichten die je kunt kiezen (zie PERSONS in faces.js). */
export const AVATAR_FACES = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12"];

/** Een plaatje van een ander alleen gebruiken als het een gezicht, een emoji (oudere versies) of een kleine foto is. */
export function cleanAvatar(v) {
  if (typeof v !== "string") return null;
  if (AVATAR_FACES.includes(v) || AVATAR_EMOJIS.includes(v)) return v;
  if (v.length <= 60000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  return null;
}

/** Het statistiekoverzicht van een ander: alleen nette getallen, of null. */
export function cleanStats(v) {
  if (!v || typeof v !== "object") return null;
  const n = (x, max) => (Number.isFinite(x) ? Math.max(0, Math.min(max, Math.round(x))) : 0);
  const g = n(v.g, 100000);
  // a: alle spellen (ook korte); g en de rest: alleen volledige spellen. Oudere versies stuurden geen a.
  const all = Math.max(g, n(v.a ?? v.g, 100000));
  if (!all) return null;
  return { a: all, g, w: Math.min(g, n(v.w, 100000)), r: n(v.r, 10000000), ok: Math.min(n(v.r, 10000000), n(v.ok, 10000000)), f: n(v.f, 100) };
}

export const normalizeCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

/**
 * Openbare doorgeefservers. De gastheer luistert op allemaal tegelijk; een gast gebruikt de eerste die werkt
 * en probeert de volgende als de tafel daar niet antwoordt. Met ?relay=ws://host:poort kan een eigen
 * (test)server gebruikt worden.
 */
const BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
  "wss://test.mosquitto.org:8081/mqtt",
];
const brokers = () => {
  const own = new URLSearchParams(location.search).get("relay");
  return own ? own.split(",") : BROKERS;
};
const topic = (code) => `tienopenneer/v2/${code}`;
/** De openbare lobby: open tafels, wie er in de lobby is, en de lobbychat. */
const PUBLIC = "tienopenneer/v2/publiek";
const tableTopic = (code) => `${PUBLIC}/tafels/${code}`;
const presenceTopic = (id) => `${PUBLIC}/lobby/${id}`;
const CHAT_TOPIC = `${PUBLIC}/chat`;
/** Openbare berichten worden zo vaak ververst; wat langer niet ververst is, is weg. */
const PUBLIC_REFRESH_MS = 15000;
const PUBLIC_STALE_MS = 75000;
/** Aan een openbare tafel neemt een computer het over van wie zo lang weg is (aan een privétafel alleen bij vertrekken). */
const TAKEOVER_MS = 90000;
/** Hoe lang een tafel in de lobby blijft staan als de gastheer even weg is (bijvoorbeeld een tabblad op de achtergrond). */
const AWAY_MS = 5 * 60 * 1000;

/** Hoe vaak we een teken van leven sturen, en na hoe lang zonder bericht iemand weg is. */
const PING_MS = 4000;
const GONE_MS = 16000;
/** Hoe lang een gast wacht op antwoord van de tafel voordat hij een andere doorgeefserver probeert. */
const WAIT_MS = 10000;

/** Een verbinding met een doorgeefserver; valt hij weg, dan opnieuw (bij [rotate] met de volgende server). */
class Relay {
  constructor(urls, subscribe, onMessage, onState, opts = {}) {
    this.opts = opts;
    this.urls = urls;
    this.subscribe = subscribe;
    this.onMessage = onMessage;
    this.onState = onState;
    this.index = 0;
    this.closed = false;
    this.connect();
  }

  connect() {
    if (this.closed) return;
    const mqtt = window.mqtt;
    if (!mqtt) { this.onState("unsupported"); return; }
    const url = this.urls[this.index % this.urls.length];
    const client = mqtt.connect(url, {
      clientId: `tien_${Math.random().toString(36).slice(2, 12)}`,
      clean: true, keepalive: 30, reconnectPeriod: 0, connectTimeout: 8000, protocolVersion: 4,
      // Valt de verbinding weg, dan haalt de server ons openbare bericht weg (tafel of aanwezigheid in de lobby)
      ...(this.opts.will ? { will: { topic: this.opts.will, payload: "", qos: 0, retain: true } } : {}),
    });
    this.client = client;
    let ok = false;
    client.on("connect", () => {
      ok = true;
      client.subscribe(this.subscribe(), { qos: 0 });
      this.onState("open");
    });
    client.on("message", (t, payload) => {
      if (!payload.length) { this.opts.onEmpty?.(t, this); return; }
      let msg;
      try { msg = JSON.parse(payload.toString()); } catch { return; }
      if (msg && typeof msg === "object") this.onMessage(msg, this, t);
    });
    const lost = () => {
      if (this.client !== client || this.closed) return;
      this.client = null;
      try { client.end(true); } catch { /* al dicht */ }
      if (!ok) this.index++;
      this.onState("lost");
      setTimeout(() => this.connect(), ok ? 1500 : 500);
    };
    client.on("close", lost);
    client.on("error", lost);
    client.on("offline", lost);
  }

  /** Naar de volgende server (alleen zinvol als er meer dan één is). */
  next() {
    if (this.urls.length < 2 || this.closed) return;
    const old = this.client;
    this.client = null;
    this.index++;
    try { old?.end(true); } catch { /* al dicht */ }
    this.connect();
  }

  get open() { return !!this.client?.connected; }

  publish(t, msg) {
    if (!this.client?.connected) return false;
    this.client.publish(t, JSON.stringify(msg), { qos: 0 });
    return true;
  }

  /** Een bericht dat de server bewaart voor wie later komt kijken; null haalt het weg. */
  publishRetained(t, msg) {
    if (!this.client?.connected) return false;
    this.client.publish(t, msg == null ? "" : JSON.stringify(msg), { qos: 0, retain: true });
    return true;
  }

  close() {
    this.closed = true;
    const c = this.client;
    this.client = null;
    setTimeout(() => { try { c?.end(false); } catch { /* al dicht */ } }, 300);
  }
}

/**
 * De gastheer: houdt bij wie er aan tafel zit en stuurt alle handelingen door.
 * events: onLobby(players), onAction({index, seat, value}), onStatus(text), onError(text)
 */
export class Host {
  constructor(code, myName, events, saved = null, myAvatar = null, seats = 4, pub = null) {
    this.code = code;
    /** Openbare tafel: {title, variant, rounds}; staat dan in de lobby tot het spel begint. */
    this.pub = pub;
    this.events = events;
    /** Aantal plaatsen aan tafel: 2 tot 5. */
    this.seats = seats;
    this.players = [{ id: "host", name: myName, seat: 1, online: true, avatar: cleanAvatar(myAvatar) }];
    this.conns = new Map(); // clientId -> verbinding
    this.started = null; // startgegevens zodra het spel loopt
    this.log = []; // alle handelingen van mensen, in volgorde: {seat, value}
    this.chat = []; // laatste chatberichten: {seat, name, text, time}
    this.closed = false;
    if (saved) {
      // Na het herladen van de pagina: dezelfde tafel weer openen, de anderen verbinden vanzelf opnieuw
      this.players = saved.players.map((p) => ({ ...p, online: p.id === "host" }));
      const me = this.players.find((p) => p.id === "host");
      if (me) me.avatar = cleanAvatar(myAvatar);
      this.started = saved.started;
      this.log = saved.log;
      this.chat = saved.chat ?? [];
      this.restarting = true;
    }
    this.open();
  }

  /** Wat er bewaard moet worden om de tafel na herladen weer te openen. */
  snapshot() {
    return { code: this.code, players: this.players, started: this.started, log: this.log, chat: this.chat, pub: this.pub };
  }

  open() {
    // Per gast een "verbinding": berichten gaan via de server waarop de gast zich meldde
    this.links = new Map();
    const base = topic(this.code);
    this.relays = brokers().map((url) => new Relay([url], () => `${base}/h`, (msg, relay) => this.incoming(msg, relay), (state) => {
      if (this.relays?.some((r) => r.open)) { clearTimeout(this.waitTimer); this.events.onStatus?.(""); }
      if (state === "open") this.announce();
    }, this.pub ? { will: tableTopic(this.code) } : {}));
    this.waitTimer = setTimeout(() => {
      if (!this.closed && !this.relays.some((r) => r.open)) {
        this.events.onStatus?.("De server die de spelers aan elkaar koppelt reageert nog niet. Controleer je internet.");
      }
    }, WAIT_MS);
    this.pinger = setInterval(() => this.heartbeat(), PING_MS);
    this.announcer = setInterval(() => this.announce(), PUBLIC_REFRESH_MS);
  }

  /** Een openbare tafel die nog niet begonnen is, laat in de lobby zien wie er zit en hoeveel plaatsen vrij zijn. */
  announce() {
    if (!this.pub || !this.relays) return;
    const open = !this.started && !this.closed;
    const me = this.players.find((x) => x.id === "host");
    const info = open ? {
      v: 1, code: this.code, host: me?.name ?? "", avatar: me?.avatar && me.avatar.length <= 16 ? me.avatar : null,
      title: this.pub.title ?? "", variant: this.pub.variant, rounds: this.pub.rounds, seats: this.seats,
      players: this.players.slice().sort((a, b) => a.seat - b.seat).map((p) => p.name),
      free: Math.max(0, this.seats - this.players.length), time: Date.now(),
    } : null;
    for (const r of this.relays) {
      // Echt dicht (gestart of gesloten): eerst laten weten dat de tafel weg is, dan het bewaarde bericht wissen.
      // Een leeg bericht alleen (bij wegvallen van de verbinding) betekent: gastheer even weg.
      if (!info) r.publish(tableTopic(this.code), { v: 1, code: this.code, closed: true, time: Date.now() });
      r.publishRetained(tableTopic(this.code), info);
    }
  }

  incoming(msg, relay) {
    const id = String(msg.from || "").slice(0, 40);
    if (!id || id === "host") return;
    let conn = this.links.get(id);
    if (!conn || conn.relay !== relay) {
      const base = topic(this.code);
      conn = {
        relay, open: true, clientId: null,
        send: (m) => relay.publish(`${base}/g/${id}`, m),
        close() { this.open = false; },
      };
      this.links.set(id, conn);
    }
    conn.open = true;
    conn.seen = Date.now();
    if (msg.t === "ping") return;
    if (msg.t === "bye") { this.links.delete(id); conn.open = false; this.dropped(conn, true); return; }
    this.receive(conn, msg);
  }

  /**
   * Een speler verlaat het lopende spel: vanaf nu speelt een computer op zijn stoel. Dat gaat als
   * handeling (-stoel) in het logboek, zodat het bij iedereen op hetzelfde moment gebeurt.
   */
  takeOver(p) {
    if (!this.started || p.left || p.id === "host") return;
    p.left = true;
    p.online = false;
    const index = this.log.length;
    this.record(p.seat, -p.seat);
    this.events.onAction?.({ index, seat: p.seat, value: -p.seat });
    this.lobbyChanged();
  }

  /** Iedereen een teken van leven sturen, en wie al even niets liet horen als weg zien. */
  heartbeat() {
    // Aan een openbare tafel wacht niemand eindeloos op iemand die weg is
    if (this.pub && this.started) {
      for (const p of this.players) {
        if (p.id !== "host" && !p.online && !p.left && Date.now() - (p.offlineSince ?? Date.now()) > TAKEOVER_MS) this.takeOver(p);
      }
    }
    for (const [id, conn] of this.links) {
      if (Date.now() - conn.seen > GONE_MS) {
        this.links.delete(id);
        conn.open = false;
        this.dropped(conn);
      } else {
        // Met het aantal handelingen, zodat een gast die iets gemist heeft dat merkt
        conn.send(this.started ? { t: "ping", n: this.log.length } : { t: "ping" });
      }
    }
  }

  receive(conn, msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.t === "hello") {
      const id = String(msg.id || "").slice(0, 40);
      const name = String(msg.name || "Speler").slice(0, 16);
      let p = this.players.find((x) => x.id === id);
      if (p?.left) { conn.send({ t: "full", text: "Je had het spel verlaten. Een computer speelt nu voor je verder." }); return; }
      if (!p) {
        if (this.started) { conn.send({ t: "full", text: "Dit spel is al begonnen." }); return; }
        const order = SEAT_ORDERS[this.seats] ?? SEAT_ORDERS[4];
        const free = order.find((s) => !this.players.some((x) => x.seat === s));
        if (!free) { conn.send({ t: "full", text: "De tafel is vol." }); return; }
        p = { id, name, seat: free, online: true };
        this.players.push(p);
      }
      p.online = true;
      if (!this.started) p.name = name;
      p.avatar = cleanAvatar(msg.avatar);
      p.stats = cleanStats(msg.stats);
      conn.clientId = id;
      const old = this.conns.get(id);
      if (old && old !== conn) old.close();
      this.conns.set(id, conn);
      conn.send({ t: "welcome", seat: p.seat, code: this.code });
      if (this.started) conn.send({ t: "start", game: this.started, log: this.log });
      conn.send({ t: "chatlog", messages: this.chat });
      this.lobbyChanged();
    } else if (msg.t === "sync") {
      // Een gast loopt niet gelijk (er is een bericht zoekgeraakt): stuur de hele stand opnieuw
      if (this.started && conn.clientId) conn.send({ t: "start", game: this.started, log: this.log });
    } else if (msg.t === "me") {
      const p = this.players.find((x) => x.id === conn.clientId);
      if (!p) return;
      if ("avatar" in msg) p.avatar = cleanAvatar(msg.avatar);
      if ("stats" in msg) p.stats = cleanStats(msg.stats);
      this.lobbyChanged();
    } else if (msg.t === "chat") {
      const p = this.players.find((x) => x.id === conn.clientId);
      if (p) this.addChat(p.seat, p.name, msg.text, conn);
    } else if (msg.t === "act") {
      const p = this.players.find((x) => x.id === conn.clientId);
      if (!p || !this.started || msg.seat !== p.seat || p.left || !(msg.value >= 0)) return;
      if (msg.index !== this.log.length) {
        // Loopt niet gelijk: stuur de hele stand opnieuw
        conn.send({ t: "start", game: this.started, log: this.log });
        return;
      }
      this.record(msg.seat, msg.value, conn);
      this.events.onAction?.({ index: msg.index, seat: msg.seat, value: msg.value });
    }
  }

  dropped(conn, left = false) {
    const p = this.players.find((x) => x.id === conn.clientId);
    if (!p || this.conns.get(p.id) !== conn) return;
    this.conns.delete(p.id);
    if (this.started) {
      p.online = false;
      p.offlineSince = Date.now();
      if (left) this.takeOver(p);
    } else {
      this.players = this.players.filter((x) => x !== p);
    }
    this.lobbyChanged();
  }

  lobbyChanged() {
    const list = this.players.map(({ name, seat, online, avatar, stats, left }) =>
      ({ name, seat, online, avatar: avatar ?? null, stats: stats ?? null, left: !!left }));
    const pub = this.pub ? { title: this.pub.title ?? "" } : null;
    this.broadcast({ t: "lobby", players: list, seats: this.seats, pub });
    this.events.onLobby?.(list, this.seats, pub);
    this.announce();
  }

  broadcast(msg, except = null) {
    for (const c of this.conns.values()) if (c !== except && c.open) c.send(msg);
  }

  record(seat, value, from = null) {
    const index = this.log.length;
    this.log.push({ seat, value });
    this.broadcast({ t: "act", index, seat, value }, from);
  }

  /**
   * Spelen zonder computers: de mensen schuiven aan op stoel 1, 2, 3… in dezelfde volgorde aan tafel,
   * en de tafel krijgt precies zoveel plaatsen als er mensen zijn. Iedereen hoort zijn nieuwe stoel.
   */
  compact() {
    const map = new Map();
    this.players.slice().sort((a, b) => a.seat - b.seat).forEach((p, i) => map.set(p.seat, i + 1));
    for (const p of this.players) p.seat = map.get(p.seat);
    this.chat = this.chat.filter((m) => map.has(m.seat)).map((m) => ({ ...m, seat: map.get(m.seat) }));
    this.seats = this.players.length;
    for (const p of this.players) {
      const c = this.conns.get(p.id);
      if (c?.open) c.send({ t: "welcome", seat: p.seat, code: this.code });
    }
    this.broadcast({ t: "chatlog", messages: this.chat });
    this.lobbyChanged();
  }

  /** Begint het spel; lege stoelen worden computerspelers. */
  start(game) {
    this.started = game;
    this.log = [];
    this.broadcast({ t: "start", game, log: [] });
    this.lobbyChanged();
  }

  /** Een chatbericht bewaren en naar iedereen (behalve de afzender) sturen. */
  addChat(seat, name, text, from = null) {
    const clean = String(text || "").trim().slice(0, 200);
    if (!clean) return;
    const m = { seat, name, text: clean, time: Date.now() };
    this.chat.push(m);
    if (this.chat.length > 100) this.chat.shift();
    this.broadcast({ t: "chat", message: m }, from);
    this.events.onChat?.(m, !from);
  }

  sendChat(text) {
    const me = this.players.find((x) => x.id === "host");
    this.addChat(1, me?.name ?? "", text);
  }

  /** De gastheer kiest een ander plaatje. */
  setAvatar(v) {
    const me = this.players.find((x) => x.id === "host");
    if (me) me.avatar = cleanAvatar(v);
    this.lobbyChanged();
  }

  /** De statistiek van de gastheer zelf, voor de anderen aan tafel. */
  setStats(v) {
    const me = this.players.find((x) => x.id === "host");
    if (me) me.stats = cleanStats(v);
    this.lobbyChanged();
  }

  /** Een handeling van de gastheer zelf. */
  sendAction(index, seat, value) {
    if (index !== this.log.length) return;
    this.record(seat, value);
  }

  close() {
    this.closed = true;
    this.announce(); // uit de lobby halen
    clearTimeout(this.waitTimer);
    clearInterval(this.pinger);
    clearInterval(this.announcer);
    this.broadcast({ t: "bye" });
    for (const r of this.relays ?? []) r.close();
  }
}

/**
 * Een speler die meedoet aan de tafel van een ander.
 * events: onWelcome(seat), onLobby(players), onStart(game, log), onAction({index, seat, value}),
 *         onStatus(text), onError(text), onClosed(text)
 */
export class Guest {
  constructor(code, myName, clientId, events, avatar = null) {
    this.code = code;
    this.name = myName;
    this.avatar = cleanAvatar(avatar);
    this.clientId = clientId;
    this.events = events;
    this.closed = false;
    this.welcomed = false; // heeft de tafel ons sinds de laatste (her)verbinding begroet?
    this.everWelcomed = false;
    this.lastHost = 0;
    this.tries = 0;
    this.mismatch = 0;
    const base = topic(code);
    this.relay = new Relay(brokers(), () => [`${base}/g/${clientId}`], (msg) => this.receive(msg), (state) => {
      if (state === "unsupported") this.events.onError?.("Samen spelen werkt niet in deze browser.");
      if (state === "open") { this.waitStart = Date.now(); this.hello(); }
    });
    // Een open verbinding naar de tafel, met dezelfde vorm als voorheen
    this.conn = {
      get open() { return true; },
      send: (m) => this.relay.publish(`${base}/h`, { ...m, from: this.clientId }),
    };
    this.waitStart = Date.now();
    this.pinger = setInterval(() => this.tick(), PING_MS);
  }

  hello() {
    this.conn.send({ t: "hello", id: this.clientId, name: this.name, avatar: this.avatar, stats: this.stats ?? null });
  }

  /** Elke paar tellen: een teken van leven, of opnieuw aankloppen als de tafel (nog) niet antwoordt. */
  tick() {
    if (this.closed) return;
    if (this.welcomed && Date.now() - this.lastHost > GONE_MS) {
      this.welcomed = false;
      this.waitStart = Date.now();
      this.events.onStatus?.("De verbinding met de tafel is weg. Opnieuw verbinden…");
    }
    if (this.welcomed) { this.conn.send({ t: "ping" }); return; }
    if (!this.relay.open) {
      if (Date.now() - this.waitStart > WAIT_MS) {
        this.events.onStatus?.("De server die de spelers aan elkaar koppelt reageert niet. Controleer je internet.");
      }
      return;
    }
    this.hello();
    if (Date.now() - this.waitStart > WAIT_MS) {
      // Geen antwoord: misschien zit de gastheer op een andere doorgeefserver
      this.tries++;
      this.waitStart = Date.now();
      this.events.onStatus?.(this.everWelcomed
        ? "De tafel reageert niet. Opnieuw proberen…"
        : `Nog geen antwoord van tafel ${this.code}. Staat de tafel open bij de gastheer? Opnieuw proberen…`);
      this.relay.next();
    }
  }

  receive(msg) {
    this.lastHost = Date.now();
    if (msg.t === "ping") {
      // Twee keer achter elkaar een ander aantal handelingen dan de gastheer: de stand opnieuw opvragen
      const mine = typeof msg.n === "number" ? this.events.actionCount?.() : null;
      if (mine != null && mine !== msg.n) {
        if (++this.mismatch >= 2) { this.mismatch = 0; this.conn.send({ t: "sync" }); }
      } else {
        this.mismatch = 0;
      }
      return;
    }
    if (msg.t === "welcome") {
      this.welcomed = true;
      this.everWelcomed = true;
      this.events.onStatus?.("");
      this.events.onWelcome?.(msg.seat);
    }
    else if (msg.t === "lobby") {
      const seats = Number(msg.seats);
      this.events.onLobby?.((msg.players || []).map((p) => ({ ...p, avatar: cleanAvatar(p.avatar), stats: cleanStats(p.stats) })),
        seats >= 2 && seats <= 5 ? seats : 4, msg.pub && typeof msg.pub === "object" ? { title: cleanText(msg.pub.title, 40) } : null);
    }
    else if (msg.t === "start") this.events.onStart?.(msg.game, msg.log);
    else if (msg.t === "act") this.events.onAction?.({ index: msg.index, seat: msg.seat, value: msg.value });
    else if (msg.t === "chat") this.events.onChat?.(msg.message, false);
    else if (msg.t === "chatlog") this.events.onChatLog?.(msg.messages || []);
    else if (msg.t === "full") { this.close(); this.events.onClosed?.(msg.text); }
    else if (msg.t === "bye") { this.close(); this.events.onClosed?.("De gastheer heeft de tafel gesloten."); }
  }

  sendAction(index, seat, value) {
    this.conn.send({ t: "act", index, seat, value });
  }

  /** Een ander plaatje kiezen; de gastheer laat het iedereen zien. */
  setAvatar(v) {
    this.avatar = cleanAvatar(v);
    this.conn.send({ t: "me", avatar: this.avatar });
  }

  /** Je eigen statistiek; gaat mee bij het aanschuiven en daarna bij elke verandering. */
  setStats(v) {
    this.stats = cleanStats(v);
    if (this.welcomed) this.conn.send({ t: "me", stats: this.stats });
  }

  /** Een chatbericht gaat naar de gastheer, die het doorstuurt. Geeft false zonder verbinding. */
  sendChat(text) {
    if (!this.relay.open || !this.welcomed) return false;
    this.conn.send({ t: "chat", text });
    return true;
  }

  close() {
    if (this.closed) return;
    this.conn.send({ t: "bye" });
    this.closed = true;
    clearInterval(this.pinger);
    this.relay.close();
  }
}

/** Tekst van anderen uit de lobby: kort en zonder vreemde tekens. */
const cleanText = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

/**
 * De openbare lobby: iedereen die samen wil spelen maar nog niet aan een tafel zit. Je ziet de open
 * tafels, wie er nog meer in de lobby is, en je kunt met elkaar chatten.
 * events: onTables(list), onPeople(list), onChat(message), onStatus(text)
 */
export class PublicLobby {
  constructor(me, events) {
    this.me = me; // {id, name, avatar}
    this.events = events;
    this.tables = new Map(); // code -> info
    this.people = new Map(); // id -> {name, avatar, time}
    this.chat = [];
    this.seenChat = new Set();
    this.closed = false;
    const sub = () => [`${PUBLIC}/tafels/+`, `${PUBLIC}/lobby/+`, CHAT_TOPIC];
    // Op alle doorgeefservers tegelijk, want gastheren openen hun tafel ook op allemaal
    this.relays = brokers().map((url) => new Relay([url], sub, (msg, relay, t) => this.receive(msg, t, relay), (state) => {
      if (state === "open") this.present();
      if (state === "unsupported") this.events.onStatus?.("Samen spelen werkt niet in deze browser.");
      else this.events.onStatus?.(this.relays?.some((r) => r.open) ? "" : "Verbinden met de lobby…");
    }, { will: presenceTopic(me.id), onEmpty: (t, relay) => this.removed(t, relay) }));
    this.timer = setInterval(() => { this.present(); this.prune(); }, PUBLIC_REFRESH_MS);
  }

  /** Laten weten dat je in de lobby bent. */
  present() {
    if (this.closed) return;
    const a = this.me.avatar && this.me.avatar.length <= 16 ? this.me.avatar : null;
    for (const r of this.relays ?? []) r.publishRetained(presenceTopic(this.me.id), { v: 1, name: this.me.name, avatar: a, time: Date.now() });
  }

  setMe(me) {
    this.me = { ...this.me, ...me };
    this.present();
  }

  receive(msg, t, relay) {
    // De klok van de afzender kan wat afwijken; alleen echt oude berichten negeren
    const fresh = (time) => Number.isFinite(time) && Math.abs(Date.now() - time) < 3 * PUBLIC_STALE_MS;
    // Bij welke doorgeefservers staat dit nog? Pas weg als het bij geen enkele meer staat.
    const via = (old) => { const set = old?.via ?? new Set(); set.add(relay); return set; };
    if (t.startsWith(`${PUBLIC}/tafels/`)) {
      const code = normalizeCode(t.slice(t.lastIndexOf("/") + 1));
      if (code.length !== 5 || msg.code !== code || !fresh(msg.time)) return;
      if (msg.closed) { if (this.tables.delete(code)) this.emitTables(); return; }
      const seats = Math.max(2, Math.min(5, Math.round(Number(msg.seats)) || 4));
      const players = (Array.isArray(msg.players) ? msg.players : []).slice(0, 5).map((n) => cleanText(n, 16) || "Speler");
      this.tables.set(code, {
        code, host: cleanText(msg.host, 16) || "Speler", avatar: cleanAvatar(msg.avatar), seats, players,
        free: Math.max(0, Math.min(seats, Math.round(Number(msg.free)) || 0)),
        title: cleanText(msg.title, 40), variant: cleanText(msg.variant, 40), rounds: Math.max(0, Math.min(30, Math.round(Number(msg.rounds)) || 0)),
        time: msg.time, seen: Date.now(), via: via(this.tables.get(code)), away: false,
      });
      this.emitTables();
    } else if (t.startsWith(`${PUBLIC}/lobby/`)) {
      const id = t.slice(t.lastIndexOf("/") + 1).slice(0, 40);
      if (!fresh(msg.time)) return;
      this.people.set(id, { id, name: cleanText(msg.name, 16) || "Speler", avatar: cleanAvatar(msg.avatar), time: msg.time, seen: Date.now(), via: via(this.people.get(id)), me: id === this.me.id });
      this.emitPeople();
    } else if (t === CHAT_TOPIC) {
      const id = cleanText(msg.id, 40);
      if (!id || this.seenChat.has(id) || !fresh(msg.time)) return; // via meerdere servers binnengekomen
      this.seenChat.add(id);
      const m = { id, from: cleanText(msg.from, 40), name: cleanText(msg.name, 16) || "Speler", avatar: cleanAvatar(msg.avatar), text: cleanText(msg.text, 200), time: msg.time };
      if (!m.text) return;
      this.chat.push(m);
      if (this.chat.length > 100) this.chat.shift();
      this.events.onChat?.(m, m.from === this.me.id);
    }
  }

  /**
   * Een server meldt dat een tafel of persoon weg is. Een gastheer staat op alle servers tegelijk; valt
   * zijn verbinding met één server even weg, dan staat de tafel bij de andere nog gewoon open.
   */
  removed(t, relay) {
    const key = t.slice(t.lastIndexOf("/") + 1);
    const drop = (map) => {
      const x = map.get(key);
      if (!x) return false;
      x.via.delete(relay);
      if (x.via.size) return false;
      map.delete(key);
      return true;
    };
    if (t.startsWith(`${PUBLIC}/tafels/`)) {
      // De verbinding van de gastheer viel weg: de tafel blijft staan, want hij komt vaak zo terug
      const x = this.tables.get(key);
      if (x) {
        x.via.delete(relay);
        if (!x.via.size && !x.away) { x.away = true; x.awaySince = Date.now(); this.emitTables(); }
      }
    }
    if (t.startsWith(`${PUBLIC}/lobby/`) && drop(this.people)) this.emitPeople();
  }

  /** Wat al even niet ververst is, weghalen (bijvoorbeeld een gastheer die zonder afmelden verdween). */
  prune() {
    const old = (x) => Date.now() - x.seen > PUBLIC_STALE_MS;
    // Een gastheer die even weg is, krijgt langer de tijd
    const gone = (x) => (x.away ? Date.now() - x.awaySince > AWAY_MS : old(x));
    let changed = false;
    for (const [k, v] of this.tables) if (gone(v)) { this.tables.delete(k); changed = true; }
    if (changed) this.emitTables();
    changed = false;
    for (const [k, v] of this.people) if (old(v) && !v.me) { this.people.delete(k); changed = true; }
    if (changed) this.emitPeople();
  }

  emitTables() {
    this.events.onTables?.([...this.tables.values()].sort((a, b) => (b.free > 0) - (a.free > 0) || b.time - a.time));
  }

  emitPeople() {
    this.events.onPeople?.([...this.people.values()].sort((a, b) => b.me - a.me || a.name.localeCompare(b.name)));
  }

  /** Een chatbericht voor iedereen in de lobby. */
  sendChat(text) {
    const clean = cleanText(text, 200);
    if (!clean) return false;
    const a = this.me.avatar && this.me.avatar.length <= 16 ? this.me.avatar : null;
    const msg = { id: `${this.me.id}-${Date.now().toString(36)}`, from: this.me.id, name: this.me.name, avatar: a, text: clean, time: Date.now() };
    let sent = false;
    for (const r of this.relays) sent = r.publish(CHAT_TOPIC, msg) || sent;
    return sent;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.timer);
    for (const r of this.relays) { r.publishRetained(presenceTopic(this.me.id), null); r.close(); }
  }
}
