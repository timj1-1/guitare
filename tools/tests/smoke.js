// Test de fumée de Ma gratte : ouvre l'app sur un écran d'ordinateur et un écran de téléphone,
// parcourt les 36 cours, ouvre chaque bloc et chaque onglet, et relève les erreurs de la console.
// Usage (depuis la racine du dépôt) : node tools/tests/smoke.js [dossier-captures]
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.resolve(process.argv[2] || path.join(os.tmpdir(), "gratte-captures"));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".mp3": "audio/mpeg", ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise(ok => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(res);
    }).listen(0, () => ok(srv));
  });
}

const ECRANS = [
  { nom: "ordinateur", viewport: { width: 1280, height: 800 } },
  { nom: "telephone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const url = `http://localhost:${srv.address().port}/`;
  const cours = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cours.json"), "utf8")).cours;
  const browser = await chromium.launch();
  let erreurs = 0;
  for (const e of ECRANS) {
    const { nom, ...opts } = e;
    const ctx = await browser.newContext({ ...opts, serviceWorkers: "block" });
    const page = await ctx.newPage();
    const log = [];
    page.on("pageerror", x => log.push("pageerror: " + x.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) log.push("console: " + m.text()); });
    for (const c of cours) {
      await page.goto(url);
      await page.evaluate(id => {
        const s = JSON.parse(localStorage.getItem("maguitare:v1") || "{}");
        s.current = id; s.view = "cours"; localStorage.setItem("maguitare:v1", JSON.stringify(s));
        localStorage.setItem("maguitare:prof", "0");
      }, c.id);
      await page.reload();
      await page.waitForSelector(".bloc-head");
      for (const h of await page.$$(".bloc-head")) {
        if ((await h.getAttribute("aria-expanded")) === "false") await h.click();
      }
      if (c.num === 1) await page.screenshot({ path: path.join(OUT, `${nom}-cours1.png`), fullPage: true });
    }
    for (const v of ["manche", "morceaux", "jeux", "bilan"]) {
      const b = await page.$(`.tabbar [data-view="${v}"], .tabbar [data-go="${v}"], .tabbar [aria-controls="view-${v}"]`);
      if (b) { await b.click(); await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, `${nom}-${v}.png`) }); }
      else log.push(`onglet introuvable : ${v}`);
    }
    console.log(`${nom} : ${cours.length} cours parcourus, ${log.length} erreur(s)`);
    log.slice(0, 20).forEach(l => console.log("  " + l));
    erreurs += log.length;
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log(`Captures : ${OUT}`);
  process.exit(erreurs ? 1 : 0);
})();
