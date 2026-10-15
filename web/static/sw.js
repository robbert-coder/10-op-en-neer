// Bewaart alle bestanden van het spel, zodat het ook zonder internet werkt.
// VERSION wordt bij het bouwen ingevuld; een nieuwe versie ververst de bewaarde bestanden.
const VERSION = "__BUILD__";
const CACHE = `tienopenneer-${VERSION}`;

const EVENTS = [
  "slag_te_veel", "slag_te_weinig", "onvoorkombare_ondergang", "goed_voorspeld",
  "medespeler_nat", "goed_gespeeld", "zeer_goed_gespeeld",
];
const FILES = [
  "./", "index.html", "style.css", "app.js", "faces.js", "tineke.js", "pacing.js", "voices.js", "characters.js", "changelog.js", "net.js", "cloud.js", "validate.js", "ident.js",
  "dom.js", "storage.js", "rules.js", "stats.js", "hof.js", "sound.js", "celebrate.js", "notify.js", "cards.js", "version.js", "codes.js", "speech.js", "i18n.js", "i18n-en.js", "qr.svg", "vendor/mqtt.min.js", "tienopenneer.mjs", "kotlin-kotlin-stdlib.mjs",
  "kotlin_org_jetbrains_kotlin_kotlin_dom_api_compat.mjs",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
  ...EVENTS.map((e) => `sounds/${e}.mp3`),
  ...Array.from({ length: 14 }, (_, n) => `sounds/bod_speler_neutraal_${n}_0.mp3`),
];
// De stemmen van de computerspelers (veel kleine bestanden) worden bewaard zodra ze een keer gebruikt zijn

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// De pagina en de code eerst van internet, zodat je altijd de nieuwste versie hebt; zonder internet uit de
// bewaarde kopie. Geluiden en plaatjes komen meteen uit de bewaarde kopie.
const FRESH = /\.(html|js|mjs|css|webmanifest)$|\/$/;

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (FRESH.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true })),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request).then((res) => {
      if (res.ok && url.pathname.includes("/sounds/")) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return res;
    })),
  );
});

// Tik op een melding: terug naar het spel
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => "focus" in c);
      return open ? open.focus() : self.clients.openWindow("./");
    }),
  );
});
