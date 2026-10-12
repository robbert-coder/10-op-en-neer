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

/** De plaatjes die je kunt kiezen, naast een eigen foto. */
export const AVATAR_EMOJIS = ["🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯", "🐨", "🐷", "🐙", "🦉", "🐧",
  "😎", "🤠", "👑", "🌷", "⚽", "🎸", "☕", "🍀"];

/** Een plaatje van een ander alleen gebruiken als het een van de emoji's is of een kleine foto. */
export function cleanAvatar(v) {
  if (typeof v !== "string") return null;
  if (AVATAR_EMOJIS.includes(v)) return v;
  if (v.length <= 60000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  return null;
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
  return own ? [own] : BROKERS;
};
const topic = (code) => `tienopenneer/v2/${code}`;

/** Hoe vaak we een teken van leven sturen, en na hoe lang zonder bericht iemand weg is. */
const PING_MS = 4000;
const GONE_MS = 16000;
/** Hoe lang een gast wacht op antwoord van de tafel voordat hij een andere doorgeefserver probeert. */
const WAIT_MS = 10000;

/** Een verbinding met een doorgeefserver; valt hij weg, dan opnieuw (bij [rotate] met de volgende server). */
class Relay {
  constructor(urls, subscribe, onMessage, onState) {
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
    });
    this.client = client;
    let ok = false;
    client.on("connect", () => {
      ok = true;
      client.subscribe(this.subscribe(), { qos: 0 });
      this.onState("open");
    });
    client.on("message", (t, payload) => {
      let msg;
      try { msg = JSON.parse(payload.toString()); } catch { return; }
      if (msg && typeof msg === "object") this.onMessage(msg, this);
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
  constructor(code, myName, events, saved = null, myAvatar = null, seats = 4) {
    this.code = code;
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
    return { code: this.code, players: this.players, started: this.started, log: this.log, chat: this.chat };
  }

  open() {
    // Per gast een "verbinding": berichten gaan via de server waarop de gast zich meldde
    this.links = new Map();
    const base = topic(this.code);
    this.relays = brokers().map((url) => new Relay([url], () => `${base}/h`, (msg, relay) => this.incoming(msg, relay), () => {
      if (this.relays?.some((r) => r.open)) { clearTimeout(this.waitTimer); this.events.onStatus?.(""); }
    }));
    this.waitTimer = setTimeout(() => {
      if (!this.closed && !this.relays.some((r) => r.open)) {
        this.events.onStatus?.("De server die de spelers aan elkaar koppelt reageert nog niet. Controleer je internet.");
      }
    }, WAIT_MS);
    this.pinger = setInterval(() => this.heartbeat(), PING_MS);
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
    if (msg.t === "bye") { this.links.delete(id); conn.open = false; this.dropped(conn); return; }
    this.receive(conn, msg);
  }

  /** Iedereen een teken van leven sturen, en wie al even niets liet horen als weg zien. */
  heartbeat() {
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
      if (p) { p.avatar = cleanAvatar(msg.avatar); this.lobbyChanged(); }
    } else if (msg.t === "chat") {
      const p = this.players.find((x) => x.id === conn.clientId);
      if (p) this.addChat(p.seat, p.name, msg.text, conn);
    } else if (msg.t === "act") {
      const p = this.players.find((x) => x.id === conn.clientId);
      if (!p || !this.started || msg.seat !== p.seat) return;
      if (msg.index !== this.log.length) {
        // Loopt niet gelijk: stuur de hele stand opnieuw
        conn.send({ t: "start", game: this.started, log: this.log });
        return;
      }
      this.record(msg.seat, msg.value, conn);
      this.events.onAction?.({ index: msg.index, seat: msg.seat, value: msg.value });
    }
  }

  dropped(conn) {
    const p = this.players.find((x) => x.id === conn.clientId);
    if (!p || this.conns.get(p.id) !== conn) return;
    this.conns.delete(p.id);
    if (this.started) {
      p.online = false;
    } else {
      this.players = this.players.filter((x) => x !== p);
    }
    this.lobbyChanged();
  }

  lobbyChanged() {
    const list = this.players.map(({ name, seat, online, avatar }) => ({ name, seat, online, avatar: avatar ?? null }));
    this.broadcast({ t: "lobby", players: list, seats: this.seats });
    this.events.onLobby?.(list, this.seats);
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

  /** Een handeling van de gastheer zelf. */
  sendAction(index, seat, value) {
    if (index !== this.log.length) return;
    this.record(seat, value);
  }

  close() {
    this.closed = true;
    clearTimeout(this.waitTimer);
    clearInterval(this.pinger);
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
    this.conn.send({ t: "hello", id: this.clientId, name: this.name, avatar: this.avatar });
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
      this.events.onLobby?.((msg.players || []).map((p) => ({ ...p, avatar: cleanAvatar(p.avatar) })),
        seats >= 2 && seats <= 5 ? seats : 4);
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
