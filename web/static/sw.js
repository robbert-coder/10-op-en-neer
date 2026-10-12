// Bewaart alle bestanden van het spel, zodat het ook zonder internet werkt.
// VERSION wordt bij het bouwen ingevuld; een nieuwe versie ververst de bewaarde bestanden.
const VERSION = "__BUILD__";
const CACHE = `tienopenneer-${VERSION}`;

const VOICES = ["speler", "henk", "truus", "kees", "ria"];
const EVENTS = [
  "slag_te_veel", "slag_te_weinig", "onvoorkombare_ondergang", "goed_voorspeld",
  "medespeler_nat", "goed_gespeeld", "zeer_goed_gespeeld",
];
const FILES = [
  "./", "index.html", "style.css", "app.js", "faces.js", "tineke.js", "voices.js", "net.js", "vendor/mqtt.min.js", "tienopenneer.mjs", "kotlin-kotlin-stdlib.mjs",
  "kotlin_org_jetbrains_kotlin_kotlin_dom_api_compat.mjs",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
  ...EVENTS.map((e) => `sounds/${e}.mp3`),
  ...VOICES.flatMap((v) => Array.from({ length: 14 * 3 }, (_, i) => `sounds/bod_${v}_${Math.floor(i / 3)}_${i % 3}.mp3`)),
  ...VOICES.slice(1).flatMap((v) => [0, 1, 2].map((k) => `sounds/nat_${v}_${k}.mp3`)),
];

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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)),
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
