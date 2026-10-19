// Versie van het spel. De bouw (web.yml) controleert dat deze gelijk is aan die van de Android-app.
export const APP_VERSION = "2.60";

/** "v2.16" tegenover "2.15": is de eerste nieuwer? Per getal vergeleken, dus 2.10 is nieuwer dan 2.9. */
export function isNewerVersion(tag, installed) {
  const parts = (v) => String(v).replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const a = parts(tag), b = parts(installed);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}
