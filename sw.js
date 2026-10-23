// Ma guitare : fonctionne hors ligne. Le cours et les retours du prof sont pris en ligne d'abord.
const VERSION = "v6";
// la voix : un fichier par phrase, nommé par son empreinte, donc gardé d'une version à l'autre
const VOIX = "voix-1";
const SHELL = ["./", "index.html", "style.css", "app.js", "sons.js", "jeux.js", "samples-nylon.js", "manche.html", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "data/cours.json", "data/retours.json", "data/schemas.json", "schemas/notes-manche.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== VOIX).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const networkFirst = async req => {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
};
const cacheFirst = async (req, name = VERSION) => {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
};

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.includes("/voix/") && url.pathname.endsWith(".mp3")) {
    e.respondWith(cacheFirst(req, VOIX));
  } else if (url.origin === location.origin) {
    // pages, code et données : toujours la dernière version si on est en ligne
    e.respondWith(networkFirst(req));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(cacheFirst(req));
  }
});
