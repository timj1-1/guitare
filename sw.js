// Ma gratte : fonctionne hors ligne. Le cours et les retours du prof sont pris en ligne d'abord.
const VERSION = "v44";
// la voix : un fichier par phrase, nommé par son empreinte, donc gardé d'une version à l'autre
const VOIX = "voix-1";
// les sons de guitare (1,7 Mo) ne changent jamais : gardés à part, eux aussi, au lieu d'être retéléchargés à chaque version
const SONS = "sons-1";
const SAMPLES = ["samples-nylon.js", "samples-acier.js"];
// le lecteur de PDF (1,4 Mo) ne change pas non plus : gardé à part, pour ouvrir tes tablatures hors ligne même après une mise à jour
const LIBS = "libs-1";
const PDFJS = ["lib/pdfjs/pdf.min.js", "lib/pdfjs/pdf.worker.min.js"];
const SHELL = ["./", "index.html", "style.css", "app.js", "sons.js", "jeux.js", "niveaux.js", "reglages.js", "manche.html", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "data/cours.json", "data/retours.json", "data/schemas.json", "schemas/notes-manche.webp", "voix/voix.json",
  "fonts/fonts.css", "fonts/instrument-sans.woff2", "fonts/instrument-sans-italic.woff2", "fonts/instrument-serif.woff2", "fonts/instrument-serif-italic.woff2", "fonts/jetbrains-mono.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(Promise.all([
    caches.open(VERSION).then(c => c.addAll(SHELL)),
    caches.open(SONS).then(async c => { for (const f of SAMPLES) if (!(await c.match(f))) await c.add(f); }),
    caches.open(LIBS).then(async c => { for (const f of PDFJS) if (!(await c.match(f))) await c.add(f); }),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== VOIX && k !== SONS && k !== LIBS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Réseau lent (métro, 4G faible) : au bout de 3 s, on ouvre la copie gardée. Le réseau finit quand même de la mettre à jour.
// Une fois le réseau jugé lent, les fichiers suivants (code, cours) sont pris tout de suite dans la copie pendant 20 s.
const ATTENTE = 3000;
let lentJusqua = 0;
const networkFirst = async (e, req) => {
  const cache = await caches.open(VERSION);
  let fini = false;
  const reseau = fetch(req, { cache: "no-cache" }).then(res => {
    fini = true;
    if (res.ok) return cache.put(req, res.clone()).then(() => res);
    return res;
  });
  e.waitUntil(reseau.catch(() => {}));
  const copie = () => cache.match(req, { ignoreSearch: true });
  const attente = Date.now() < lentJusqua ? 0 : ATTENTE;
  const lent = new Promise(ok => setTimeout(ok, attente)).then(copie).then(hit => {
    if (fini || !hit) return reseau;
    lentJusqua = Date.now() + 20000;
    return hit;
  });
  try {
    return await Promise.race([reseau, lent]);
  } catch {
    return (await copie()) || Response.error();
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
  } else if (url.origin === location.origin && /\/samples-(nylon|acier)\.js$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req, SONS));
  } else if (url.origin === location.origin && url.pathname.includes("/lib/pdfjs/")) {
    e.respondWith(cacheFirst(req, LIBS));
  } else if (url.origin === location.origin) {
    // pages, code et données : toujours la dernière version si on est en ligne
    e.respondWith(networkFirst(e, req));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(cacheFirst(req));
  }
});
