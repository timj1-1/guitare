// Schémas du Claude Doc → SVG. 1) Mettre le code JSX de chaque widget dans <dossier>/<id>.jsx
// 2) node tools/schemas/compile.cjs <dossier> brut.json  3) node tools/schemas/crop.mjs brut.json recadre.json
// 4) reporter svg, titre, sous, w, h dans data/schemas.json (clé = nom du schéma, "source" = id du widget).
const ts = require("/opt/node22/lib/node_modules/typescript");
const fs = require("fs"), path = require("path");
const [,, inDir, outFile] = process.argv;
const KEEP = new Set(["viewBox","refX","refY","markerWidth","markerHeight","markerUnits","preserveAspectRatio","gradientUnits","gradientTransform","patternUnits","textLength","lengthAdjust","startOffset","stdDeviation","pathLength","clipPathUnits"]);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escA = s => esc(s).replace(/"/g,"&quot;");
const FRAG = Symbol("frag");
function flat(kids, acc=[]) { for (const k of kids) { if (Array.isArray(k)) flat(k, acc); else if (k === null || k === undefined || k === false || k === true) {} else acc.push(k); } return acc; }
function h(tag, props, ...kids) {
  const inner = flat(kids).map(k => typeof k === "object" && k.__html !== undefined ? k.__html : esc(k)).join("");
  if (tag === FRAG) return { __html: inner };
  let attrs = "";
  for (const [k, v] of Object.entries(props || {})) {
    if (k === "data-claude-text-id" && (v === "title" || v === "sub")) { attrs += ` data-role="${v}"`; continue; }
    if (k === "key" || k.startsWith("data-claude") || v === null || v === undefined || v === false) continue;
    let name = k === "className" ? "class" : KEEP.has(k) ? k : k.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
    if (name === "style" && typeof v === "object") { attrs += ` style="${escA(Object.entries(v).map(([a,b]) => a.replace(/[A-Z]/g, m => "-" + m.toLowerCase()) + ":" + b).join(";"))}"`; continue; }
    attrs += ` ${name}="${escA(v)}"`;
  }
  return { __html: `<${tag}${attrs}>${inner}</${tag}>` };
}
const out = {};
for (const f of fs.readdirSync(inDir).filter(f => f.endsWith(".jsx")).sort()) {
  const id = f.replace(/\.jsx$/, "");
  const src = fs.readFileSync(path.join(inDir, f), "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: "h", jsxFragmentFactory: "FRAG", module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "h", "FRAG", js)(mod, mod.exports, h, FRAG);
  let svg = mod.exports.default().__html;
  // ids des marqueurs uniques par schéma
  svg = svg.replace(/id="([^"]+)"/g, (m, i) => `id="${id}-${i}"`).replace(/url\(#([^)]+)\)/g, (m, i) => `url(#${id}-${i})`);
  out[id] = svg;
  console.log(id, svg.length, (svg.match(/aria-label="([^"]*)"/) || [])[1]);
}
fs.writeFileSync(outFile, JSON.stringify(out));
