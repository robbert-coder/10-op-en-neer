// Statistieken online bewaren in een Supabase-database, zonder inloggen: wie de persoonlijke code kent,
// ziet en vult dezelfde statistieken. Zo heb je in de app, in de browser en op een ander apparaat
// dezelfde cijfers.

/** Het Supabase-project (Project Settings > API). De sleutel is de openbare "anon"-sleutel. */
const CONFIG = {
  url: "",
  key: "",
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
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
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
