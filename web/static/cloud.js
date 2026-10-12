// Statistieken online bewaren in een Supabase-database, zonder inloggen: wie de persoonlijke code kent,
// ziet en vult dezelfde statistieken. Zo heb je in de app, in de browser en op een ander apparaat
// dezelfde cijfers.

/** Het Supabase-project (Project Settings > API). De sleutel is de openbare "anon"-sleutel. */
const CONFIG = {
  url: "https://llyxrwgankrsjjgwzyrh.supabase.co",
  key: "sb_publishable_NkO6L_jj1GevBfhplqoufA_txNrorj0",
};

const params = new URLSearchParams(location.search);
// Met ?cloud=http://host:poort kan een eigen (test)server gebruikt worden
const URL_BASE = (params.get("cloud") || CONFIG.url).replace(/\/+$/, "");
const KEY = params.get("cloud") ? "test" : CONFIG.key;

export const cloudEnabled = () => !!URL_BASE && !!KEY;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // zonder 0/O en 1/I

/** Een nieuwe persoonlijke code van twaalf tekens. */
export function makeCloudCode() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const normalizeCloudCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const formatCloudCode = (c) => c.replace(/(.{4})(?=.)/g, "$1-");
export const validCloudCode = (c) => c.length === 12 && [...c].every((ch) => ALPHABET.includes(ch));

async function rpc(name, body) {
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${name}`, {
    method: "POST",
    // Een oude "anon"-sleutel is een JWT en mag ook als Bearer mee; een nieuwe "publishable" sleutel alleen als apikey
    headers: { apikey: KEY, ...(KEY.startsWith("eyJ") ? { Authorization: `Bearer ${KEY}` } : {}), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`server ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** De bewaarde gegevens bij een code: {games, clearedAt}, of null als er nog niets is. */
export async function fetchStats(code) {
  const data = await rpc("get_stats", { p_code: code });
  if (!data || typeof data !== "object") return null;
  return {
    games: Array.isArray(data.games) ? data.games.filter((g) => g && typeof g === "object" && typeof g.id === "string") : [],
    clearedAt: Number(data.clearedAt) || 0,
  };
}

export function saveStats(code, games, clearedAt) {
  return rpc("put_stats", { p_code: code, p_data: { v: 1, games, clearedAt } });
}

// Hall of Fame ------------------------------------------------------------------------------

/** De beste score per speler in een lijst, en de spelers met hun overzicht. */
export async function fetchHallOfFame(list) {
  const data = await rpc("hof_get", { p_list: list });
  return {
    scores: Array.isArray(data?.scores) ? data.scores : [],
    players: Array.isArray(data?.players) ? data.players : [],
  };
}

export const sendHofScore = (player, name, avatar, e) =>
  rpc("hof_put_score", { p_player: player, p_game: e.game, p_name: name, p_avatar: avatar, p_list: e.list, p_score: e.score, p_detail: e.detail ?? "" });

export const sendHofPlayer = (player, name, avatar, stats) =>
  rpc("hof_put_player", { p_player: player, p_name: name, p_avatar: avatar, p_stats: stats });
