// Samen spelen via internet. De apparaten maken rechtstreeks verbinding met elkaar (WebRTC via PeerJS);
// de openbare PeerJS-server helpt alleen om elkaar te vinden. Wie de tafel opent is de gastheer: alle
// berichten gaan via hem. Iedereen rekent het spel zelf uit; dat kan omdat het spel met dezelfde
// beginwaarde (seed) en dezelfde handelingen van de mensen altijd precies hetzelfde verloopt.

const PREFIX = "tienopenneer-v1-";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Volgorde waarin mensen een stoel krijgen: eerst tegenover elkaar. */
export const SEAT_ORDER = [1, 3, 2, 4];

export function makeCode() {
  let c = "";
  for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

export const normalizeCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

/** Instellingen voor PeerJS. Met ?peerhost=host:poort kan een eigen (test)server gebruikt worden. */
function peerOptions() {
  const host = new URLSearchParams(location.search).get("peerhost");
  if (!host) return { debug: 0 };
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
  constructor(code, myName, events, saved = null) {
    this.code = code;
    this.events = events;
    this.players = [{ id: "host", name: myName, seat: 1, online: true }];
    this.conns = new Map(); // clientId -> verbinding
    this.started = null; // startgegevens zodra het spel loopt
    this.log = []; // alle handelingen van mensen, in volgorde: {seat, value}
    this.closed = false;
    if (saved) {
      // Na het herladen van de pagina: dezelfde tafel weer openen, de anderen verbinden vanzelf opnieuw
      this.players = saved.players.map((p) => ({ ...p, online: p.id === "host" }));
      this.started = saved.started;
      this.log = saved.log;
      this.restarting = true;
    }
    this.open();
  }

  /** Wat er bewaard moet worden om de tafel na herladen weer te openen. */
  snapshot() {
    return { code: this.code, players: this.players, started: this.started, log: this.log };
  }

  open() {
    this.peer = newPeer(PREFIX + this.code);
    this.peer.on("open", () => this.events.onStatus?.(""));
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
        const free = SEAT_ORDER.find((s) => !this.players.some((x) => x.seat === s));
        if (!free) { conn.send({ t: "full", text: "De tafel is vol." }); return; }
        p = { id, name, seat: free, online: true };
        this.players.push(p);
      }
      p.online = true;
      if (!this.started) p.name = name;
      conn.clientId = id;
      const old = this.conns.get(id);
      if (old && old !== conn) old.close();
      this.conns.set(id, conn);
      conn.send({ t: "welcome", seat: p.seat, code: this.code });
      if (this.started) conn.send({ t: "start", game: this.started, log: this.log });
      this.lobbyChanged();
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
    const list = this.players.map(({ name, seat, online }) => ({ name, seat, online }));
    this.broadcast({ t: "lobby", players: list });
    this.events.onLobby?.(list);
  }

  broadcast(msg, except = null) {
    for (const c of this.conns.values()) if (c !== except && c.open) c.send(msg);
  }

  record(seat, value, from = null) {
    const index = this.log.length;
    this.log.push({ seat, value });
    this.broadcast({ t: "act", index, seat, value }, from);
  }

  /** Begint het spel; lege stoelen worden computerspelers. */
  start(game) {
    this.started = game;
    this.log = [];
    this.broadcast({ t: "start", game, log: [] });
    this.lobbyChanged();
  }

  /** Een handeling van de gastheer zelf. */
  sendAction(index, seat, value) {
    if (index !== this.log.length) return;
    this.record(seat, value);
  }

  close() {
    this.closed = true;
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
  constructor(code, myName, clientId, events) {
    this.code = code;
    this.name = myName;
    this.clientId = clientId;
    this.events = events;
    this.closed = false;
    this.retries = 0;
    this.peer = newPeer();
    this.peer.on("open", () => this.connect());
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
    conn.on("open", () => {
      this.everConnected = true;
      this.retries = 0;
      this.events.onStatus?.("");
      conn.send({ t: "hello", id: this.clientId, name: this.name });
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
    else if (msg.t === "lobby") this.events.onLobby?.(msg.players);
    else if (msg.t === "start") this.events.onStart?.(msg.game, msg.log);
    else if (msg.t === "act") this.events.onAction?.({ index: msg.index, seat: msg.seat, value: msg.value });
    else if (msg.t === "full") { this.close(); this.events.onClosed?.(msg.text); }
    else if (msg.t === "bye") { this.close(); this.events.onClosed?.("De gastheer heeft de tafel gesloten."); }
  }

  sendAction(index, seat, value) {
    if (this.conn?.open) this.conn.send({ t: "act", index, seat, value });
  }

  close() {
    this.closed = true;
    try { this.conn?.close(); } catch { /* al dicht */ }
    setTimeout(() => this.peer?.destroy(), 300);
  }
}
