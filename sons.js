/* Sons et voix de l'app : un seul contexte audio, petits sons en notes de guitare,
   et une voix française naturelle enregistrée d'avance (dossier voix/ : Kokoro, et voix/<id>/ : voix Microsoft). */
(() => {
  "use strict";

  const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === "1"; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch {} };
  let sfxOn = read("maguitare:sfx", true);
  let voixOn = read("maguitare:voix", true);
  // la voix choisie dans les réglages : « siwis » (fichiers à la racine de voix/) ou une voix Microsoft (voix/<id>/)
  // Rémy par défaut : c'est la voix qu'il a choisie (2026-10-25)
  let voixNom = "remy";
  try { voixNom = localStorage.getItem("maguitare:voixNom") || "remy"; } catch {}

  // ---------- Contexte audio partagé (métronome, jeux, petits sons, voix) ----------
  let actx = null, triedAt = 0;
  const ctx = () => (actx && actx.state !== "closed" ? actx : (actx = new (window.AudioContext || window.webkitAudioContext)()));
  // Le son qui ne revient pas (appel, mise en veille, casque Bluetooth…) : au toucher suivant, un contexte neuf.
  function heal() {
    if (!actx || actx.state === "running") { triedAt = 0; return; }
    if (actx.state === "interrupted" || (triedAt && Date.now() - triedAt > 800)) {
      if (window.Jeux?.ecouteEnCours?.()) return; // ne pas couper le micro d'un jeu
      try { actx.close(); } catch {}
      actx = null; triedAt = 0;
    } else if (!triedAt) triedAt = Date.now();
  }
  ["pointerdown", "touchend"].forEach(ev => document.addEventListener(ev, () => { heal(); if (actx && actx.state !== "running") actx.resume()?.catch?.(() => {}); }, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && actx && actx.state !== "running") actx.resume()?.catch?.(() => {}); });
  function unlock() {
    heal();
    const c = ctx();
    if (c.state !== "running") c.resume()?.catch?.(() => {});
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
    // sur iPhone : jouer même quand le bouton silencieux est activé
    try { if (navigator.audioSession && navigator.audioSession.type !== "play-and-record") navigator.audioSession.type = "playback"; } catch {}
    guitare.charge();
  }

  // ---------- Guitare nylon (les mêmes sons que Mon manche) ----------
  // Le son choisi dans Mon manche (classique, flamenca, folk acier, manouche) vaut partout : cours, jeux, petits sons.
  // Mêmes enregistrements et mêmes réglages que Mon manche ; manouche par défaut.
  const SAMPLED = {
    classique: { set: "ny", eq: [], release: 2.6 },
    flamenca:  { set: "ny", eq: [["highpass", 90, 0.7, 0], ["peaking", 900, 1.2, -3], ["highshelf", 2800, 0.7, 7]], release: 1.3 },
    folk:      { set: "ac", eq: [], release: 2.8 },
    manouche:  { set: "ac", eq: [["highpass", 170, 0.7, 0], ["peaking", 1300, 1.0, 7], ["highshelf", 4500, 0.7, 3]], release: 1.7 },
  };
  try { if (!localStorage.getItem("manche:timbreV2")) { localStorage.setItem("manche:timbre", JSON.stringify("manouche")); localStorage.setItem("manche:timbreV2", "true"); } } catch {}
  const timbre = () => { try { const v = JSON.parse(localStorage.getItem("manche:timbre")); return SAMPLED[v] ? v : "manouche"; } catch { return "manouche"; } };
  const guitare = (() => {
    const FICHIER = { ny: ["samples-nylon.js", "NYLON_SAMPLES"], ac: ["samples-acier.js", "ACIER_SAMPLES"] };
    const sets = {}, loading = {};
    function chargeSet(name) {
      if (loading[name]) return loading[name];
      return (loading[name] = new Promise(res => {
        const [fichier, glob] = FICHIER[name];
        const go = async () => {
          const src = window[glob] || {}, c = ctx(), out = [];
          await Promise.all(Object.entries(src).map(async ([m, b64]) => {
            try {
              const bin = atob(b64), buf = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
              const decoded = await new Promise((ok, ko) => { const p = c.decodeAudioData(buf.buffer, ok, ko); if (p?.then) p.then(ok, ko); });
              out.push({ m: +m, buf: decoded });
            } catch {}
          }));
          sets[name] = out.sort((a, b) => a.m - b.m); res();
        };
        if (window[glob]) go();
        else { const sc = document.createElement("script"); sc.src = fichier; sc.onload = go; sc.onerror = () => { sets[name] = []; res(); }; document.head.append(sc); }
      }));
    }
    // charge le son choisi (et le nylon en secours)
    const charge = () => Promise.all([chargeSet(SAMPLED[timbre()].set), chargeSet("ny")]);
    // une note pincée ; at = moment (contexte audio), dur = durée avant l'étouffement
    function note(midi, { at = 0, gain = 0.9, dur = 1.4 } = {}) {
      const cfg = SAMPLED[timbre()];
      let set = sets[cfg.set];
      if (!set?.length) { chargeSet(cfg.set); set = sets.ny; }
      if (!set?.length) return false;
      const c = ctx(), t = Math.max(c.currentTime, at);
      const near = set.reduce((a, b) => (Math.abs(b.m - midi) < Math.abs(a.m - midi) ? b : a));
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = near.buf; s.playbackRate.value = Math.pow(2, (midi - near.m) / 12);
      g.gain.setValueAtTime(gain * (cfg.set === "ac" ? 0.8 : 1), t);
      let dest = c.destination;
      for (const [type, f, q, gn] of [...cfg.eq].reverse()) {
        const bq = c.createBiquadFilter(); bq.type = type; bq.frequency.value = f; bq.Q.value = q; bq.gain.value = gn;
        bq.connect(dest); dest = bq;
      }
      const fin = Math.min(dur, cfg.release);
      s.connect(g).connect(dest); s.start(t);
      g.gain.setTargetAtTime(0, t + fin, 0.22); s.stop(t + fin + 1.2);
      return true;
    }
    // le son a changé dans Mon manche : on prépare le nouveau
    window.addEventListener("storage", e => { if (e.key === "manche:timbre") chargeSet(SAMPLED[timbre()].set); });
    return { charge, note, pret: () => !!(sets[SAMPLED[timbre()].set]?.length || sets.ny?.length) };
  })();

  // Repli si les sons de guitare ne sont pas encore chargés : une petite clochette.
  function bell(freq, at, gain = 0.25, decay = 0.6) {
    const c = ctx(), out = c.createGain();
    out.gain.setValueAtTime(0.0001, at); out.gain.exponentialRampToValueAtTime(gain, at + 0.006); out.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    out.connect(c.destination);
    const o = c.createOscillator(); o.frequency.value = freq; o.connect(out); o.start(at); o.stop(at + decay + 0.05);
  }
  // notes : [midi, décalage en s, gain, durée]
  function joue(notes, force = false) {
    if (!sfxOn && !force) return;
    try {
      unlock();
      const t0 = ctx().currentTime + 0.03;
      if (guitare.pret()) notes.forEach(([m, dt, g = 0.8, d = 1.2]) => guitare.note(m, { at: t0 + dt, gain: g, dur: d }));
      else notes.forEach(([m, dt, g = 0.8]) => bell(440 * Math.pow(2, (m - 69) / 12), t0 + dt, g * 0.3));
    } catch {}
  }
  // « Cling » : deux notes aiguës de guitare, Mi puis Si
  const cling = () => joue([[76, 0, 0.75, 0.9], [83, 0.085, 0.6, 1.1]]);
  // Bloc terminé : petit arpège montant de Mi majeur
  const bloc = () => joue([[64, 0, 0.7], [68, 0.11, 0.7], [71, 0.22, 0.7], [76, 0.33, 0.8, 1.6]]);
  // Cours terminé : accord de Mi gratté, puis l'arpège qui monte
  const fanfare = () => joue([[40, 0, 0.6, 2.4], [47, 0.025, 0.55, 2.4], [52, 0.05, 0.55, 2.4], [56, 0.075, 0.55, 2.4], [59, 0.1, 0.55, 2.4], [64, 0.125, 0.6, 2.4],
    [68, 0.75, 0.7], [71, 0.87, 0.7], [76, 0.99, 0.75], [80, 1.11, 0.8, 2.2]]);
  // ---------- La musique du cours : une gamme par cours, une note par exercice coché ----------
  // Les 12 cours d'un palier ont chacun leur gamme ; chaque palier reprend le même ordre.
  // [nom, tonique (midi), intervalles depuis la tonique]
  const GAMMES = [
    ["Mi espagnole (phrygien dominant)", 52, [0, 1, 4, 5, 7, 8, 10]],
    ["Ré dorien", 62, [0, 2, 3, 5, 7, 9, 10]],
    ["Fa lydien", 53, [0, 2, 4, 6, 7, 9, 11]],
    ["La tzigane (mineure hongroise)", 57, [0, 2, 3, 6, 7, 8, 11]],
    ["Sol mixolydien", 55, [0, 2, 4, 5, 7, 9, 10]],
    ["Do hirajoshi (japonaise)", 60, [0, 2, 3, 7, 8]],
    ["Mi phrygien", 52, [0, 1, 3, 5, 7, 8, 10]],
    ["Ré blues", 62, [0, 3, 5, 6, 7, 10]],
    ["La mineure mélodique", 57, [0, 2, 3, 5, 7, 9, 11]],
    ["Si mineure harmonique", 59, [0, 2, 3, 5, 7, 8, 11]],
    ["Do par tons", 60, [0, 2, 4, 6, 8, 10]],
    ["Fa double harmonique (orientale)", 53, [0, 1, 4, 5, 7, 8, 11]],
  ];
  const gamme = num => { const [nom, t, iv] = GAMMES[(Math.max(1, num) - 1) % GAMMES.length]; return { nom, t, iv }; };
  // le i-ème exercice : on monte la gamme sur deux octaves, puis on redescend s'il reste des exercices
  const degre = (g, i) => { const top = 2 * g.iv.length, k = i % (2 * top); return k <= top ? k : 2 * top - k; };
  const hauteur = (g, d) => g.t + 12 * Math.floor(d / g.iv.length) + g.iv[d % g.iv.length];
  // fin de bloc : la note, sa tierce dans la gamme, et la tonique en basse
  const double = (g, d, at) => [[g.t - 12, at, 0.42, 1.8], [hauteur(g, d), at, 0.7, 1.6], [hauteur(g, d + 2), at + 0.06, 0.6, 1.6]];
  const noteCours = (num, i, finBloc) => {
    const g = gamme(num), d = degre(g, i);
    joue(finBloc ? double(g, d, 0) : [[hauteur(g, d), 0, 0.7, 1.3]]);
  };
  // fin du cours : toutes ses notes rejouées d'un trait, avec les doubles notes des fins de bloc, puis l'accord de la gamme
  function musiqueCours(num, blocs) {
    const g = gamme(num), N = [];
    let t = 0, i = 0;
    for (const n of blocs) for (let j = 0; j < n; j++, i++) {
      const d = degre(g, i);
      if (j < n - 1) { N.push([hauteur(g, d), t, 0.62, 0.9]); t += 0.17; }
      else { N.push(...double(g, d, t)); t += 0.36; }
    }
    const tierce = g.iv.find(x => x === 4 || x === 3) ?? 7, quinte = [7, 8, 6].find(x => g.iv.includes(x)) ?? 7;
    [g.t - 12, g.t - 12 + quinte, g.t, g.t + tierce, g.t + quinte, g.t + 12].forEach((m, k) => N.push([m, t + 0.2 + k * 0.035, 0.55, 2.6]));
    joue(N);
    return g.nom;
  }
  // Fin d'un minuteur : La, Do dièse, Mi, deux fois (même quand les petits sons sont coupés)
  const alarme = () => joue([[69, 0, 0.8], [73, 0.14, 0.8], [76, 0.28, 0.85, 1.4], [69, 0.95, 0.8], [73, 1.09, 0.8], [76, 1.23, 0.9, 2]], true);

  // ---------- Voix ----------
  // Chaque phrase est un fichier voix/<empreinte>.mp3 : les 16 premiers caractères du SHA-1 du texte exact.
  // Une phrase sans fichier est lue par la voix de l'appareil (repli).
  const synth = window.speechSynthesis;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const fr = synth.getVoices().filter(v => /^fr/i.test(v.lang));
    const frFR = fr.filter(v => /fr[-_]FR/i.test(v.lang));
    const rank = v => (/premium/i.test(v.name) ? 3 : /enhanced|amélior/i.test(v.name) ? 2 : /Google/i.test(v.name) ? 1 : 0);
    voice = [...frFR].sort((a, b) => rank(b) - rank(a))[0] || fr[0] || null;
  }
  if (synth) { pickVoice(); synth.addEventListener?.("voiceschanged", pickVoice); }
  const propre = t => String(t)
    .replace(/♯|#/g, " dièse").replace(/\bSib\b/g, "Si bémol").replace(/→/g, ", ").replace(/\s+/g, " ").trim();

  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  async function empreinte(text) {
    if (!crypto?.subtle) return null;
    return hex(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text))).slice(0, 16);
  }
  const cache = new Map(); // voix + texte -> Promise<AudioBuffer|null>
  const dossier = nom => (nom && nom !== "siwis" ? "voix/" + nom + "/" : "voix/");
  function charge(text, nom = voixNom) {
    const k = nom + "|" + text;
    if (!cache.has(k)) {
      cache.set(k, (async () => {
        try {
          const id = await empreinte(text); if (!id) return null;
          let r = await fetch(dossier(nom) + id + ".mp3");
          // phrase pas encore enregistrée avec cette voix : la voix d'origine
          if (!r.ok && nom !== "siwis") r = await fetch(dossier("siwis") + id + ".mp3");
          if (!r.ok) return null;
          const data = await r.arrayBuffer();
          return await new Promise((ok, ko) => { const p = ctx().decodeAudioData(data, ok, ko); if (p?.then) p.then(ok, ko); });
        } catch { return null; }
      })().then(buf => { if (!buf) cache.delete(k); return buf; })); // raté (hors ligne…) : on réessaiera la prochaine fois
      if (cache.size > 80) cache.delete(cache.keys().next().value);
    }
    return cache.get(k);
  }

  let tour = 0, source = null, parleJusqua = 0;
  const manque = new Set();
  function tais() {
    tour++;
    try { source?.stop(); } catch {}
    source = null;
    try { synth?.cancel(); } catch {}
    parleJusqua = performance.now() + 200;
  }
  function repli(text) {
    return new Promise(res => {
      if (!synth) return res();
      const u = new SpeechSynthesisUtterance(propre(text));
      u.lang = "fr-FR"; if (voice) u.voice = voice; u.rate = 1;
      u.onend = u.onerror = () => res();
      synth.speak(u);
    });
  }
  // texte : une phrase ou une liste de phrases, lues à la suite
  // onSeg(i) : appelé quand la phrase i commence (l'app met sa partie en avant à l'écran)
  async function dire(texte, { force = false, nom = voixNom, onSeg = null } = {}) {
    const segs = (Array.isArray(texte) ? texte : [texte]).map(t => String(t || "").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!segs.length || (!voixOn && !force)) return;
    tais();
    const moi = ++tour;
    parleJusqua = Infinity;
    try { unlock(); } catch {}
    segs.slice(0, 2).forEach(t => charge(t, nom));
    for (let i = 0; i < segs.length; i++) {
      if (moi !== tour) return;
      if (segs[i + 1]) charge(segs[i + 1], nom);
      const buf = await charge(segs[i], nom);
      if (moi !== tour) return;
      try { onSeg?.(i); } catch {}
      if (buf) {
        await new Promise(res => {
          const c = ctx(), s = c.createBufferSource();
          s.buffer = buf; s.connect(c.destination); s.onended = res; source = s; s.start();
          // si le son reste bloqué (contexte audio suspendu), on n'attend pas indéfiniment : le micro des jeux resterait sourd
          setTimeout(res, buf.duration * 1000 + 1500);
        });
      } else {
        manque.add(segs[i]);
        await repli(segs[i]);
      }
    }
    if (moi === tour) { source = null; parleJusqua = performance.now() + 350; }
  }
  // vrai pendant que la voix parle (et un court instant après) : le micro du mode écoute l'ignore
  const parle = () => performance.now() < parleJusqua || !!synth?.speaking;

  window.Sons = {
    ctx, unlock, cling, bloc, fanfare, alarme, gamme, noteCours, musiqueCours, timbre, dire, tais, parle, guitare, manque,
    get sfx() { return sfxOn; }, set sfx(v) { sfxOn = !!v; write("maguitare:sfx", sfxOn); },
    get voix() { return voixOn; }, set voix(v) { voixOn = !!v; write("maguitare:voix", voixOn); if (!voixOn) tais(); },
    get voixNom() { return voixNom; }, set voixNom(v) { voixNom = String(v || "siwis"); try { localStorage.setItem("maguitare:voixNom", voixNom); } catch {} tais(); },
  };
})();
