// Recadre chaque SVG sur son contenu et sort le titre et le sous-titre (affichés en HTML dans l app).
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "fs";
const [,, inFile, outFile] = process.argv;
const raw = JSON.parse(fs.readFileSync(inFile, "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<html><body style="font-family: system-ui, sans-serif"></body></html>`);
const res = await page.evaluate((raw) => {
  const out = {};
  for (const [id, svg] of Object.entries(raw)) {
    const div = document.createElement("div");
    div.style.width = "760px";
    div.innerHTML = svg;
    document.body.appendChild(div);
    const el = div.querySelector("svg");
    const t = el.querySelector('[data-role="title"]'), s = el.querySelector('[data-role="sub"]');
    const titre = t ? t.textContent : "", sous = s ? s.textContent : "";
    t && t.remove(); s && s.remove();
    const b = el.getBBox(), pad = 12;
    const vb = el.viewBox.baseVal;
    const x = Math.floor(b.x - pad), y = Math.floor(b.y - pad);
    const x2 = Math.ceil(b.x + b.width + pad), y2 = Math.ceil(b.y + b.height + pad);
    el.setAttribute("viewBox", `${x} ${y} ${x2 - x} ${y2 - y}`);
    out[id] = { titre, sous, w: x2 - x, h: y2 - y, svg: el.outerHTML };
    div.remove();
  }
  return out;
}, raw);
fs.writeFileSync(outFile, JSON.stringify(res, null, 0));
for (const [id, r] of Object.entries(res)) console.log(id, r.w + "x" + r.h, "|", r.titre, "|", r.sous.slice(0, 60));
await browser.close();
