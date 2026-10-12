// Samen spelen via internet. De apparaten maken rechtstreeks verbinding met elkaar (WebRTC via PeerJS);
// de openbare PeerJS-server helpt alleen om elkaar te vinden. Wie de tafel opent is de gastheer: alle
// berichten gaan via hem. Iedereen rekent het spel zelf uit; dat kan omdat het spel met dezelfde
// beginwaarde (seed) en dezelfde handelingen van de mensen altijd precies hetzelfde verloopt.

const PREFIX = "tienopenneer-v1-";
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
 * Servers die helpen om een rechtstreekse verbinding te vinden. STUN is genoeg op de meeste netwerken; de
 * TURN-servers van PeerJS sturen het verkeer door als twee apparaten elkaar niet rechtstreeks kunnen bereiken
 * (bijvoorbeeld op mobiel internet).
 */
const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: ["turn:eu-0.turn.peerjs.com:3478", "turn:us-0.turn.peerjs.com:3478"],
    username: "peerjs", credential: "peerjsp",
  },
];

/** Hoe lang we wachten op de server of op de tafel voordat we het opnieuw proberen. */
const WAIT_MS = 12000;

/** Instellingen voor PeerJS. Met ?peerhost=host:poort kan een eigen (test)server gebruikt worden. */
function peerOptions() {
  const host = new URLSearchParams(location.search).get("peerhost");
  if (!host) return { debug: 0, config: { iceServers: ICE_SERVERS } };
  const [h, port] = host.split(":");
  return { host: h, port: Number(port || 9000), path: "/", secure: false, debug: 0 };
}

function newPeer(id) {
  const Peer = window.peerjs?.Peer;
  if (!Peer) throw new Error("Samen spelen werkt niet in deze browser.");
  return id ? new Peer(id, peerOptions()) : new Peer(peerOptions());
}

const peerError = (err) => {
  const t = err?.type;
  if (t === "unavailable-id") return "Deze tafel bestaat al. Probeer het opnieuw.";
  if (t === "peer-unavailable") return "Er is geen tafel met deze code, of de gastheer is niet meer online.";
  if (t === "network" || t === "server-error" || t === "socket-error" || t === "socket-closed") {
    return "Geen verbinding met internet of met de server die de spelers aan elkaar koppelt.";
  }
  if (t === "browser-incompatible") return "Samen spelen werkt niet in deze browser.";
  return "Er ging iets mis met de verbinding.";
};

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
    this.peer = newPeer(PREFIX + this.code);
    clearTimeout(this.peerTimer);
    this.peerTimer = setTimeout(() => {
      if (!this.closed && !this.peer.open) {
        this.events.onStatus?.("De server die de spelers aan elkaar koppelt reageert nog niet. Even geduld…");
      }
    }, WAIT_MS);
    this.peer.on("open", () => { clearTimeout(this.peerTimer); this.events.onStatus?.(""); });
    this.peer.on("connection", (conn) => this.accept(conn));
    this.peer.on("disconnected", () => { if (!this.closed) setTimeout(() => this.peer.reconnect(), 2000); });
    this.peer.on("error", (err) => {
      if (err?.type === "unavailable-id" && this.restarting) {
        // De oude verbinding is bij de server nog niet weg; even later opnieuw proberen
        setTimeout(() => this.open(), 3000);
        return;
      }
      this.events.onError?.(peerError(err));
    });
  }

  accept(conn) {
    conn.on("data", (msg) => this.receive(conn, msg));
    conn.on("close", () => this.dropped(conn));
    conn.on("error", () => this.dropped(conn));
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
    clearTimeout(this.peerTimer);
    this.broadcast({ t: "bye" });
    setTimeout(() => this.peer?.destroy(), 300);
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
    this.retries = 0;
    this.attempts = 0;
    this.peer = newPeer();
    this.peerTimer = setTimeout(() => {
      if (!this.closed && !this.peer.open) {
        this.events.onError?.("De server die de spelers aan elkaar koppelt reageert niet. Controleer je internet en probeer het opnieuw.");
      }
    }, WAIT_MS);
    this.peer.on("open", () => { clearTimeout(this.peerTimer); this.connect(); });
    this.peer.on("disconnected", () => { if (!this.closed) setTimeout(() => this.peer.reconnect(), 2000); });
    this.peer.on("error", (err) => {
      if (err?.type === "peer-unavailable" && this.everConnected && !this.closed) {
        this.retryLater();
        return;
      }
      this.events.onError?.(peerError(err));
    });
  }

  connect() {
    if (this.closed) return;
    const conn = this.peer.connect(PREFIX + this.code, { reliable: true });
    this.conn = conn;
    this.attempts++;
    // Lukt de verbinding niet binnen een paar tellen, dan opnieuw proberen en zeggen wat er aan de hand is
    clearTimeout(this.connTimer);
    this.connTimer = setTimeout(() => {
      if (this.closed || conn !== this.conn || conn.open) return;
      if (this.attempts >= 2) {
        this.events.onStatus?.(this.attempts >= 4
          ? "Het lukt niet om de tafel te bereiken. Staat de tafel nog open bij de gastheer? Soms helpt het als iedereen op wifi zit."
          : "De tafel reageert nog niet. Opnieuw proberen…");
      }
      try { conn.close(); } catch (e) { /* al dicht */ }
      this.connect();
    }, WAIT_MS);
    conn.on("error", () => {
      if (this.closed || conn !== this.conn) return;
      clearTimeout(this.connTimer);
      this.retryLater();
    });
    conn.on("open", () => {
      clearTimeout(this.connTimer);
      this.attempts = 0;
      this.everConnected = true;
      this.retries = 0;
      this.events.onStatus?.("");
      conn.send({ t: "hello", id: this.clientId, name: this.name, avatar: this.avatar });
    });
    conn.on("data", (msg) => this.receive(msg));
    conn.on("close", () => {
      if (this.closed || conn !== this.conn) return;
      this.events.onStatus?.("De verbinding met de tafel is weg. Opnieuw verbinden…");
      this.retryLater();
    });
  }

  retryLater() {
    if (this.closed) return;
    this.retries++;
    setTimeout(() => this.connect(), Math.min(10000, 1500 * this.retries));
  }

  receive(msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.t === "welcome") this.events.onWelcome?.(msg.seat);
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
    if (this.conn?.open) this.conn.send({ t: "act", index, seat, value });
  }

  /** Een ander plaatje kiezen; de gastheer laat het iedereen zien. */
  setAvatar(v) {
    this.avatar = cleanAvatar(v);
    if (this.conn?.open) this.conn.send({ t: "me", avatar: this.avatar });
  }

  /** Een chatbericht gaat naar de gastheer, die het doorstuurt. Geeft false zonder verbinding. */
  sendChat(text) {
    if (!this.conn?.open) return false;
    this.conn.send({ t: "chat", text });
    return true;
  }

  close() {
    this.closed = true;
    clearTimeout(this.connTimer);
    clearTimeout(this.peerTimer);
    try { this.conn?.close(); } catch { /* al dicht */ }
    setTimeout(() => this.peer?.destroy(), 300);
  }
}
