/* Jeux du manche : trouver les notes d'une corde, nommer une note, tous les X du manche, octaves, quiz. */
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
  const getCtx = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
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
    const c = getCtx(); if (c.state === "suspended") c.resume();
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
  }
  function play(midi) {
    if (!soundOn || !buffers?.length) return;
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
      dim(onlyStrings) { cells.forEach((c, k) => c.g.classList.toggle("dimmed", !!onlyStrings && !onlyStrings.includes(+k.split(":")[0]))); },
      onClick(fn) {
        root.addEventListener("click", e => {
          const g = e.target.closest(".jb-cell"); if (!g || g.classList.contains("dimmed")) return;
          fn(+g.dataset.s, +g.dataset.f);
        });
      },
    };
  }

  // ---------- Les jeux ----------
  const MODES = {
    trouve: { titre: "Trouve les notes", regle: "Touche toutes les cases de la note demandée, sur la corde indiquée (cases 0 à 12)." },
    nomme: { titre: "Quelle note ?", regle: "Une case s'allume : choisis son nom. Objectif : moins de 3 secondes." },
    partout: { titre: "Partout sur le manche", regle: "Touche toutes les cases de la note demandée, sur les 6 cordes (cases 0 à 12)." },
    octave: { titre: "Octaves", regle: "Une note est posée : touche son octave, deux cordes plus loin vers l'aigu. +2 cases depuis le Mi grave, le La ou le Ré. +3 cases depuis la corde de Sol (on passe la corde de Si)." },
    quiz: { titre: "Quiz du manche", regle: "Une note au hasard : trouve-la sur chaque corde, le plus vite possible." },
  };

  function makeRounds(cfg) {
    const cordes = cfg.cordes?.length ? cfg.cordes : [6, 5, 4, 3, 2, 1];
    const R = [];
    if (cfg.mode === "trouve") {
      let last = "";
      for (let i = 0; i < 8; i++) {
        const s = pick(cordes);
        let n; do { n = pick(NATURALS); } while (n === last); last = n;
        const targets = []; for (let f = 0; f <= FRETS; f++) if (pcOf(s, f) === PC[n]) targets.push([s, f]);
        R.push({ q: `Trouve tous les ${n} sur ${corde(s)}`, note: n, only: [s], targets });
      }
    } else if (cfg.mode === "nomme") {
      let lastKey = "";
      for (let i = 0; i < 10; i++) {
        let s, f; do { s = pick(cordes); f = Math.floor(Math.random() * (FRETS + 1)); } while (!isNatural(s, f) || s + ":" + f === lastKey);
        lastKey = s + ":" + f;
        R.push({ q: `Quelle est cette note, sur ${corde(s)} ?`, ask: [s, f], answer: nameOf(s, f) });
      }
    } else if (cfg.mode === "partout" || cfg.mode === "quiz") {
      const notes = cfg.mode === "partout" && cfg.note ? [cfg.note, ...shuffle(NATURALS.filter(n => n !== cfg.note)).slice(0, 2)] : shuffle(NATURALS).slice(0, 5);
      notes.forEach(n => {
        const targets = [];
        for (const s of [6, 5, 4, 3, 2, 1]) for (let f = 0; f <= FRETS; f++) if (pcOf(s, f) === PC[n]) targets.push([s, f]);
        R.push({ q: `Trouve tous les ${n} du manche`, note: n, targets });
      });
    } else if (cfg.mode === "octave") {
      const from = cordes.filter(s => s >= 3);
      let lastKey = "";
      for (let i = 0; i < 8; i++) {
        let s, f; do { s = pick(from.length ? from : [6, 5]); f = Math.floor(Math.random() * 10); } while (!isNatural(s, f) || s + ":" + f === lastKey);
        lastKey = s + ":" + f;
        const t = s - 2, tf = f + (s === 3 ? 3 : 2);
        R.push({ q: `Trouve l'octave de ce ${nameOf(s, f)}`, src: [s, f], note: nameOf(s, f), targets: [[t, tf]] });
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
    return sheet;
  }
  let run = null;
  const stopRun = () => { if (run) { clearTimeout(run.timer); run = null; } };

  function open(cfg, onDone) {
    const d = ensureSheet();
    unlock(); loadSamples();
    const info = MODES[cfg.mode];
    const vertical = window.matchMedia("(max-width: 700px)").matches;
    const title = el("h2", { id: "jeuTitre", text: cfg.label || info.titre });
    const close = el("button", { class: "icon-btn", type: "button", "aria-label": "Fermer", text: "✕", onclick: () => { stopRun(); d.close(); } });
    const sound = el("button", { class: "icon-btn", type: "button", "aria-pressed": String(soundOn), title: "Son", text: soundOn ? "🔊" : "🔈" });
    sound.addEventListener("click", () => { soundOn = !soundOn; sound.textContent = soundOn ? "🔊" : "🔈"; sound.setAttribute("aria-pressed", String(soundOn)); try { localStorage.setItem("maguitare:son", soundOn ? "1" : "0"); } catch {} });
    const prog = el("span", { class: "jeu-prog" });
    const q = el("p", { class: "jeu-q" });
    const fb = el("p", { class: "jeu-fb", role: "status" });
    const boardHost = el("div", { class: "jeu-board-wrap" + (vertical ? " vertical" : "") });
    const answers = el("div", { class: "jeu-answers", hidden: true });
    const body = el("div", { class: "sheet-in jeu-in" },
      el("div", { class: "sheet-head" }, el("div", {}, (cfg.label && cfg.label !== info.titre) ? el("span", { class: "eyebrow", text: info.titre }) : null, title), el("div", { class: "jeu-tools" }, sound, close)),
      el("p", { class: "muted small", text: info.regle }),
      el("div", { class: "jeu-bar" }, q, prog), fb, boardHost, answers);
    d.replaceChildren(body);
    if (!d.open) d.showModal();

    const board = Board(boardHost, { vertical });
    const rounds = makeRounds(cfg);
    stopRun();
    run = { i: 0, errors: 0, perfect: 0, roundErr: 0, found: new Set(), t0: 0, times: [], correct: 0, timer: null, locked: false };
    const R = () => rounds[run.i];

    function showRound() {
      const r = R();
      board.clear(); run.found = new Set(); run.roundErr = 0; run.locked = false; fb.textContent = ""; fb.className = "jeu-fb";
      prog.textContent = `${run.i + 1} / ${rounds.length}`;
      q.textContent = r.q;
      board.dim(r.only || (r.ask ? [r.ask[0]] : null));
      answers.hidden = !r.ask;
      if (r.ask) {
        board.set(r.ask[0], r.ask[1], "ask", "?");
        answers.replaceChildren(...NATURALS.map(n => el("button", { type: "button", class: "btn", text: n, onclick: () => answer(n) })));
      }
      if (r.src) { board.set(r.src[0], r.src[1], "src", r.note); play(OPEN[r.src[0]] + r.src[1]); }
      run.t0 = performance.now();
    }

    function next() {
      run.i++;
      if (run.i >= rounds.length) return finish();
      showRound();
    }

    function answer(n) {
      if (run.locked) return;
      const r = R(), [s, f] = r.ask, ms = performance.now() - run.t0;
      run.locked = true;
      play(OPEN[s] + f);
      answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.textContent === r.answer) b.classList.add("good"); else if (b.textContent === n) b.classList.add("bad"); });
      if (n === r.answer) {
        run.correct++; run.times.push(ms); board.set(s, f, "ok", r.answer);
        fb.textContent = ms < 3000 ? `Oui, ${r.answer} ! (${(ms / 1000).toFixed(1)} s)` : `Oui, ${r.answer}. ${(ms / 1000).toFixed(1)} s : vise moins de 3 s.`;
        fb.className = "jeu-fb good";
      } else {
        run.errors++; board.set(s, f, "bad", r.answer);
        fb.textContent = `Non, c'est un ${r.answer} (case ${f}).`; fb.className = "jeu-fb bad";
      }
      run.timer = setTimeout(next, n === r.answer ? 900 : 1700);
    }

    board.onClick((s, f) => {
      const r = R(); if (!r || run.locked || r.ask) return;
      if (r.src && s === r.src[0] && f === r.src[1]) return;
      const key = s + ":" + f;
      if (run.found.has(key)) return;
      const hit = r.targets.some(([ts, tf]) => ts === s && tf === f);
      if (hit) {
        run.found.add(key); board.set(s, f, "ok", nameOf(s, f)); play(OPEN[s] + f);
        run.times.push(performance.now() - run.t0); run.t0 = performance.now();
        const left = r.targets.length - run.found.size;
        if (left > 0) { fb.textContent = `Oui ! Encore ${left}.`; fb.className = "jeu-fb good"; return; }
        if (!run.roundErr) run.perfect++;
        run.correct++;
        fb.textContent = run.roundErr ? "Trouvé !" : "Parfait, sans erreur !"; fb.className = "jeu-fb good";
        if (r.src) board.set(r.src[0], r.src[1], "src", r.note);
        run.locked = true; run.timer = setTimeout(next, 1000);
      } else {
        run.errors++; run.roundErr++;
        const nm = nameOf(s, f);
        board.set(s, f, "bad", nm.replace("♯", "#"));
        play(OPEN[s] + f);
        fb.textContent = r.src && nm === r.note
          ? `C'est bien un ${nm}, mais pas l'octave deux cordes plus loin vers l'aigu.`
          : `Ça, c'est un ${nm}.`;
        fb.className = "jeu-fb bad";
        setTimeout(() => { if (!run.found.has(key)) board.set(s, f, "", ""); }, 900);
      }
    });

    function finish() {
      const avg = run.times.length ? run.times.reduce((a, b) => a + b, 0) / run.times.length : 0;
      const isAsk = cfg.mode === "nomme";
      const score = isAsk ? run.correct : run.perfect;
      const res = { mode: cfg.mode, label: cfg.label || info.titre, score, total: rounds.length, errors: run.errors, ms: Math.round(avg), date: new Date().toISOString() };
      const pct = score / rounds.length;
      const bravo = pct === 1 ? "Parfait !" : pct >= 0.8 ? "Très bien !" : pct >= 0.5 ? "C'est en train de rentrer." : "On continue, ça va venir.";
      answers.hidden = true; board.dim(null);
      q.textContent = bravo; prog.textContent = "";
      fb.className = "jeu-fb";
      fb.textContent = (isAsk ? `${score} bonnes réponses sur ${rounds.length}` : `${score} tours sur ${rounds.length} sans erreur, ${run.errors} erreur${run.errors > 1 ? "s" : ""}`) + (avg ? ` · ${(avg / 1000).toFixed(1).replace(".", ",")} s par note` : "") + ".";
      boardHost.append(el("div", { class: "jeu-end" },
        el("button", { class: "btn primary big", type: "button", text: "Rejouer", onclick: () => open(cfg, onDone) }),
        el("button", { class: "btn big", type: "button", text: "Terminé", onclick: () => { stopRun(); d.close(); } })));
      try { onDone?.(res); } catch {}
    }

    showRound();
  }

  const resume = r => `${r.label} : ${r.mode === "nomme" ? `${r.score}/${r.total} justes` : `${r.score}/${r.total} tours sans faute, ${r.errors} erreur${r.errors > 1 ? "s" : ""}`}${r.ms ? `, ${(r.ms / 1000).toFixed(1).replace(".", ",")} s par note` : ""}`;
  window.Jeux = { open, resume, MODES, NOM_CORDE };
})();
