/* Jeux du manche : trouver les notes d'une corde, nommer une note, tous les X du manche, octaves, quiz.
   Avec indices, « Résoudre », et un mode écoute où le micro reconnaît la note jouée sur la guitare. */
(() => {
  "use strict";

  const FR = ["Do", "Do♯", "Ré", "Ré♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si"];
  const NATURALS = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];
  const PC = { Do: 0, "Ré": 2, Mi: 4, Fa: 5, Sol: 7, La: 9, Si: 11 };
  // Cordes numérotées comme en cours : 6 = Mi grave … 1 = Mi aigu
  const OPEN = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };
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

  // ---------- Son : les mêmes guitares nylon que Mon manche ----------
  let ctx = null, buffers = null, loading = null;
  const getCtx = () => (window.Sons ? Sons.ctx() : (ctx ||= new (window.AudioContext || window.webkitAudioContext)()));
  function loadSamples() {
    if (loading) return loading;
    loading = new Promise(res => {
      const go = async () => {
        const src = window.NYLON_SAMPLES || {}, c = getCtx(), out = [];
        await Promise.all(Object.entries(src).map(async ([m, b64]) => {
          try {
            const bin = atob(b64), buf = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            const decoded = await new Promise((ok, ko) => { const p = c.decodeAudioData(buf.buffer, ok, ko); if (p?.then) p.then(ok, ko); });
            out.push({ m: +m, buf: decoded });
          } catch {}
        }));
        buffers = out.sort((a, b) => a.m - b.m); res();
      };
      if (window.NYLON_SAMPLES) go();
      else { const s = document.createElement("script"); s.src = "samples-nylon.js"; s.onload = go; s.onerror = () => { buffers = []; res(); }; document.head.append(s); }
    });
    return loading;
  }
  function unlock() {
    if (window.Sons) return Sons.unlock();
    const c = getCtx(); if (c.state === "suspended") c.resume();
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  }
  function play(midi) {
    if (!soundOn || quiet || !buffers?.length) return;
    const c = getCtx();
    const near = buffers.reduce((a, b) => (Math.abs(b.m - midi) < Math.abs(a.m - midi) ? b : a));
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = near.buf; s.playbackRate.value = Math.pow(2, (midi - near.m) / 12);
    g.gain.value = 0.9; s.connect(g).connect(c.destination); s.start();
    g.gain.setTargetAtTime(0, c.currentTime + 1.4, 0.25); s.stop(c.currentTime + 2.6);
  }
  let soundOn = true;
  try { soundOn = localStorage.getItem("maguitare:son") !== "0"; } catch {}

  // ---------- Le manche du jeu ----------
  function Board(host, { vertical }) {
    const cells = new Map();
    const strings = [6, 5, 4, 3, 2, 1];
    const W = vertical ? 330 : 760, H = vertical ? 600 : 250;
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "jeu-board", role: "img", "aria-label": "Manche de guitare" });
    // géométrie
    const padA = vertical ? 30 : 34; // côté numéros de case
    const openSpan = vertical ? 46 : 54;
    const lenAvail = (vertical ? H : W) - padA - openSpan - 10;
    const fretLen = lenAvail / FRETS;
    const crossPad = vertical ? 38 : 24;
    const crossSpan = (vertical ? W : H) - crossPad - 16;
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
    [-1, 1].forEach(k => { const m = (c0 + c1) / 2 + k * gap * 1.5; const [x, y] = vertical ? [m, along(12)] : [along(12), m]; root.append(svg("circle", { cx: x, cy: y, r: 7, class: "jb-inlay" })); });
    for (let f = 0; f <= FRETS; f++) line(wire(f), c0, wire(f), c1, { class: f === 0 ? "jb-nut" : "jb-fret" });
    strings.forEach(s => line(padA + 6, cross(s), wire(FRETS), cross(s), { class: "jb-string", "stroke-width": 0.9 + (s - 1) * 0.42 }));
    // numéros de case et noms de cordes
    for (let f = 1; f <= FRETS; f++) {
      const [x, y] = vertical ? [14, along(f) + 5] : [along(f), H - 6];
      root.append(Object.assign(svg("text", { x, y, class: "jb-num" + ([3, 5, 7, 9, 12].includes(f) ? " strong" : ""), "text-anchor": "middle" }), { textContent: f }));
    }
    strings.forEach(s => {
      const [x, y] = vertical ? [cross(s), 14] : [14, cross(s) + 5];
      root.append(Object.assign(svg("text", { x, y, class: "jb-sname", "text-anchor": "middle" }), { textContent: { 6: "Mi", 5: "La", 4: "Ré", 3: "Sol", 2: "Si", 1: "mi" }[s] }));
    });
    // cases cliquables
    const layer = svg("g");
    root.append(layer);
    strings.forEach(s => {
      for (let f = 0; f <= FRETS; f++) {
        const [x, y] = P(s, f);
        const g = svg("g", { class: "jb-cell", "data-s": s, "data-f": f });
        const hw = vertical ? gap / 2 : fretLen / 2, hh = vertical ? fretLen / 2 : gap / 2;
        g.append(svg("rect", { x: x - (vertical ? hw : (f === 0 ? openSpan / 2 : hw)), y: y - (vertical ? (f === 0 ? openSpan / 2 : hh) : hh), width: vertical ? gap : (f === 0 ? openSpan : fretLen), height: vertical ? (f === 0 ? openSpan : fretLen) : gap, class: "jb-hit" }));
        const dot = svg("circle", { cx: x, cy: y, r: 15, class: "jb-dot" });
        const txt = Object.assign(svg("text", { x, y: y + 5, "text-anchor": "middle", class: "jb-label" }), { textContent: "" });
        g.append(dot, txt);
        layer.append(g);
        cells.set(s + ":" + f, { g, txt });
      }
    });
    host.replaceChildren(root);
    return {
      root,
      set(s, f, state, label = "") {
        const c = cells.get(s + ":" + f); if (!c) return;
        c.g.setAttribute("data-state", state || ""); c.txt.textContent = label;
      },
      clear() { cells.forEach(c => { c.g.setAttribute("data-state", ""); c.txt.textContent = ""; }); },
      clearState(st) { cells.forEach(c => { if (c.g.getAttribute("data-state") === st) { c.g.setAttribute("data-state", ""); c.txt.textContent = ""; } }); },
      dim(onlyStrings) { cells.forEach((c, k) => c.g.classList.toggle("dimmed", !!onlyStrings && !onlyStrings.includes(+k.split(":")[0]))); },
      onClick(fn) {
        root.addEventListener("click", e => {
          const g = e.target.closest(".jb-cell"); if (!g || g.classList.contains("dimmed")) return;
          fn(+g.dataset.s, +g.dataset.f);
        });
      },
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
  async function startMic(onNote, onLevel, isCurrent) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("micro");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    if (!isCurrent()) { stream.getTracks().forEach(t => t.stop()); return false; }
    stopMic();
    const c = getCtx(); if (c.state === "suspended") await c.resume();
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
  function stopMic() {
    if (!mic) return;
    clearInterval(mic.id);
    try { mic.src.disconnect(); mic.an.disconnect(); mic.mute.disconnect(); } catch {}
    mic.stream.getTracks().forEach(t => t.stop());
    mic = null;
  }
  let listenOn = false, quiet = false; // quiet : pas de son de guitare pendant que le micro écoute
  try { listenOn = localStorage.getItem("maguitare:ecoute") === "1"; } catch {}

  // ---------- Les jeux ----------
  const MODES = {
    trouve: { titre: "Trouve les notes", regle: "Touche toutes les cases de la note demandée, sur la corde indiquée (cases 0 à 12).", ecoute: "Joue sur ta guitare chaque case de la note demandée, sur la corde indiquée (cases 0 à 12). Le micro les place sur le manche." },
    nomme: { titre: "Quelle note ?", regle: "Une case s'allume : choisis son nom. Objectif : moins de 3 secondes.", ecoute: "Joue sur ta guitare la note demandée, sur la bonne corde. Objectif : moins de 3 secondes." },
    partout: { titre: "Partout sur le manche", regle: "Touche toutes les cases de la note demandée, sur les 6 cordes (cases 0 à 12).", ecoute: "Joue la note demandée sur chaque corde, de la plus grave à la plus aiguë (cases 0 à 12)." },
    octave: { titre: "Octaves", regle: "Une note est posée : touche son octave, deux cordes plus loin vers l'aigu. +2 cases depuis le Mi grave, le La ou le Ré. +3 cases depuis la corde de Sol (on passe la corde de Si).", ecoute: "Joue la note posée, puis son octave : deux cordes plus loin vers l'aigu, +2 cases (+3 depuis la corde de Sol)." },
    quiz: { titre: "Quiz du manche", regle: "Une note au hasard : trouve-la sur chaque corde, le plus vite possible.", ecoute: "Une note au hasard : joue-la sur chaque corde, de la plus grave à la plus aiguë, le plus vite possible." },
  };

  const targetsOn = (s, n) => { const t = []; for (let f = 0; f <= FRETS; f++) if (pcOf(s, f) === PC[n]) t.push([s, f]); return t; };
  function makeRounds(cfg, listen) {
    const cordes = cfg.cordes?.length ? cfg.cordes : [6, 5, 4, 3, 2, 1];
    const R = [];
    if (cfg.mode === "trouve") {
      let last = "";
      for (let i = 0; i < 8; i++) {
        const s = pick(cordes);
        let n; do { n = pick(NATURALS); } while (n === last); last = n;
        R.push({ q: `${listen ? "Joue" : "Trouve"} tous les ${n} sur ${corde(s)}`, note: n, only: [s], targets: targetsOn(s, n) });
      }
    } else if (cfg.mode === "nomme") {
      let lastKey = "";
      for (let i = 0; i < 10; i++) {
        let s, f; do { s = pick(cordes); f = Math.floor(Math.random() * (FRETS + 1)); } while (!isNatural(s, f) || s + ":" + f === lastKey);
        lastKey = s + ":" + f;
        const n = nameOf(s, f);
        // à l'écoute, on fait l'inverse : le nom est donné, il faut trouver la case sur sa guitare
        if (listen) R.push({ q: `Joue un ${n} sur ${corde(s)}`, note: n, only: [s], targets: targetsOn(s, n), anyOf: true });
        else R.push({ q: `Quelle est cette note, sur ${corde(s)} ?`, ask: [s, f], answer: n });
      }
    } else if (cfg.mode === "partout" || cfg.mode === "quiz") {
      const notes = cfg.mode === "partout" && cfg.note ? [cfg.note, ...shuffle(NATURALS.filter(n => n !== cfg.note)).slice(0, 2)] : shuffle(NATURALS).slice(0, 5);
      notes.forEach(n => {
        const targets = [6, 5, 4, 3, 2, 1].flatMap(s => targetsOn(s, n));
        R.push({ q: `${listen ? "Joue" : "Trouve"} tous les ${n} du manche`, note: n, targets, seq: listen });
      });
    } else if (cfg.mode === "octave") {
      const from = cordes.filter(s => s >= 3);
      let lastKey = "";
      for (let i = 0; i < 8; i++) {
        let s, f; do { s = pick(from.length ? from : [6, 5]); f = Math.floor(Math.random() * 10); } while (!isNatural(s, f) || s + ":" + f === lastKey);
        lastKey = s + ":" + f;
        const t = s - 2, tf = f + (s === 3 ? 3 : 2);
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
    const title = el("h2", { id: "jeuTitre", text: cfg.label || info.titre });
    const close = el("button", { class: "icon-btn", type: "button", "aria-label": "Fermer", text: "✕", onclick: () => d.close() });
    const sound = el("button", { class: "icon-btn", type: "button", "aria-pressed": String(soundOn), title: "Son de la guitare", text: soundOn ? "🔊" : "🔈" });
    sound.addEventListener("click", () => { soundOn = !soundOn; sound.textContent = soundOn ? "🔊" : "🔈"; sound.setAttribute("aria-pressed", String(soundOn)); try { localStorage.setItem("maguitare:son", soundOn ? "1" : "0"); } catch {} });
    const voixBtn = window.Sons?.voixDispo ? el("button", { class: "icon-btn", type: "button", "aria-pressed": String(Sons.voix), title: "Voix : lit les questions", text: Sons.voix ? "🗣️" : "🤐" }) : null;
    voixBtn?.addEventListener("click", () => { Sons.voix = !Sons.voix; voixBtn.textContent = Sons.voix ? "🗣️" : "🤐"; voixBtn.setAttribute("aria-pressed", String(Sons.voix)); if (Sons.voix) say(q.textContent); });
    const prog = el("span", { class: "jeu-prog" });
    const q = el("p", { class: "jeu-q" });
    const fb = el("p", { class: "jeu-fb", role: "status" });
    const hintBtn = el("button", { class: "btn small", type: "button", text: "💡 Indice" });
    const solveBtn = el("button", { class: "btn small", type: "button", text: "Résoudre" });
    const nextBtn = el("button", { class: "btn small primary", type: "button", text: "Suivant →", hidden: true });
    const listenBtn = el("button", { class: "btn small listen-btn", type: "button", "aria-pressed": String(listen), title: "Jouer les notes sur ta guitare : le micro les reconnaît" });
    listenBtn.innerHTML = ICON_MIC; listenBtn.append(listen ? "Écoute : oui" : "Mode écoute");
    const actions = el("div", { class: "jeu-actions" }, hintBtn, solveBtn, nextBtn, listenBtn);
    const level = el("i");
    const heardTxt = el("span", { text: "Je prépare le micro…" });
    const listenBar = el("div", { class: "jeu-listen", hidden: !listen }, el("span", { class: "jl-level", "aria-hidden": "true" }, level), heardTxt);
    const boardHost = el("div", { class: "jeu-board-wrap" + (vertical ? " vertical" : "") });
    const answers = el("div", { class: "jeu-answers", hidden: true });
    const body = el("div", { class: "sheet-in jeu-in" },
      el("div", { class: "sheet-head" }, el("div", {}, (cfg.label && cfg.label !== info.titre) ? el("span", { class: "eyebrow", text: info.titre + (listen ? " · écoute" : "") }) : null, title), el("div", { class: "jeu-tools" }, voixBtn, sound, close)),
      el("p", { class: "muted small", text: listen ? info.ecoute : info.regle }),
      el("div", { class: "jeu-bar" }, q, prog), actions, listenBar, fb, boardHost, answers);
    d.replaceChildren(body);
    if (!d.open) d.showModal();

    const board = Board(boardHost, { vertical });
    const rounds = makeRounds(cfg, listen);
    run = { i: 0, errors: 0, perfect: 0, roundErr: 0, found: new Set(), t0: 0, times: [], correct: 0, timer: null, locked: false, hints: 0, solved: 0, hintLevel: 0, wrongSeen: new Set() };
    const R = () => rounds[run?.i];
    const key = (s, f) => s + ":" + f;
    const left = r => r.targets.filter(([s, f]) => !run.found.has(key(s, f)));
    // à l'écoute, « partout » et « quiz » se jouent corde par corde, du Mi grave au Mi aigu
    const curString = r => (left(r)[0] || [])[0];
    const setFb = (text, cls = "", speak = true) => { fb.textContent = text; fb.className = "jeu-fb" + (cls ? " " + cls : ""); if (speak) say(text); };

    function showRound() {
      const r = R();
      board.clear(); run.found = new Set(); run.roundErr = 0; run.hintLevel = 0; run.roundHelp = false; run.locked = false; run.wrongSeen = new Set();
      fb.textContent = ""; fb.className = "jeu-fb";
      prog.textContent = `${run.i + 1} / ${rounds.length}`;
      hintBtn.hidden = solveBtn.hidden = false; nextBtn.hidden = true; hintBtn.disabled = false;
      q.textContent = r.seq ? `${r.q} : commence par ${corde(curString(r))}` : r.q;
      board.dim(r.only || (r.ask ? [r.ask[0]] : r.seq ? [curString(r)] : null));
      answers.hidden = !r.ask;
      if (r.ask) {
        board.set(r.ask[0], r.ask[1], "ask", "?");
        answers.replaceChildren(...NATURALS.map(n => el("button", { type: "button", class: "btn", text: n, onclick: () => answer(n) })));
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

    function answer(n) {
      if (run.locked) return;
      const r = R(), [s, f] = r.ask, ms = performance.now() - run.t0;
      run.locked = true;
      play(OPEN[s] + f);
      answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.textContent === r.answer) b.classList.add("good"); else if (b.textContent === n) b.classList.add("bad"); });
      if (n === r.answer) {
        run.correct++; if (!run.roundHelp) run.perfect++; run.times.push(ms); board.set(s, f, "ok", r.answer);
        setFb(ms < 3000 ? `Oui, ${r.answer} ! (${(ms / 1000).toFixed(1).replace(".", ",")} s)` : `Oui, ${r.answer}. ${(ms / 1000).toFixed(1).replace(".", ",")} s : vise moins de 3 s.`, "good", false);
        say(`Oui, ${r.answer} !`);
      } else {
        run.errors++; board.set(s, f, "bad", r.answer);
        setFb(`Non, c'est un ${r.answer} (case ${f}).`, "bad");
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
      run.correct++;
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
          answers.querySelectorAll("button").forEach(b => { if (!keep.has(b.textContent)) b.disabled = true; });
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
      run.solved++; run.locked = true; run.roundHelp = true; clearTimeout(run.timer);
      if (r.ask) {
        const [s, f] = r.ask;
        board.set(s, f, "sol", r.answer); play(OPEN[s] + f);
        answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.textContent === r.answer) b.classList.add("good"); });
        setFb(`C'était un ${r.answer}, case ${f} de ${corde(s).replace("la corde de ", "la corde ")}.`, "hint");
      } else {
        board.dim(null);
        const shown = r.anyOf ? r.targets.slice(0, 1) : left(r);
        shown.forEach(([s, f]) => board.set(s, f, "sol", nameOf(s, f)));
        setFb(r.anyOf || shown.length === 1 ? `Voilà : case ${shown[0][1]} sur ${corde(shown[0][0])}.` : `Voilà les ${shown.length} qui restaient. Regarde-les bien.`, "hint");
      }
      hintBtn.hidden = solveBtn.hidden = true; nextBtn.hidden = false;
      nextBtn.focus({ preventScroll: true });
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
      q.textContent = bravo; prog.textContent = "";
      fb.className = "jeu-fb";
      fb.textContent = (isAsk ? `${score} bonnes réponses sur ${rounds.length}` : `${score} tours sur ${rounds.length} sans aide ni erreur, ${run.errors} erreur${run.errors > 1 ? "s" : ""}`)
        + (run.hints ? `, ${run.hints} indice${run.hints > 1 ? "s" : ""}` : "") + (run.solved ? `, ${run.solved} résolu${run.solved > 1 ? "s" : ""}` : "")
        + (avg ? ` · ${(avg / 1000).toFixed(1).replace(".", ",")} s par note` : "") + ".";
      say(bravo + " " + fb.textContent);
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
        .catch(() => { if (run !== me) return; heardTxt.textContent = "Le micro est refusé. Autorise-le dans les réglages de Safari (aA › Réglages du site web › Micro), ou touche les cases à la place."; listenBar.classList.add("off"); });
    }
  }

  const resume = r => `${r.label}${r.ecoute ? " (à l'écoute)" : ""} : ${r.ask || (r.mode === "nomme" && !r.ecoute) ? `${r.score}/${r.total} justes` : `${r.score}/${r.total} tours sans faute, ${r.errors} erreur${r.errors > 1 ? "s" : ""}`}`
    + (r.hints ? `, ${r.hints} indice${r.hints > 1 ? "s" : ""}` : "") + (r.solved ? `, ${r.solved} résolu${r.solved > 1 ? "s" : ""}` : "")
    + `${r.ms ? `, ${(r.ms / 1000).toFixed(1).replace(".", ",")} s par note` : ""}`;
  window.Jeux = { open, resume, MODES, NOM_CORDE };
})();
