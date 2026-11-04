// Banc d'essai de l'accordeur (MAJ 01 §15.1) : YIN et MPM sur des cordes de nylon simulées (harmoniques, inharmonicité, fondamentale faible, bruit).
// Usage : node tools/tests/banc_accordeur.js (environ 1 min 30). Résultat du 2026-11-04 : YIN décimé, lissé sur 5 mesures : médiane 1,1 centième, p95 4 ; MPM : beaucoup d'erreurs d'octave.
const SR = 48000;
// Corde réaliste : fondamentale faible (Mi grave sur petit micro de téléphone), harmoniques légèrement inharmoniques
function additive(f, dur = 1.2, { B = 0.00008, fond = 1, bruit = 0.01, seed = 3 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const out = new Float32Array(Math.floor(SR * dur)), H = 14;
  const amps = Array.from({ length: H }, (_, k) => (k === 0 ? fond : 1 / (k + 1)) * (1 + 0.3 * rnd()));
  const ph = amps.map(() => Math.PI * rnd());
  for (let i = 0; i < out.length; i++) {
    const t = i / SR; let v = 0;
    for (let k = 1; k <= H; k++) { const fk = k * f * Math.sqrt(1 + B * k * k); if (fk > SR / 2) break; v += amps[k - 1] * Math.exp(-t * (1.2 + 0.6 * k)) * Math.sin(2 * Math.PI * fk * t + ph[k - 1]); }
    out[i] = 0.3 * v + bruit * rnd();
  }
  return out;
}
const cents = (f, ref) => 1200 * Math.log2(f / ref);
// ---------- YIN ----------
function yin(x, sr, fmin = 60, fmax = 1100, seuil = 0.12) {
  const n = x.length, maxT = Math.min(Math.floor(sr / fmin), n >> 1), minT = Math.floor(sr / fmax), W = n - maxT - 2;
  const cm = new Float32Array(maxT + 2); cm[0] = 1; let acc = 0;
  for (let t = 1; t <= maxT + 1; t++) { let d = 0; for (let i = 0; i < W; i++) { const e = x[i] - x[i + t]; d += e * e; } acc += d; cm[t] = acc ? (d * t) / acc : 1; }
  let tau = -1;
  for (let t = Math.max(2, minT); t <= maxT; t++) if (cm[t] < seuil) { while (t + 1 <= maxT && cm[t + 1] < cm[t]) t++; tau = t; break; }
  if (tau < 0) return null;
  const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1], den = a + c - 2 * b;
  return sr / (tau + (den ? (a - c) / (2 * den) : 0));
}
// ---------- MPM (McLeod Pitch Method) : NSDF, pics clés, k = 0.93 ----------
function mpm(x, sr, fmin = 60, fmax = 1100, k = 0.93) {
  const n = x.length, maxT = Math.min(Math.floor(sr / fmin), n - 1), nsdf = new Float32Array(maxT + 2);
  for (let t = 0; t <= maxT + 1; t++) { let r = 0, m = 0; for (let i = 0; i < n - t; i++) { r += x[i] * x[i + t]; m += x[i] * x[i] + x[i + t] * x[i + t]; } nsdf[t] = m ? (2 * r) / m : 0; }
  const pics = []; let t = 1;
  while (t < maxT && nsdf[t] > 0) t++;
  while (t < maxT) {
    while (t < maxT && nsdf[t] <= 0) t++;
    let best = t;
    while (t < maxT && nsdf[t] > 0) { if (nsdf[t] > nsdf[best]) best = t; t++; }
    if (best < maxT && nsdf[best] > 0) pics.push(best);
  }
  if (!pics.length) return null;
  const max = Math.max(...pics.map(p => nsdf[p])), seuil = k * max, minT = Math.floor(sr / fmax);
  const p = pics.find(q => q >= minT && nsdf[q] >= seuil); if (!p) return null;
  const a = nsdf[p - 1], b = nsdf[p], c = nsdf[p + 1], den = a + c - 2 * b;
  return sr / (p + (den ? (a - c) / (2 * den) : 0));
}

const dec = x => { const n = x.length >> 1, y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = (x[2 * i] + x[2 * i + 1]) / 2; return y; };
const V = {
  "YIN 8192 @24k (décimé)": x => yin(dec(x), SR / 2),
  "MPM 8192 @24k (décimé)": x => mpm(dec(x), SR / 2),
};
const CORDES = [82.407, 110, 146.832, 195.998, 246.942, 329.628];
for (const [nom, fn] of Object.entries(V)) {
  const brut = [], lisse = [], oct = [0], rate = [0]; let ms = 0, n = 0;
  for (const f0 of CORDES) for (const dc of [0, 2, -5, 12, -25]) for (const [fond, B] of [[1, 8e-5], [0.15, 8e-5], [0.05, 2e-4]]) for (const bruit of [0.003, 0.02]) for (const seed of [3]) {
    const f = f0 * 2 ** (dc / 1200), sig = additive(f, 2.2, { fond, B, bruit, seed }), hist = [];
    for (let t = 0.1; t + 8192 / SR < 2.2; t += 0.05) {
      const x = sig.subarray(Math.floor(t * SR), Math.floor(t * SR) + 8192);
      const t0 = process.hrtime.bigint(); const g = fn(x); ms += Number(process.hrtime.bigint() - t0) / 1e6; n++;
      if (!g) { rate[0]++; continue; }
      const e = cents(g, f); if (Math.abs(e) > 300) { oct[0]++; continue; }
      brut.push(Math.abs(e)); hist.push(e); if (hist.length > 5) hist.shift();
      if (hist.length === 5) lisse.push(Math.abs([...hist].sort((a, b) => a - b)[2]));
    }
  }
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))].toFixed(2); };
  console.log(nom.padEnd(24), `brut méd ${q(brut, .5)}¢ p95 ${q(brut, .95)}¢ | lissé méd ${q(lisse, .5)}¢ p95 ${q(lisse, .95)}¢ max ${q(lisse, 1)}¢ | octave ${oct[0]} ratés ${rate[0]}/${n} | ${(ms / n).toFixed(2)} ms`);
}
