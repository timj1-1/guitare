/* Jeux du manche : trouver les notes d'une corde, nommer une note, tous les X du manche, octaves, quiz.
   Avec indices, « Résoudre », et un mode écoute où le micro reconnaît la note jouée sur la guitare. */
(() => {
  "use strict";

  const FR = ["Do", "Do♯", "Ré", "Ré♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si"];
  const NATURALS = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];
  const PC = { Do: 0, "Ré": 2, Mi: 4, Fa: 5, Sol: 7, La: 9, Si: 11 };
  // Cordes numérotées comme en cours : 6 = Mi grave … 1 = Mi aigu
  const OPEN = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };
  // le nom affiché d'une note : Do Ré Mi, ou C D E si c'est le réglage (la voix et les phrases restent en Do Ré Mi)
  const EN_DE = { Do: "C", "Ré": "D", Mi: "E", Fa: "F", Sol: "G", La: "A", Si: "B" };
  const aff = n => (window.Reglages?.get("notation") === "en" ? String(n).replace(/^(Do|Ré|Mi|Fa|Sol|La|Si)(?=$|[♯♭#\s\dm(])/, x => EN_DE[x]) : n);
  const NOM_CORDE = { 6: "Mi grave", 5: "La", 4: "Ré", 3: "Sol", 2: "Si", 1: "Mi aigu" };
  const FRETS = 12;
  const pcOf = (s, f) => (OPEN[s] + f) % 12;
  const nameOf = (s, f) => FR[pcOf(s, f)];
  const isNatural = (s, f) => NATURALS.includes(nameOf(s, f));
  const corde = s => "la corde de " + NOM_CORDE[s];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };

  // ---------- Son : les mêmes guitares nylon que Mon manche (chargées par sons.js) ----------
  const unlock = () => window.Sons?.unlock();
  const loadSamples = () => window.Sons?.guitare.charge();
  function play(midi) {
    if (!soundOn || quiet) return;
    window.Sons?.guitare.note(midi);
  }
  let soundOn = true;
  try { soundOn = localStorage.getItem("maguitare:son") !== "0"; } catch {}
  // Les noms des cordes au bout du manche : affichés ou cachés (pour ne pas s'en servir comme antisèche)
  let nomsOn = true;
  try { nomsOn = localStorage.getItem("maguitare:nomsCordes") !== "0"; } catch {}
  const appliqueNoms = () => document.documentElement.classList.toggle("sans-noms", !nomsOn);
  appliqueNoms();
  function nomsBtn() {
    const b = el("button", { class: "icon-btn noms-btn", type: "button", title: "Noms des cordes sur le manche", "aria-label": "Noms des cordes sur le manche", "aria-pressed": String(nomsOn), text: aff("Mi") });
    b.addEventListener("click", () => {
      nomsOn = !nomsOn; appliqueNoms(); b.setAttribute("aria-pressed", String(nomsOn));
      try { localStorage.setItem("maguitare:nomsCordes", nomsOn ? "1" : "0"); } catch {}
    });
    return b;
  }

  // ---------- Le manche du jeu ----------
  // frets : nombre de cases (12 par défaut, jusqu'à 15 pour les gammes hautes)
  function Board(host, { vertical, frets: FRETS = 12 }) {
    const cells = new Map();
    const strings = [6, 5, 4, 3, 2, 1];
    const W = vertical ? 354 : 800, H = vertical ? 600 : 250;
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "jeu-board", role: "group", "aria-label": "Manche de guitare : flèches pour choisir une case, Entrée pour la jouer" });
    // géométrie
    const padA = vertical ? 30 : 34; // côté numéros de case
    const openSpan = vertical ? 46 : 54;
    // le bois (du sillet à la dernière case) est au centre : autant de marge des deux côtés en largeur
    const lenAvail = vertical ? H - padA - openSpan - 10 : W - 2 * (padA + openSpan);
    const fretLen = lenAvail / FRETS;
    const r = Math.min(15, fretLen * 0.36 + 2); // rayon des pastilles : plus petit quand il y a plus de cases
    const crossPad = vertical ? 38 : 24;
    const crossSpan = vertical ? W - 2 * crossPad : H - crossPad - 16;
    const gap = crossSpan / 6;
    const along = f => (f === 0 ? padA + openSpan / 2 : padA + openSpan + (f - 0.5) * fretLen); // centre d'une case
    const wire = f => padA + openSpan + f * fretLen; // position de la frette f (0 = sillet)
    // vertical : grave à gauche ; horizontal : aiguë en haut (comme une tablature)
    const cross = s => crossPad + gap * (vertical ? 6 - s : s - 1) + gap / 2;
    const P = (s, f) => (vertical ? [cross(s), along(f)] : [along(f), cross(s)]);
    const line = (a1, c1, a2, c2, attrs) => root.append(svg("line", vertical ? { x1: c1, y1: a1, x2: c2, y2: a2, ...attrs } : { x1: a1, y1: c1, x2: a2, y2: c2, ...attrs }));
    const rect = (a, c, la, lc, attrs) => root.append(svg("rect", vertical ? { x: c, y: a, width: lc, height: la, ...attrs } : { x: a, y: c, width: la, height: lc, ...attrs }));

    const c0 = cross(vertical ? 6 : 1) - gap / 2, c1 = cross(vertical ? 1 : 6) + gap / 2;
    rect(wire(0), c0, wire(FRETS) - wire(0), c1 - c0, { class: "jb-wood", rx: 4 });
    // repères
    [3, 5, 7, 9].forEach(f => { const [x, y] = vertical ? [(c0 + c1) / 2, along(f)] : [along(f), (c0 + c1) / 2]; root.append(svg("circle", { cx: x, cy: y, r: 7, class: "jb-inlay" })); });
    if (FRETS >= 15) { const [x, y] = vertical ? [(c0 + c1) / 2, along(15)] : [along(15), (c0 + c1) / 2]; root.append(svg("circle", { cx: x, cy: y, r: 7, class: "jb-inlay" })); }
    if (FRETS >= 12) [-1, 1].forEach(k => { const m = (c0 + c1) / 2 + k * gap * 1.5; const [x, y] = vertical ? [m, along(12)] : [along(12), m]; root.append(svg("circle", { cx: x, cy: y, r: 7, class: "jb-inlay" })); });
    for (let f = 0; f <= FRETS; f++) line(wire(f), c0, wire(f), c1, { class: f === 0 ? "jb-nut" : "jb-fret" });
    strings.forEach(s => line(padA + 6, cross(s), wire(FRETS), cross(s), { class: "jb-string", "stroke-width": 0.9 + (s - 1) * 0.42 }));
    // numéros de case et noms de cordes
    for (let f = 1; f <= FRETS; f++) {
      const [x, y] = vertical ? [crossPad / 2, along(f)] : [along(f), H - 9];
      root.append(Object.assign(svg("text", { x, y, class: "jb-num" + ([3, 5, 7, 9, 12, 15].includes(f) ? " strong" : ""), "text-anchor": "middle", "dominant-baseline": "central" }), { textContent: f }));
    }
    strings.forEach(s => {
      const [x, y] = vertical ? [cross(s), 12] : [padA / 2, cross(s)];
      root.append(Object.assign(svg("text", { x, y, class: "jb-sname", "text-anchor": "middle", "dominant-baseline": "central" }), { textContent: s === 1 ? (aff("Mi") === "E" ? "e" : "mi") : aff({ 6: "Mi", 5: "La", 4: "Ré", 3: "Sol", 2: "Si" }[s]) }));
    });
    // cases cliquables
    const layer = svg("g");
    root.append(layer);
    strings.forEach(s => {
      for (let f = 0; f <= FRETS; f++) {
        const [x, y] = P(s, f);
        // au clavier (Mac) : une seule case dans l'ordre de Tab, les flèches passent aux autres
        const nom = `Corde ${s}, ${f ? "case " + f : "à vide"}`;
        const g = svg("g", { class: "jb-cell", "data-s": s, "data-f": f, role: "button", tabindex: s === 6 && f === 1 ? 0 : -1, "aria-label": nom });
        const hw = vertical ? gap / 2 : fretLen / 2, hh = vertical ? fretLen / 2 : gap / 2;
        g.append(svg("rect", { x: x - (vertical ? hw : (f === 0 ? openSpan / 2 : hw)), y: y - (vertical ? (f === 0 ? openSpan / 2 : hh) : hh), width: vertical ? gap : (f === 0 ? openSpan : fretLen), height: vertical ? (f === 0 ? openSpan : fretLen) : gap, class: "jb-hit" }));
        const dot = svg("circle", { cx: x, cy: y, r, class: "jb-dot" });
        // le texte au centre exact de la pastille, quelle que soit la taille du texte
        const txt = Object.assign(svg("text", { x, y, "text-anchor": "middle", "dominant-baseline": "central", class: "jb-label" }), { textContent: "" });
        g.append(dot, txt);
        layer.append(g);
        cells.set(s + ":" + f, { g, txt, nom });
      }
    });
    host.replaceChildren(root);
    const clics = [];
    const vise = g => { if (!g || g.classList.contains("dimmed")) return; clics.forEach(fn => fn(+g.dataset.s, +g.dataset.f)); };
    root.addEventListener("click", e => vise(e.target.closest(".jb-cell")));
    root.addEventListener("keydown", e => {
      const g = e.target.closest?.(".jb-cell"); if (!g) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); return vise(g); }
      // le long de la corde : la case suivante ; en travers : la corde voisine (aiguë en haut, grave à gauche en vertical)
      let s = +g.dataset.s, f = +g.dataset.f;
      const pas = { ArrowRight: vertical ? [-1, 0] : [0, 1], ArrowLeft: vertical ? [1, 0] : [0, -1], ArrowDown: vertical ? [0, 1] : [1, 0], ArrowUp: vertical ? [0, -1] : [-1, 0] }[e.key];
      if (!pas) return;
      e.preventDefault();
      s = Math.min(6, Math.max(1, s + pas[0])); f = Math.min(FRETS, Math.max(0, f + pas[1]));
      const c = cells.get(s + ":" + f); if (!c) return;
      cells.forEach(x => x.g.setAttribute("tabindex", "-1"));
      c.g.setAttribute("tabindex", "0"); c.g.focus();
    });
    return {
      root,
      set(s, f, state, label = "") {
        const c = cells.get(s + ":" + f); if (!c) return;
        c.g.setAttribute("data-state", state || ""); c.txt.textContent = aff(label);
        c.g.setAttribute("aria-label", label ? `${c.nom} : ${aff(label)}` : c.nom);
      },
      clear() { cells.forEach(c => { c.g.setAttribute("data-state", ""); c.txt.textContent = ""; c.g.setAttribute("aria-label", c.nom); }); },
      clearState(st) { cells.forEach(c => { if (c.g.getAttribute("data-state") === st) { c.g.setAttribute("data-state", ""); c.txt.textContent = ""; c.g.setAttribute("aria-label", c.nom); } }); },
      // win : [première case, dernière case] ; les cases en dehors sont grisées
      dim(onlyStrings, win) {
        cells.forEach((c, k) => {
          const [s, f] = k.split(":").map(Number), off = (!!onlyStrings && !onlyStrings.includes(s)) || (!!win && (f < win[0] || f > win[1]));
          c.g.classList.toggle("dimmed", off); c.g.setAttribute("aria-disabled", String(off));
        });
      },
      onClick(fn) { clics.push(fn); },
    };
  }

  // ---------- Mode écoute : le micro reconnaît la note jouée sur la guitare ----------
  let mic = null;
  // Hauteur d'une note seule (méthode YIN), sur un signal sous-échantillonné par 2.
  function pitchOf(buf, sr) {
    const n = buf.length >> 1, x = new Float32Array(n);
    let rms = 0;
    for (let i = 0; i < n; i++) { const v = (buf[2 * i] + buf[2 * i + 1]) / 2; x[i] = v; rms += v * v; }
    rms = Math.sqrt(rms / n);
    if (rms < 0.008) return { rms };
    const r = sr / 2, minT = Math.floor(r / 1100), maxT = Math.min(Math.floor(r / 72), n >> 1), W = n - maxT - 2;
    const cm = new Float32Array(maxT + 2); cm[0] = 1;
    let acc = 0;
    for (let t = 1; t <= maxT + 1; t++) {
      let d = 0;
      for (let i = 0; i < W; i++) { const e = x[i] - x[i + t]; d += e * e; }
      acc += d; cm[t] = acc ? (d * t) / acc : 1;
    }
    let tau = -1;
    for (let t = Math.max(2, minT); t <= maxT; t++) {
      if (cm[t] < 0.14) { while (t + 1 <= maxT && cm[t + 1] < cm[t]) t++; tau = t; break; }
    }
    if (tau < 0) return { rms };
    const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1] || b, den = a + c - 2 * b;
    const f = r / (tau + (den ? (a - c) / (2 * den) : 0));
    const m = 69 + 12 * Math.log2(f / 440);
    return { rms, f, midi: Math.round(m), cents: (m - Math.round(m)) * 100 };
  }
  // Chrome pour Mac s'est figé en entier à l'ouverture du micro (2026-10-25) : coupé là, le temps de trouver la cause
  const chromeMac = /Macintosh/.test(navigator.userAgent) && /Chrome\//.test(navigator.userAgent) && !/Edg\//.test(navigator.userAgent);
  const session = type => { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch {} };
  // demandes de micro en cours : tant qu'il en reste une, on ne repasse pas en « playback » (sinon la nouvelle écoute est sourde)
  let attente = 0;
  async function startMic(onNote, onLevel, isCurrent) {
    if (chromeMac) throw new Error("chrome-mac");
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("micro");
    // Safari : le micro est interdit quand la page est en « lecture » (playback) : on passe en lecture et enregistrement
    session("play-and-record");
    attente++;
    // la demande la plus simple (celle qui marche sur Safari), puis sans les filtres de visioconférence si possible
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { attente--; if (!mic && !attente) session("playback"); throw e; }
    await stream.getAudioTracks()[0]?.applyConstraints({ echoCancellation: false, noiseSuppression: false, autoGainControl: false }).catch(() => {});
    attente--;
    if (!isCurrent()) { stream.getTracks().forEach(t => t.stop()); if (!mic && !attente) session("playback"); return false; }
    stopMic(true);
    const c = Sons.ctx(); if (c.state === "suspended") await c.resume();
    const src = c.createMediaStreamSource(stream), an = c.createAnalyser(), mute = c.createGain();
    an.fftSize = 4096; mute.gain.value = 0;
    src.connect(an); an.connect(mute); mute.connect(c.destination);
    const buf = new Float32Array(an.fftSize);
    let cand = null, count = 0, last = null, quiet = 0;
    const id = setInterval(() => {
      an.getFloatTimeDomainData(buf);
      const p = pitchOf(buf, c.sampleRate);
      onLevel?.(p.rms);
      if (window.Sons?.parle()) { cand = null; count = 0; return; }
      if (p.midi == null || Math.abs(p.cents) > 42 || p.midi < 38 || p.midi > 90) {
        if (++quiet >= 4) { last = null; cand = null; count = 0; }
        return;
      }
      quiet = 0;
      if (p.midi === cand) count++; else { cand = p.midi; count = 1; }
      // une note tenue 3 fois de suite (≈ 0,15 s) compte une seule fois, jusqu'au silence ou à une autre note
      if (count === 3 && p.midi !== last) { last = p.midi; onNote(p.midi); }
    }, 50);
    mic = { stream, src, an, mute, id };
    return true;
  }
  function stopMic(garde) {
    if (!mic) return;
    clearInterval(mic.id);
    try { mic.src.disconnect(); mic.an.disconnect(); mic.mute.disconnect(); } catch {}
    mic.stream.getTracks().forEach(t => t.stop());
    mic = null;
    if (!garde && !attente) session("playback");
  }
  let listenOn = false, quiet = false; // quiet : pas de son de guitare pendant que le micro écoute
  try { listenOn = localStorage.getItem("maguitare:ecoute") === "1"; } catch {}

  // ---------- Les jeux ----------
  const MODES = {
    trouve: { titre: "Trouve les notes", regle: "Touche toutes les cases de la note demandée, sur la corde indiquée (cases 1 à 12).", ecoute: "Joue sur ta guitare chaque case de la note demandée, sur la corde indiquée (cases 0 à 12). Le micro les place sur le manche." },
    nomme: { titre: "Quelle note ?", regle: "Une case s'allume : choisis son nom. Objectif : moins de 3 secondes.", ecoute: "Joue sur ta guitare la note demandée, sur la bonne corde. Objectif : moins de 3 secondes." },
    partout: { titre: "Partout sur le manche", regle: "Touche toutes les cases de la note demandée, sur les 6 cordes (cases 1 à 12).", ecoute: "Joue la note demandée sur chaque corde, de la plus grave à la plus aiguë (cases 0 à 12)." },
    octave: { titre: "Octaves", regle: "Une note est posée : touche son octave, deux cordes plus loin vers l'aigu. +2 cases depuis le Mi grave ou le La. +3 cases depuis le Ré ou le Sol (on passe la corde de Si).", ecoute: "Joue la note posée, puis son octave : deux cordes plus loin vers l'aigu, +2 cases (+3 depuis le Ré ou le Sol)." },
    quiz: { titre: "Quiz du manche", regle: "Une note au hasard : trouve-la sur chaque corde, le plus vite possible.", ecoute: "Une note au hasard : joue-la sur chaque corde, de la plus grave à la plus aiguë, le plus vite possible." },
  };

  // min = 1 : jamais la corde à vide (son nom est écrit au bout du manche) ; à l'écoute, elle compte
  const targetsOn = (s, n, min = 1) => { const t = []; for (let f = min; f <= FRETS; f++) if (pcOf(s, f) === PC[n]) t.push([s, f]); return t; };
  function makeRounds(cfg, listen) {
    const cordes = cfg.cordes?.length ? cfg.cordes : [6, 5, 4, 3, 2, 1];
    const R = [];
    if (cfg.mode === "trouve") {
      let last = "";
      for (let i = 0; i < 8; i++) {
        const s = pick(cordes);
        let n; do { n = pick(NATURALS); } while (n === last); last = n;
        R.push({ q: `${listen ? "Joue" : "Trouve"} tous les ${n} sur ${corde(s)}`, note: n, only: [s], targets: targetsOn(s, n, listen ? 0 : 1) });
      }
    } else if (cfg.mode === "nomme") {
      let lastKey = "";
      for (let i = 0; i < 10; i++) {
        let s, f; do { s = pick(cordes); f = 1 + Math.floor(Math.random() * FRETS); } while (!isNatural(s, f) || s + ":" + f === lastKey);
        lastKey = s + ":" + f;
        const n = nameOf(s, f);
        // à l'écoute, on fait l'inverse : le nom est donné, il faut trouver la case sur sa guitare
        if (listen) R.push({ q: `Joue un ${n} sur ${corde(s)}`, note: n, only: [s], targets: targetsOn(s, n, 0), anyOf: true });
        else R.push({ q: `Quelle est cette note, sur ${corde(s)} ?`, ask: [s, f], answer: n });
      }
    } else if (cfg.mode === "partout" || cfg.mode === "quiz") {
      const notes = cfg.mode === "partout" && cfg.note ? [cfg.note, ...shuffle(NATURALS.filter(n => n !== cfg.note)).slice(0, 2)] : shuffle(NATURALS).slice(0, 5);
      notes.forEach(n => {
        const targets = [6, 5, 4, 3, 2, 1].flatMap(s => targetsOn(s, n, listen ? 0 : 1));
        R.push({ q: `${listen ? "Joue" : "Trouve"} tous les ${n} du manche`, note: n, targets, seq: listen });
      });
    } else if (cfg.mode === "octave") {
      const from = cordes.filter(s => s >= 3);
      let lastKey = "";
      for (let i = 0; i < 8; i++) {
        let s, f; do { s = pick(from.length ? from : [6, 5]); f = 1 + Math.floor(Math.random() * 9); } while (!isNatural(s, f) || s + ":" + f === lastKey);
        lastKey = s + ":" + f;
        // +3 cases quand on arrive sur la corde de Si ou au-delà (depuis le Ré ou le Sol), sinon +2
        const t = s - 2, tf = f + (s <= 4 ? 3 : 2);
        R.push({ q: `${listen ? "Joue" : "Trouve"} l'octave de ce ${nameOf(s, f)}`, src: [s, f], note: nameOf(s, f), targets: [[t, tf]] });
      }
    }
    return R;
  }

  // ---------- La feuille du jeu ----------
  let sheet = null;
  function ensureSheet() {
    if (sheet) return sheet;
    sheet = el("dialog", { class: "sheet jeu-sheet", "aria-labelledby": "jeuTitre" });
    document.body.append(sheet);
    sheet.addEventListener("cancel", () => stopRun());
    sheet.addEventListener("close", () => stopRun());
    return sheet;
  }
  let run = null;
  const stopRun = () => { stopMic(); quiet = false; window.Sons?.tais(); if (run) { clearTimeout(run.timer); run = null; } };
  const say = t => window.Sons?.dire(t);
  const ICON_MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function open(cfg, onDone) {
    const d = ensureSheet();
    stopRun();
    unlock(); loadSamples();
    const listen = listenOn;
    quiet = listen;
    const info = MODES[cfg.mode];
    const vertical = window.matchMedia("(max-width: 700px)").matches;
    const close = el("button", { class: "icon-btn", type: "button", "aria-label": "Fermer", text: "✕", onclick: () => d.close() });
    const sound = el("button", { class: "icon-btn", type: "button", "aria-pressed": String(soundOn), title: "Son de la guitare", text: soundOn ? "🔊" : "🔈" });
    sound.addEventListener("click", () => { soundOn = !soundOn; sound.textContent = soundOn ? "🔊" : "🔈"; sound.setAttribute("aria-pressed", String(soundOn)); try { localStorage.setItem("maguitare:son", soundOn ? "1" : "0"); } catch {} });
    const voixBtn = window.Sons ? el("button", { class: "icon-btn", type: "button", "aria-pressed": String(Sons.voix), title: "Voix : lit les questions", text: Sons.voix ? "🗣️" : "🤐" }) : null;
    voixBtn?.addEventListener("click", () => { Sons.voix = !Sons.voix; voixBtn.textContent = Sons.voix ? "🗣️" : "🤐"; voixBtn.setAttribute("aria-pressed", String(Sons.voix)); if (Sons.voix) say(q.textContent); });
    const prog = el("span", { class: "jeu-prog" });
    const q = el("p", { class: "jeu-q" });
    const fb = el("p", { class: "jeu-fb", role: "status" });
    const hintBtn = el("button", { class: "btn small", type: "button", text: "💡 Indice" });
    const solveBtn = el("button", { class: "btn small", type: "button", text: "Résoudre" });
    const retryBtn = el("button", { class: "btn small", type: "button", text: "Rejouer ce tour", hidden: true, title: "Rejouer ce tour (il compte comme aidé)" });
    const nextBtn = el("button", { class: "btn small primary", type: "button", text: "Suivant →", hidden: true });
    const listenBtn = el("button", { class: "btn small listen-btn", type: "button", "aria-pressed": String(listen), title: "Jouer les notes sur ta guitare : le micro les reconnaît" });
    listenBtn.innerHTML = ICON_MIC; listenBtn.append(listen ? "Écoute : oui" : "Mode écoute");
    const restartBtn = el("button", { class: "btn small", type: "button", text: "↺ Recommencer", title: "Recommencer du début", onclick: () => open(cfg, onDone) });
    const aide = aideBtn(v => [schemaNotes(cfg.mode === "partout" || cfg.mode === "quiz" ? [6, 5, 4, 3, 2, 1] : (cfg.cordes?.length ? cfg.cordes : [6, 5, 4, 3, 2, 1]), v),
      cfg.mode === "octave" ? schemaOctaves(v) : null].filter(Boolean), () => {
      if (!run || run.locked) return "";
      if (!run.roundHelp) { run.roundHelp = true; run.hints++; majProg(); }
      return "Pour ce tour, regarder les schémas compte comme une aide.";
    });
    const actions = el("div", { class: "jeu-actions" }, hintBtn, solveBtn, retryBtn, nextBtn, aide, restartBtn, listenBtn);
    const level = el("i");
    const heardTxt = el("span", { text: "Je prépare le micro…" });
    const listenBar = el("div", { class: "jeu-listen", hidden: !listen }, el("span", { class: "jl-level", "aria-hidden": "true" }, level), heardTxt);
    const boardHost = el("div", { class: "jeu-board-wrap" + (vertical ? " vertical" : "") });
    const answers = el("div", { class: "jeu-answers", hidden: true });
    const body = cadre({ eyebrow: (cfg.label && cfg.label !== info.titre) ? info.titre + (listen ? " · écoute" : "") : null, titre: cfg.label || info.titre, idTitre: "jeuTitre",
      gauche: [nomsBtn(), voixBtn], droite: [sound, close], regle: listen ? info.ecoute : info.regle, q, prog, fb, boardHost, answers, actions, autres: [listenBar] });
    d.replaceChildren(body);
    if (!d.open) d.showModal();

    const board = Board(boardHost, { vertical });
    const rounds = makeRounds(cfg, listen);
    run = { res: [], i: 0, errors: 0, perfect: 0, roundErr: 0, found: new Set(), t0: 0, times: [], correct: 0, timer: null, locked: false, hints: 0, solved: 0, hintLevel: 0, wrongSeen: new Set() };
    const R = () => rounds[run?.i];
    const key = (s, f) => s + ":" + f;
    const left = r => r.targets.filter(([s, f]) => !run.found.has(key(s, f)));
    // à l'écoute, « partout » et « quiz » se jouent corde par corde, du Mi grave au Mi aigu
    const curString = r => (left(r)[0] || [])[0];
    const setFb = (text, cls = "", speak = true) => { fb.textContent = text; fb.className = "jeu-fb" + (cls ? " " + cls : ""); if (speak) say(text); majProg(); };
    // un point par tour : vert sans faute ni aide, rouge dès la première erreur
    const me = run;
    function majProg() {
      if (run !== me || run.fini) return;
      const res = run.res.slice();
      if (res[run.i] == null && (run.roundErr || run.roundHelp)) res[run.i] = false;
      points(prog, rounds.length, res, run.i);
    }

    // retry : le même tour, rejoué après « Résoudre » (il reste compté comme aidé)
    function showRound(retry = false) {
      const r = R();
      board.clear(); run.found = new Set(); run.roundErr = 0; run.hintLevel = 0; run.roundHelp = retry; run.locked = false; run.wrongSeen = new Set();
      fb.textContent = ""; fb.className = "jeu-fb";
      if (!retry) delete run.res[run.i];
      majProg();
      hintBtn.hidden = solveBtn.hidden = false; nextBtn.hidden = retryBtn.hidden = true; hintBtn.disabled = false;
      q.textContent = r.seq ? `${r.q} : commence par ${corde(curString(r))}` : r.q;
      board.dim(r.only || (r.ask ? [r.ask[0]] : r.seq ? [curString(r)] : null));
      answers.hidden = !r.ask;
      if (r.ask) {
        board.set(r.ask[0], r.ask[1], "ask", "?");
        grille(answers, NATURALS.map(n => el("button", { type: "button", class: "btn", "data-v": n, text: aff(n), onclick: () => answer(n) })));
      }
      if (r.src) { board.set(r.src[0], r.src[1], "src", r.note); play(OPEN[r.src[0]] + r.src[1]); }
      say(q.textContent);
      run.t0 = performance.now();
    }

    function next() {
      clearTimeout(run.timer);
      run.i++;
      if (run.i >= rounds.length) return finish();
      showRound();
    }
    nextBtn.addEventListener("click", () => run && next());
    retryBtn.addEventListener("click", () => { if (run) { clearTimeout(run.timer); showRound(true); } });

    function answer(n) {
      if (run.locked) return;
      const r = R(), [s, f] = r.ask, ms = performance.now() - run.t0;
      run.locked = true;
      play(OPEN[s] + f);
      answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.dataset.v === r.answer) b.classList.add("good"); else if (b.dataset.v === n) b.classList.add("bad"); });
      run.res[run.i] = n === r.answer && !run.roundHelp;
      if (n === r.answer) {
        run.correct++; if (!run.roundHelp) run.perfect++; run.times.push(ms); board.set(s, f, "ok", r.answer);
        setFb(ms < 3000 ? `Oui, ${r.answer} ! (${(ms / 1000).toFixed(1).replace(".", ",")} s)` : `Oui, ${r.answer}. ${(ms / 1000).toFixed(1).replace(".", ",")} s : vise moins de 3 s.`, "good", false);
        say(`Oui, ${r.answer} !`);
      } else {
        run.errors++; board.set(s, f, "bad", r.answer);
        setFb(`Non, c'est un ${r.answer} (case ${f}).`, "bad", false);
        say(`Non, c'est un ${r.answer}.`);
      }
      hintBtn.hidden = solveBtn.hidden = true;
      run.timer = setTimeout(next, n === r.answer ? 900 : 1900);
    }

    // une bonne case (touchée ou entendue)
    function hit(s, f) {
      const r = R();
      run.found.add(key(s, f)); board.set(s, f, "ok", nameOf(s, f)); play(OPEN[s] + f);
      run.times.push(performance.now() - run.t0); run.t0 = performance.now();
      const reste = r.anyOf ? 0 : left(r).length;
      if (reste > 0) {
        if (r.seq && curString(r) !== s) {
          const ns = curString(r);
          board.dim([ns]);
          q.textContent = `${r.q} : maintenant ${corde(ns)}`;
          setFb(`Oui ! Corde suivante : ${corde(ns)}.`, "good");
        } else setFb(`Oui ! Encore ${reste}.`, "good");
        return;
      }
      if (!run.roundErr && !run.roundHelp) run.perfect++;
      run.correct++; run.res[run.i] = !run.roundErr && !run.roundHelp;
      setFb(run.roundHelp ? "Trouvé !" : run.roundErr ? "Trouvé !" : "Parfait, sans erreur !", "good");
      if (r.src) board.set(r.src[0], r.src[1], "src", r.note);
      hintBtn.hidden = solveBtn.hidden = true;
      run.locked = true; run.timer = setTimeout(next, 1100);
    }
    function miss(text) {
      run.errors++; run.roundErr++;
      setFb(text, "bad");
    }

    board.onClick((s, f) => {
      const r = R(); if (!r || run.locked || r.ask) return;
      if (r.src && s === r.src[0] && f === r.src[1]) return;
      if (run.found.has(key(s, f))) return;
      if (r.targets.some(([ts, tf]) => ts === s && tf === f)) return hit(s, f);
      const nm = nameOf(s, f);
      if (f === 0 && nm === r.note && !r.src) return setFb(`Oui, c'est un ${nm}, mais à vide : cherche-le sur les cases.`, "hint", false);
      board.set(s, f, "bad", nm.replace("♯", "#"));
      play(OPEN[s] + f);
      miss(r.src && nm === r.note ? `C'est bien un ${nm}, mais pas l'octave deux cordes plus loin vers l'aigu.` : `Ça, c'est un ${nm}.`);
      setTimeout(() => { if (run && !run.found.has(key(s, f))) board.set(s, f, "", ""); }, 900);
    });

    // une note entendue au micro
    function heard(m) {
      const r = R(); if (!r || run.locked) return;
      const nm = FR[m % 12];
      heardTxt.textContent = `J'entends : ${nm}`;
      const strings = r.seq ? [curString(r)] : r.only || [...new Set(r.targets.map(t => t[0]))];
      for (const s of strings) {
        const f = m - OPEN[s];
        if (f >= 0 && f <= FRETS && r.targets.some(([ts, tf]) => ts === s && tf === f) && !run.found.has(key(s, f))) return hit(s, f);
      }
      if (r.src && m === OPEN[r.src[0]] + r.src[1]) return setFb(`C'est la note de départ. Joue maintenant son octave, sur ${corde(r.targets[0][0])}.`);
      if (strings.some(s => run.found.has(key(s, m - OPEN[s])))) return setFb("Celle-là, tu l'as déjà trouvée.", "", false);
      if (nm === r.note) return setFb(r.src ? `C'est bien un ${nm}, mais pas la bonne octave.` : `C'est bien un ${nm}, mais pas sur ${corde(strings[0])}.`);
      if (run.wrongSeen.has(m)) return;
      run.wrongSeen.add(m);
      miss(`J'entends un ${nm}, pas un ${r.note}.`);
    }

    // Indice : d'abord la corde, puis entre quelles cases
    hintBtn.addEventListener("click", () => {
      const r = R(); if (!r || run.locked) return;
      run.hints++; run.roundHelp = true;
      const lvl = run.hintLevel++;
      if (r.ask) {
        const [s, f] = r.ask;
        if (lvl === 0) setFb(`Repère : à vide, ${corde(s)} donne un ${NOM_CORDE[s].replace(" grave", "").replace(" aigu", "")}. Cette case est la case ${f}.`, "hint");
        else {
          const keep = new Set([r.answer, ...shuffle(NATURALS.filter(n => n !== r.answer)).slice(0, 2)]);
          answers.querySelectorAll("button").forEach(b => { if (!keep.has(b.dataset.v)) b.disabled = true; });
          setFb("Il ne reste que trois choix.", "hint"); hintBtn.disabled = true;
        }
        return;
      }
      const rest = left(r); if (!rest.length) return;
      const [s, f] = r.seq ? rest.find(t => t[0] === curString(r)) : rest[0];
      const singleString = r.only || r.seq;
      if (lvl === 0 && !singleString) {
        for (let k = 0; k <= FRETS; k++) if (!run.found.has(key(s, k)) && !(r.src && r.src[0] === s && r.src[1] === k)) board.set(s, k, "hint", "");
        setFb(`Indice : cherche sur ${corde(s)}.`, "hint");
        return;
      }
      board.clearState("hint");
      const a = Math.max(0, f - 1), b = Math.min(FRETS, f + 1);
      for (let k = a; k <= b; k++) if (!run.found.has(key(s, k))) board.set(s, k, "hint", "");
      setFb(f === 0 ? `Indice : sur ${corde(s)}, tout près du sillet : case 0 ou 1.` : `Indice : sur ${corde(s)}, entre la case ${a} et la case ${b}.`, "hint");
    });

    // Résoudre : montre la réponse ; le tour ne compte pas comme réussi
    solveBtn.addEventListener("click", () => {
      const r = R(); if (!r || run.locked) return;
      run.solved++; run.locked = true; run.roundHelp = true; clearTimeout(run.timer); run.res[run.i] = false;
      if (r.ask) {
        const [s, f] = r.ask;
        board.set(s, f, "sol", r.answer); play(OPEN[s] + f);
        answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.dataset.v === r.answer) b.classList.add("good"); });
        setFb(`C'était un ${r.answer}, case ${f} de ${corde(s).replace("la corde de ", "la corde ")}.`, "hint");
      } else {
        board.dim(null);
        const shown = r.anyOf ? r.targets.slice(0, 1) : left(r);
        shown.forEach(([s, f]) => board.set(s, f, "sol", nameOf(s, f)));
        setFb(r.anyOf || shown.length === 1 ? `Voilà : case ${shown[0][1]} sur ${corde(shown[0][0])}.` : `Voilà les ${shown.length} qui restaient. Regarde-les bien.`, "hint");
      }
      hintBtn.hidden = solveBtn.hidden = true; nextBtn.hidden = retryBtn.hidden = false;
      retryBtn.focus({ preventScroll: true });
    });

    listenBtn.addEventListener("click", () => {
      listenOn = !listenOn;
      try { localStorage.setItem("maguitare:ecoute", listenOn ? "1" : "0"); } catch {}
      open(cfg, onDone);
    });

    function finish() {
      stopMic(); listenBar.hidden = true;
      const avg = run.times.length ? run.times.reduce((a, b) => a + b, 0) / run.times.length : 0;
      const isAsk = cfg.mode === "nomme" && !listen;
      const score = isAsk ? run.correct : run.perfect;
      const res = { mode: cfg.mode, label: cfg.label || info.titre, score, total: rounds.length, errors: run.errors, ms: Math.round(avg), date: new Date().toISOString(), hints: run.hints, solved: run.solved, ecoute: listen || undefined, ask: isAsk || undefined };
      const pct = score / rounds.length;
      const bravo = pct === 1 ? "Parfait !" : pct >= 0.8 ? "Très bien !" : pct >= 0.5 ? "C'est en train de rentrer." : "On continue, ça va venir.";
      answers.hidden = true; board.dim(null); actions.hidden = true;
      q.textContent = bravo; majProg(); run.fini = true;
      fb.className = "jeu-fb";
      fb.textContent = (isAsk ? `${score} bonnes réponses sur ${rounds.length}` : `${score} tours sur ${rounds.length} sans aide ni erreur, ${run.errors} erreur${run.errors > 1 ? "s" : ""}`)
        + (run.hints ? `, ${run.hints} indice${run.hints > 1 ? "s" : ""}` : "") + (run.solved ? `, ${run.solved} résolu${run.solved > 1 ? "s" : ""}` : "")
        + (avg ? ` · ${(avg / 1000).toFixed(1).replace(".", ",")} s par note` : "") + ".";
      say(`${bravo} ${score} ${isAsk ? "bonnes réponses" : "tours"} sur ${rounds.length}${isAsk ? "" : " sans faute"}.`);
      window.Sons?.[pct >= 0.8 ? "bloc" : "cling"]?.();
      boardHost.append(el("div", { class: "jeu-end" },
        el("button", { class: "btn primary big", type: "button", text: "Rejouer", onclick: () => open(cfg, onDone) }),
        el("button", { class: "btn big", type: "button", text: "Terminé", onclick: () => d.close() })));
      try { onDone?.(res); } catch {}
    }

    showRound();
    if (listen) {
      const me = run;
      startMic(m => { if (run === me) heard(m); }, rms => { level.style.width = Math.min(100, Math.round(Math.sqrt(rms) * 260)) + "%"; }, () => run === me)
        .then(ok => { if (ok) heardTxt.textContent = "J'écoute… joue la note sur ta guitare."; })
        .catch(e => { if (run !== me) return; heardTxt.textContent = e?.message === "chrome-mac" ? "Sur Chrome pour Mac, l'écoute du micro est coupée pour l'instant : elle a figé Chrome. Utilise Safari pour écouter ta guitare. Ou touche les cases à la place." : "Le micro est refusé. Autorise-le dans les réglages de Safari (aA › Réglages du site web › Micro), ou touche les cases à la place."; listenBar.classList.add("off"); });
    }
  }

  const resume = r => `${r.label}${r.ecoute ? " (à l'écoute)" : ""} : ${r.ask || (r.mode === "nomme" && !r.ecoute) ? `${r.score}/${r.total} justes` : `${r.score}/${r.total} tours sans faute, ${r.errors} erreur${r.errors > 1 ? "s" : ""}`}`
    + (r.hints ? `, ${r.hints} indice${r.hints > 1 ? "s" : ""}` : "") + (r.solved ? `, ${r.solved} résolu${r.solved > 1 ? "s" : ""}` : "")
    + `${r.ms ? `, ${(r.ms / 1000).toFixed(1).replace(".", ",")} s par note` : ""}`;
  // ---------- La mise en page commune des jeux ----------
  // En haut, les outils de part et d'autre du titre centré ; puis la question, le manche (toute la place qui reste),
  // les réponses et les boutons : tout tient dans l'écran, sans défiler.
  function cadre({ eyebrow, titre, idTitre, gauche = [], droite = [], regle, q, prog, fb, boardHost, answers, actions, autres = [] }) {
    return el("div", { class: "sheet-in jeu-in" },
      el("div", { class: "jeu-top" },
        el("div", { class: "jeu-tools" }, ...gauche),
        el("div", { class: "jeu-titre" }, eyebrow ? el("span", { class: "eyebrow", text: eyebrow }) : null, el("h2", { id: idTitre, text: titre })),
        el("div", { class: "jeu-tools" }, ...droite)),
      el("div", { class: "jeu-bar" }, prog, q),
      regle ? el("p", { class: "jeu-regle", text: regle }) : null,
      ...autres.slice(0, 1), fb, ...autres.slice(1), boardHost, answers, actions);
  }
  // Les réponses en rectangle plein : des rangées égales quand c'est possible ;
  // sinon les boutons de la dernière rangée s'élargissent, sans laisser de trou.
  function grille(answers, boutons) {
    const n = boutons.length, etroit = window.matchMedia("(max-width: 520px)").matches;
    const lg = Math.max(0, ...boutons.map(b => (b.firstChild?.textContent || b.textContent).length));
    const max = etroit ? (lg <= 3 ? 7 : lg <= 6 ? 4 : 3) : (lg <= 6 ? 7 : 4);
    let rangs = Math.ceil(n / max);
    if (n % rangs && (n % (rangs + 1) === 0)) rangs++; // une rangée de plus, mais toutes égales
    const parRang = Array.from({ length: rangs }, (_, i) => Math.floor(n / rangs) + (i < n % rangs ? 1 : 0));
    let k = 0;
    answers.replaceChildren(...parRang.map(m => el("div", { class: "jeu-rang" }, ...boutons.slice(k, (k += m)))));
  }

  // La progression : « 3 / 10 », puis un point par question (vert du premier coup, rouge raté ou aidé)
  function points(prog, total, res, i) {
    prog.replaceChildren(el("span", { class: "jp-n", text: `${Math.min(i + 1, total)} / ${total}` }),
      el("span", { class: "jeu-points", "aria-hidden": "true" }, Array.from({ length: total }, (_, k) =>
        el("i", { class: res[k] === true ? "ok" : res[k] === false ? "ko" : k === i ? "cur" : "" }))));
    const ko = res.filter(x => x === false).length;
    prog.setAttribute("aria-label", `Question ${Math.min(i + 1, total)} sur ${total}` + (ko ? `, ${ko} ratée${ko > 1 ? "s" : ""}` : ""));
  }

  // ---------- Les schémas d'aide : un petit manche, dans le même sens que celui du jeu ----------
  // cases : [corde (1 = Mi aigu … 6 = Mi grave), case, "note" | "root" | "mute", étiquette]
  function schema({ titre, sous, cases, f0 = 0, f1 = 12, vertical = false }) {
    const d0 = Math.max(1, f0), n = f1 - d0 + 1, ouv = f0 === 0, pas = n > 8 ? 26 : 32, ec = 22;
    const long = 22 + (ouv ? 18 : 6) + n * pas + 8, large = 18 + 5 * ec + 30;
    const W = vertical ? large : long, H = vertical ? long : large;
    // a : le long du manche (cases) ; c : en travers (cordes, le Mi grave à gauche en vertical, en bas en horizontal)
    const a0 = 22 + (ouv ? 18 : 6);
    const A = f => (f === 0 ? a0 - 11 : a0 + (f - d0 + 0.5) * pas), C = s => (vertical ? 22 + (6 - s) * ec : 14 + (s - 1) * ec);
    const P = (a, c) => (vertical ? [c, a] : [a, c]);
    const ligne = (a1, c1, a2, c2, cls) => { const [x1, y1] = P(a1, c1), [x2, y2] = P(a2, c2); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`; };
    let svg = "";
    for (let k = 0; k <= n; k++) svg += ligne(a0 + k * pas, C(vertical ? 6 : 1), a0 + k * pas, C(vertical ? 1 : 6), !k && ouv ? "sc-sillet" : "sc-frette");
    for (let s = 1; s <= 6; s++) svg += ligne(a0, C(s), a0 + n * pas, C(s), "sc-corde");
    const txt = (a, c, t, cls) => { const [x, y] = P(a, c); return `<text x="${x}" y="${y}" class="${cls}">${t}</text>`; };
    for (let f = d0; f <= f1; f++) if (n <= 6 || [3, 5, 7, 9, 12].includes(f)) svg += txt(A(f), vertical ? 9 : H - 9, f, "sc-num");
    for (let s = 1; s <= 6; s++) svg += txt(vertical ? 9 : 10, C(s), aff(NOM_CORDE[s].split(" ")[0]).slice(0, 3), "sc-corde-nom");
    for (const [s, f, cls, lab] of cases) {
      const [x, y] = P(A(f), C(s));
      if (cls === "mute") { svg += `<text x="${x}" y="${y}" class="sc-mute">×</text>`; continue; }
      svg += `<circle cx="${x}" cy="${y}" r="9.5" class="sc-${cls}"/>` + (lab ? `<text x="${x}" y="${y}" class="sc-lab">${aff(lab).replace("♯", "#").replace("♭", "b")}</text>` : "");
    }
    const fig = el("figure", { class: "jeu-schema" }, el("figcaption", {}, el("strong", { text: titre }), sous ? el("span", { text: sous }) : null));
    const art = el("div", { class: "js-art" }); art.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${titre}">${svg}</svg>`;
    fig.append(art);
    return fig;
  }
  // Le bouton « Schémas » : ouvre par-dessus le jeu les schémas qui aident (figures() est appelé à l'ouverture)
  function aideBtn(figures, onOpen) {
    const b = el("button", { class: "btn small", type: "button", text: "📖 Schémas" });
    b.addEventListener("click", () => {
      const host = b.closest(".jeu-in"); if (!host || host.querySelector(".jeu-aide")) return;
      const avertir = onOpen?.();
      const fermer = () => { pane.remove(); b.focus({ preventScroll: true }); };
      const vertical = window.matchMedia("(max-width: 700px)").matches;
      const pane = el("div", { class: "jeu-aide", role: "dialog", "aria-label": "Schémas" },
        el("div", { class: "ja-tete" }, el("strong", { text: "Schémas" }), el("button", { class: "icon-btn", type: "button", "aria-label": "Fermer les schémas", text: "✕", onclick: fermer })),
        avertir ? el("p", { class: "ja-note", text: avertir }) : null,
        el("div", { class: "ja-liste" }, figures(vertical)));
      // Échap ferme les schémas, pas le jeu
      pane.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fermer(); } });
      host.append(pane); pane.querySelector(".icon-btn").focus({ preventScroll: true });
    });
    return b;
  }
  // les notes naturelles sur des cordes, cases 0 à 12
  const schemaNotes = (cordes, vertical, sous) => schema({ titre: "Les notes naturelles", vertical,
    sous: sous || "Mi-Fa et Si-Do : une seule case d'écart. Entre les autres notes : 2 cases.",
    cases: cordes.flatMap(s => Array.from({ length: 13 }, (_, f) => f).filter(f => isNatural(s, f)).map(f => [s, f, "note", nameOf(s, f)])) });
  const schemaOctaves = vertical => schema({ titre: "Les octaves", vertical, f0: 1, f1: 8,
    sous: "Deux cordes plus loin vers l'aigu : +2 cases depuis le Mi grave ou le La, +3 depuis le Ré ou le Sol.",
    cases: [[6, 3, "root", "Sol"], [4, 5, "root", "Sol"], [5, 2, "note", "Si"], [3, 4, "note", "Si"], [4, 2, "root", "Mi"], [2, 5, "root", "Mi"], [3, 2, "note", "La"], [1, 5, "note", "La"]] });

  window.Jeux = { open, resume, MODES, NOM_CORDE, ecouteEnCours: () => !!mic,
    // pour les jeux à niveaux (niveaux.js)
    base: { Board, cadre, grille, points, schema, aideBtn, schemaNotes, schemaOctaves, el, aff, FR, NATURALS, PC, OPEN, NOM_CORDE, pcOf, nameOf, shuffle, pick, play, nomsBtn, son: { get: () => soundOn, set: v => { soundOn = !!v; try { localStorage.setItem("maguitare:son", soundOn ? "1" : "0"); } catch {} } } } };
})();
