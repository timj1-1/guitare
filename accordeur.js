/* Accordeur (MAJ 01 §15) : le micro, la méthode YIN, diapason fixe La = 440 Hz, mode automatique.
   Banc d'essai du 2026-11-04 (YIN, MPM, autocorrélation sur des cordes de nylon simulées) : YIN est le plus juste
   (environ 1 centième de demi-ton une fois lissé) et ne se trompe presque jamais d'octave ; MPM et l'autocorrélation, si.
   - signal sous-échantillonné par 2 (4 fois moins de calcul), fenêtre de 8192 points (assez pour le Mi grave) ;
   - on ignore l'attaque de la corde (le son est instable pendant 0,1 s) ;
   - médiane des 5 dernières mesures : l'aiguille ne tremble pas. */
(() => {
  "use strict";
  const J = window.Jeux; if (!J?.micro) return;
  const { el } = J.base;
  const CORDES = [ // midi, nom, corde
    [40, "Mi", 6, "Mi grave"], [45, "La", 5, "La"], [50, "Ré", 4, "Ré"], [55, "Sol", 3, "Sol"], [59, "Si", 2, "Si"], [64, "Mi", 1, "Mi aigu"],
  ];
  const JUSTE = 3; // centièmes : en dessous, c'est juste (l'oreille ne fait pas la différence)
  const hz = m => 440 * 2 ** ((m - 69) / 12);

  // YIN sur le signal sous-échantillonné ; null si pas de note nette
  function hauteur(buf, sr) {
    const n = buf.length >> 1, x = new Float32Array(n);
    let rms = 0;
    for (let i = 0; i < n; i++) { const v = (buf[2 * i] + buf[2 * i + 1]) / 2; x[i] = v; rms += v * v; }
    rms = Math.sqrt(rms / n);
    const r = sr / 2;
    if (rms < 0.006) return { rms };
    const minT = Math.floor(r / 700), maxT = Math.min(Math.floor(r / 65), n >> 1), W = n - maxT - 2;
    const cm = new Float32Array(maxT + 2); cm[0] = 1;
    let acc = 0;
    for (let t = 1; t <= maxT + 1; t++) {
      let d = 0;
      for (let i = 0; i < W; i++) { const e = x[i] - x[i + t]; d += e * e; }
      acc += d; cm[t] = acc ? (d * t) / acc : 1;
    }
    let tau = -1;
    for (let t = Math.max(2, minT); t <= maxT; t++) if (cm[t] < 0.12) { while (t + 1 <= maxT && cm[t + 1] < cm[t]) t++; tau = t; break; }
    if (tau < 0) return { rms };
    const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1], den = a + c - 2 * b;
    return { rms, f: r / (tau + (den ? (a - c) / (2 * den) : 0)) };
  }
  // la corde la plus proche de la fréquence entendue, et l'écart en centièmes
  function corde(f) {
    const m = 69 + 12 * Math.log2(f / 440);
    let best = CORDES[0];
    for (const C of CORDES) if (Math.abs(m - C[0]) < Math.abs(m - best[0])) best = C;
    return { C: best, cents: (m - best[0]) * 100 };
  }

  let d = null, vivant = 0;
  function ouvrir() {
    if (!d) d = construire();
    d.showModal?.() ?? d.setAttribute("open", "");
    window.Sons?.tais();
    d._demarre();
  }

  function construire() {
    const dlg = el("dialog", { class: "sheet tuner-sheet", "aria-labelledby": "tunerTitre" });
    const etat = el("p", { class: "tuner-etat", role: "status", text: "Joue une corde à vide." });
    const note = el("div", { class: "tuner-note" }, el("strong", { text: "–" }), el("span", { text: "" }));
    const aiguille = el("i", { class: "tuner-aiguille" });
    const ecart = el("output", { class: "tuner-cents", text: "" });
    const cadran = el("div", { class: "tuner-cadran", "aria-hidden": "true" },
      el("span", { class: "tuner-zone" }), aiguille,
      el("span", { class: "tuner-g", text: "−50" }), el("span", { class: "tuner-m", text: "0" }), el("span", { class: "tuner-d", text: "+50" }));
    const puces = CORDES.map(([, nom, n]) => el("span", { class: "tuner-corde", "data-corde": String(n) }, el("b", { text: nom }), el("small", { text: n === 1 ? "1re" : n + "e" })));
    const niveau = el("div", { class: "tuner-niveau", "aria-hidden": "true" }, el("i"));
    const fermer = () => dlg.close();
    dlg.append(el("div", { class: "sheet-in" },
      el("div", { class: "sheet-head" }, el("h2", { id: "tunerTitre", text: "Accordeur" }), el("button", { class: "icon-btn", type: "button", "aria-label": "Fermer", text: "✕", onclick: fermer })),
      el("p", { class: "muted small", text: "Mode automatique, La = 440 Hz. Joue une corde à vide, laisse-la sonner : je reconnais la corde." }),
      el("div", { class: "tuner-cordes" }, puces), note, cadran, ecart, etat, niveau));

    let hist = [], silence = 0, derniere = null, rmsAvant = 0, attaque = 0, aff = 0, justeDepuis = 0;
    const accordees = new Set();
    function montre(r) {
      const C = r?.C;
      puces.forEach(p => { p.classList.toggle("on", !!C && +p.dataset.corde === C[2]); p.classList.toggle("ok", accordees.has(+p.dataset.corde)); });
      if (!r) { note.firstChild.textContent = "–"; note.lastChild.textContent = ""; ecart.textContent = ""; aiguille.style.setProperty("--x", "0"); dlg.classList.remove("juste"); return; }
      const c = Math.max(-50, Math.min(50, r.cents));
      aff += (c - aff) * 0.5; // l'aiguille glisse au lieu de sauter
      aiguille.style.setProperty("--x", String(aff / 50));
      note.firstChild.textContent = C[1]; note.lastChild.textContent = `${C[2] === 1 ? "1re" : C[2] + "e"} corde · ${C[3]}`;
      const ce = Math.round(r.cents);
      ecart.textContent = `${ce > 0 ? "+" : ""}${ce} centièmes`;
      const juste = Math.abs(r.cents) <= JUSTE;
      dlg.classList.toggle("juste", juste);
      if (juste) {
        if (!justeDepuis) justeDepuis = performance.now();
        if (performance.now() - justeDepuis > 600 && !accordees.has(C[2])) { accordees.add(C[2]); window.Sons?.cling?.(); }
        etat.textContent = "C'est juste !";
      } else {
        justeDepuis = 0;
        etat.textContent = r.cents < 0 ? (r.cents < -50 ? "Beaucoup trop grave : tends la corde." : "Trop grave : tends un peu la corde.") : (r.cents > 50 ? "Beaucoup trop aigu : détends la corde." : "Trop aigu : détends un peu la corde.");
      }
    }
    function trame(buf, sr) {
      const p = hauteur(buf, sr);
      niveau.firstChild.style.width = Math.min(100, Math.round(Math.sqrt(p.rms) * 260)) + "%";
      const now = performance.now();
      if (p.rms > rmsAvant * 1.8 && p.rms > 0.02) attaque = now; // une corde vient d'être pincée
      rmsAvant = p.rms;
      if (!p.f || now - attaque < 110) {
        // le son s'est éteint : la dernière mesure reste affichée 2 s, puis on attend la corde suivante
        if (!p.f && p.rms < 0.006 && hist.length) { hist = []; silence = now; dlg.classList.add("eteint"); }
        if (silence && now - silence > 2000) { silence = 0; derniere = null; justeDepuis = 0; montre(null); dlg.classList.remove("eteint"); etat.textContent = "Joue une corde à vide."; }
        return;
      }
      const r = corde(p.f);
      if (Math.abs(r.cents) > 350) return; // trop loin de toute corde : sans doute un bruit
      if (derniere && derniere !== r.C) { hist = []; aff = r.cents; }
      derniere = r.C; silence = 0; dlg.classList.remove("eteint");
      hist.push(r.cents); if (hist.length > 5) hist.shift();
      if (hist.length < 3) return;
      const med = [...hist].sort((a, b) => a - b)[hist.length >> 1];
      montre({ C: r.C, cents: med });
    }
    dlg._demarre = () => {
      const moi = ++vivant;
      hist = []; derniere = null; montre(null); etat.textContent = "J'ouvre le micro…";
      J.micro.start(() => {}, null, () => moi === vivant && dlg.open, { brut: trame, taille: 8192 })
        .then(ok => { if (ok !== false && moi === vivant) etat.textContent = "Joue une corde à vide."; })
        .catch(e => {
          if (moi !== vivant) return;
          etat.textContent = e?.message === "chrome-mac" ? "Sur Chrome pour Mac, le micro est coupé pour l'instant : il a figé Chrome. Ouvre l'app dans Safari pour t'accorder."
            : "Le micro est refusé. Autorise-le dans les réglages du navigateur (sur iPhone : aA › Réglages du site web › Micro), puis rouvre l'accordeur.";
        });
    };
    dlg.addEventListener("close", () => { vivant++; J.micro.stop(); });
    dlg.addEventListener("click", e => { if (e.target === dlg) fermer(); });
    document.body.append(dlg);
    return dlg;
  }

  window.Accordeur = { ouvrir, hauteur, corde };
  document.getElementById("tunerBtn")?.addEventListener("click", ouvrir);
})();
