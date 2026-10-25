/* Jeux à niveaux : Notes du manche, Gammes, Pentatonique, Accords. Le même moteur pour les quatre :
   - une manche = 10 questions ; 8 justes ouvrent le niveau suivant, et tous les niveaux restent rejouables ;
   - ce que tu rates revient plus souvent (boîtes de Leitner), et 3 questions sur 10 reprennent les niveaux d'avant ;
   - chrono dès le niveau 5 (8 s, puis 3 s au niveau 10) ;
   - le niveau 10 sert à l'entretien : sans fin, 3 vies, il garde ton record.
   Une question est juste du premier coup, sans indice ni chrono dépassé. */
(() => {
  "use strict";
  const J = window.Jeux; if (!J?.base) return;
  const { Board, el, FR, NATURALS, PC, OPEN, NOM_CORDE, pcOf, shuffle, pick, son, nomsBtn } = J.base;
  const corde = s => "la corde de " + NOM_CORDE[s];
  const BEMOL = { 1: "Ré♭", 3: "Mi♭", 6: "Sol♭", 8: "La♭", 10: "Si♭" };
  // noms usuels des tonalités et des accords
  const TON = ["Do", "Do♯", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si"];
  const parle = n => n.replace("♯", " dièse").replace("♭", " bémol");
  const nomDe = m => FR[((m % 12) + 12) % 12];
  const CHRONO = [0, 0, 0, 0, 8, 7, 6, 5, 4, 3]; // secondes par question, du niveau 1 au niveau 10
  const STR = [6, 5, 4, 3, 2, 1];

  // ---------- Mémoire : rangée dans l'état de l'app (et donc dans la sauvegarde) ----------
  let local = null;
  const mem = () => { const m = J.memoire?.() || (local ||= {}); if (m.v !== 2) migre(m); return m; };
  const famMem = f => { const m = mem(); return (m[f] ||= { max: 1, best: {}, items: {} }); };
  const sauve = () => { try { J.sauve?.(); } catch {} };
  // boîte 0 = jamais vu, 1 = raté (revient souvent) … 5 = solide (revient rarement)
  const POIDS = [2, 6, 4, 2, 1, 0.5];
  const poids = (f, k) => POIDS[famMem(f).items[k]?.[0] || 0];
  function retenir(f, k, ok, lvl) {
    const it = famMem(f).items, b = it[k]?.[0] || 0;
    it[k] = [ok ? (b === 1 ? 2 : Math.min(5, Math.max(3, b + 1))) : 1, new Date().toISOString().slice(0, 10), lvl];
  }
  // n éléments tirés au sort, pondérés par leur boîte, jamais deux fois de suite le même
  function tirage(f, items, n) {
    const out = []; let prev = null;
    for (let i = 0; i < n && items.length; i++) {
      const cand = items.length > 1 ? items.filter(x => x.key !== prev) : items;
      const w = cand.map(x => poids(f, x.key)), tot = w.reduce((a, b) => a + b, 0);
      let r = Math.random() * tot, j = 0;
      while (r > w[j] && j < w.length - 1) r -= w[j++];
      out.push(cand[j]); prev = cand[j].key;
    }
    return out;
  }

  // ---------- Le son d'un accord : gratté de la corde grave à l'aiguë ----------
  function gratte(fr) {
    if (!son.get()) return;
    try {
      const S = window.Sons; S.unlock();
      const t0 = S.ctx().currentTime + 0.05; let i = 0;
      STR.forEach((s, k) => { if (fr[k] >= 0) S.guitare.note(OPEN[s] + fr[k], { at: t0 + (i++) * 0.045, gain: 0.65, dur: 2.2 }); });
    } catch {}
  }

  // =====================================================================
  // 1. Notes du manche
  // =====================================================================
  const nat = (s, f) => NATURALS.includes(FR[pcOf(s, f)]);
  // jamais la case 0 : le nom de la corde à vide est écrit au bout du manche
  const casesDe = (cordes, fmax, ok) => cordes.flatMap(s => Array.from({ length: fmax }, (_, f) => f + 1).filter(f => ok(s, f)).map(f => `m:${s}:${f}`));
  const MANCHE = [
    { txt: "Mi grave, cases 1 à 5, avec des repères", pool: () => casesDe([6], 5, nat) },
    { txt: "Mi grave, cases 1 à 12", pool: () => casesDe([6], 12, nat) },
    { txt: "Corde de La", pool: () => casesDe([5], 12, nat) },
    { txt: "Corde de Ré", pool: () => casesDe([4], 12, nat) },
    { txt: "Cordes de Sol et de Si", pool: () => casesDe([3, 2], 12, nat) },
    { txt: "Mi aigu", pool: () => casesDe([1], 12, nat) },
    { txt: "Dièses et bémols, sur toutes les cordes", pool: () => casesDe(STR, 12, (s, f) => !nat(s, f)) },
    { txt: "Toutes les cordes mélangées", pool: () => casesDe(STR, 12, () => true) },
    { txt: "Octaves : la même note, deux cordes plus loin", pool: () => [6, 5, 4, 3].flatMap(s => Array.from({ length: 9 }, (_, f) => f + 1).filter(f => nat(s, f)).map(f => `o:${s}:${f}`)) },
    { txt: "Tout le manche, sans indice", pool: () => [...MANCHE[7].pool(), ...MANCHE[8].pool()] },
  ];
  const choixNotes = chrom => chrom
    ? FR.map((n, pc) => ({ label: n, sub: BEMOL[pc], val: pc }))
    : NATURALS.map(n => ({ label: n, val: PC[n] }));
  function qManche(key, lvl, i) {
    const [t, s0, f0] = key.split(":"), s = +s0, f = +f0;
    const rep = lvl <= 2 ? [[s, 0, "rep", NOM_CORDE[s].split(" ")[0]]] : [];
    if (t === "o") {
      const n = nomDe(OPEN[s] + f);
      return { key, type: "cases", texte: `Trouve l'octave de ce ${n}`, voix: `Trouve l'octave de ce ${n}`, src: [s, f, n], targets: [[s - 2, f + (s <= 4 ? 3 : 2)]],
        aide: `Deux cordes plus loin vers l'aigu : +2 cases depuis le Mi grave ou le La, +3 depuis le Ré ou le Sol.` };
    }
    const pc = pcOf(s, f), chrom = lvl >= 7;
    if (i % 2 === 0) {
      return { key, type: "choix", texte: `Quelle est cette note, sur ${corde(s)} ?`, voix: `Quelle est cette note, sur ${corde(s)} ?`, ask: [s, f], choix: choixNotes(chrom), bonne: pc,
        donnees: f ? rep : [], aide: `Repère : à vide, ${corde(s)} donne un ${NOM_CORDE[s].split(" ")[0]}. Cette case est la case ${f}.` };
    }
    // l'inverse : le nom est donné, il faut toucher toutes ses cases sur la corde
    const n = BEMOL[pc] && Math.random() < 0.5 ? BEMOL[pc] : FR[pc];
    const targets = []; for (let k = 1; k <= 12; k++) if (pcOf(s, k) === pc) targets.push([s, k]);
    return { key, type: "cases", texte: `Trouve tous les ${n} sur ${corde(s)}`, voix: `Trouve tous les ${n} sur ${corde(s)}`,
      targets, pc, cordes: [s], donnees: pcOf(s, 0) === pc ? [] : rep }; // le repère de la corde à vide ne doit pas donner la réponse
  }

  // =====================================================================
  // 2. Gammes, et 3. Pentatonique : replacer les notes manquantes d'une position
  // =====================================================================
  const PENTA = [9, 0, 2, 4, 7], DO = [0, 2, 4, 5, 7, 9, 11];
  const POS = {
    p1: { genre: "penta", n: 1, pcs: PENTA, win: [5, 8], ton: 9 },
    p2: { genre: "penta", n: 2, pcs: PENTA, win: [7, 10], ton: 9 },
    p3: { genre: "penta", n: 3, pcs: PENTA, win: [9, 13], ton: 9 },
    p4: { genre: "penta", n: 4, pcs: PENTA, win: [0, 3], ton: 9 }, // une octave plus bas, comme dans le cours
    p5: { genre: "penta", n: 5, pcs: PENTA, win: [2, 5], ton: 9 },
    do: { genre: "majeur", pos: "position ouverte", pcs: DO, win: [0, 3], de: 48, a: 67, ton: 0, fixe: true }, // avec des cordes à vide : ne se transpose pas
    sol: { genre: "majeur", pos: "position fixe", pcs: [7, 9, 11, 0, 2, 4, 6], win: [2, 5], de: 43, a: 67, ton: 7 },
    la: { genre: "majeur", pos: "position fixe", pcs: [9, 11, 1, 2, 4, 6, 8], win: [4, 7], de: 45, a: 69, ton: 9 },
    lam: { genre: "mineur", pos: "position fixe", pcs: DO, win: [4, 8], de: 45, a: 69, ton: 9 },
  };
  const nomPos = (P, k = 0) => {
    const t = TON[(P.ton + k + 120) % 12];
    return P.genre === "penta" ? `Penta de ${t} mineur, position ${P.n}` : P.genre === "majeur" ? `${t} majeur, ${P.pos}` : `${t} mineur naturelle, ${P.pos}`;
  };
  // les cases d'une position ; k = transposition en demi-tons
  function casesPos(P, k = 0) {
    const out = [];
    for (const s of STR) for (let f = P.win[0] + k; f <= P.win[1] + k; f++) {
      const m = OPEN[s] + f - k;
      if (f >= 0 && P.pcs.includes(((m % 12) + 12) % 12) && (P.de == null || (m >= P.de && m <= P.a))) out.push([s, f]);
    }
    return out;
  }
  // un niveau : ses positions, le nombre de notes manquantes (0 = toute la position), le nom des notes affiché ou non, transposé ou non
  const NP = (txt, ids, trous, noms, tr = false) => ({ txt, pool: () => ids.map(id => "g:" + id), trous, noms, tr });
  const GAMMES = [
    NP("Do majeur : une note manquante", ["do"], 1, true),
    NP("Do majeur : trois notes manquantes", ["do"], 3, true),
    NP("Do majeur, sans le nom des notes", ["do"], 4, false),
    NP("Sol majeur en position fixe (index en case 2)", ["sol"], 2, true),
    NP("Sol majeur, sans le nom des notes", ["sol"], 3, false),
    NP("La majeur : la même forme, deux cases plus haut", ["la"], 3, true),
    NP("Do, Sol et La majeur mélangés", ["do", "sol", "la"], 4, false),
    NP("La mineur naturelle (cases 4 à 8)", ["lam"], 4, true),
    NP("Les formes fixes, dans d'autres tonalités", ["sol", "la", "lam"], 4, false, true),
    NP("Une gamme au hasard, en entier, de mémoire", ["do", "sol", "la", "lam"], 0, false, true),
  ];
  const PENTAS = [
    NP("Position 1 : une note manquante", ["p1"], 1, true),
    NP("Position 1 : trois notes manquantes", ["p1"], 3, true),
    NP("Position 2 (cases 7 à 10)", ["p2"], 2, true),
    NP("Positions 1 et 2, sans le nom des notes", ["p1", "p2"], 3, false),
    NP("Position 3 (cases 9 à 13)", ["p3"], 3, true),
    NP("Positions 1, 2 et 3 mélangées", ["p1", "p2", "p3"], 4, false),
    NP("Positions 4 et 5, vers le sillet", ["p4", "p5"], 3, true),
    NP("Les 5 positions", ["p1", "p2", "p3", "p4", "p5"], 5, false),
    NP("Les 5 positions, dans d'autres tonalités", ["p1", "p2", "p3", "p4", "p5"], 4, false, true),
    NP("Une position au hasard, en entier, de mémoire, dans une autre tonalité", ["p1", "p2", "p3", "p4", "p5"], 0, false, true),
  ];
  const qPos = NIV => (key, lvl) => {
    const L = NIV[lvl - 1], P = POS[key.slice(2)];
    const k = L.tr && !P.fixe ? pick([-2, -1, 1, 2, 3, 4, 5].filter(d => P.win[0] + d >= 0 && P.win[1] + d <= 15)) : 0;
    const all = casesPos(P, k), ton = (P.ton + k + 120) % 12;
    const estTon = ([s, f]) => pcOf(s, f) === ton;
    const trous = L.trous ? shuffle(all.filter(c => !estTon(c))).slice(0, L.trous) : all.filter(c => !estTon(c));
    const vu = new Set(trous.map(c => c.join(":")));
    const nom = nomPos(P, k), n = trous.length;
    return { key, type: "cases", targets: trous, win: [P.win[0] + k, P.win[1] + k], frets: Math.max(12, P.win[1] + k), pause: true,
      texte: L.trous ? `${nom} : replace ${n > 1 ? `les ${n} notes manquantes` : "la note manquante"}` : `${nom} : place toutes les notes, de mémoire`,
      voix: !L.trous ? "Place toute la position, de mémoire." : n > 1 ? "Replace les notes manquantes." : "Replace la note manquante.",
      donnees: all.filter(c => !vu.has(c.join(":"))).map(([s, f]) => [s, f, estTon([s, f]) ? "root" : "given", L.noms || estTon([s, f]) ? nomDe(OPEN[s] + f) : ""]),
      aide: `Les points pleins sont les ${TON[ton]}, la tonique. Les notes de la gamme : ${P.pcs.map(p => TON[(p + k + 120) % 12]).join(", ")}.` };
  };

  // =====================================================================
  // 4. Accords : du diagramme vers le nom, puis l'inverse, puis à l'oreille
  // =====================================================================
  const Q = { maj: "", min: "m", "7": "7", maj7: "maj7", m7: "m7" };
  const QP = { maj: "", min: " mineur", "7": " sept", maj7: " majeur sept", m7: " mineur sept" };
  const ouverts = {
    do: ["Do", "x32010", "maj"], re: ["Ré", "xx0232", "maj"], mi: ["Mi", "022100", "maj"], sol: ["Sol", "320003", "maj"], la: ["La", "x02220", "maj"],
    lam: ["La", "x02210", "min"], rem: ["Ré", "xx0231", "min"], mim: ["Mi", "022000", "min"],
    do7: ["Do", "x32310", "7"], re7: ["Ré", "xx0212", "7"], mi7: ["Mi", "020100", "7"], sol7: ["Sol", "320001", "7"], la7: ["La", "x02020", "7"], si7: ["Si", "x21202", "7"],
    domaj7: ["Do", "x32000", "maj7"], famaj7: ["Fa", "xx3210", "maj7"], solmaj7: ["Sol", "320002", "maj7"], remaj7: ["Ré", "xx0222", "maj7"], lamaj7: ["La", "x02120", "maj7"],
    lam7: ["La", "x02010", "m7"], rem7: ["Ré", "xx0211", "m7"], mim7: ["Mi", "022030", "m7"],
  };
  // c:<id> = accord ouvert ; E:<case>:<maj|min> = barré forme Mi ; A:<case>:<maj|min> = barré forme La
  function accord(key) {
    const [t, a, b] = key.split(":");
    if (t === "c") { const [r, code, q] = ouverts[a]; return { r, q, fr: [...code].map(c => (c === "x" ? -1 : +c)) }; }
    const c = +a, q = b;
    if (t === "E") return { r: TON[(OPEN[6] + c) % 12], q, fr: q === "maj" ? [c, c + 2, c + 2, c + 1, c, c] : [c, c + 2, c + 2, c, c, c], barre: c };
    return { r: TON[(OPEN[5] + c) % 12], q, fr: q === "maj" ? [-1, c, c + 2, c + 2, c + 2, c] : [-1, c, c + 2, c + 2, c + 1, c], barre: c };
  }
  const nomAcc = A => A.r + Q[A.q];
  const C = (...ids) => ids.map(id => "c:" + id);
  const barres = (forme, cases) => cases.flatMap(c => [`${forme}:${c}:maj`, `${forme}:${c}:min`]);
  const ACCORDS = [
    { txt: "Les accords majeurs ouverts : quel est cet accord ?", pool: () => C("do", "re", "mi", "sol", "la"), type: "nom" },
    { txt: "Les accords mineurs ouverts", pool: () => C("lam", "rem", "mim"), type: "nom" },
    { txt: "À partir du nom, place l'accord sur le manche", pool: () => C("do", "re", "mi", "sol", "la", "lam", "rem", "mim").map(k => "p" + k), type: "placer" },
    { txt: "Les accords de 7e", pool: () => C("do7", "re7", "mi7", "sol7", "la7", "si7"), type: "mix" },
    { txt: "Le Fa barré et la forme Mi (cases 1, 3 et 5)", pool: () => barres("E", [1, 3, 5]), type: "nom" },
    { txt: "Les barrés forme La (cases 1 à 3)", pool: () => barres("A", [1, 2, 3]), type: "nom" },
    { txt: "Les barrés, à n'importe quelle case", pool: () => [...barres("E", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), ...barres("A", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])], type: "nom" },
    { txt: "À l'oreille : majeur ou mineur ?", pool: () => [...C("do", "re", "mi", "sol", "la", "lam", "rem", "mim"), ...barres("E", [1, 3, 5]), ...barres("A", [1, 2, 3])].map(k => "o" + k), type: "oreille" },
    { txt: "Les accords maj7 et m7, ceux de la bossa", pool: () => C("domaj7", "famaj7", "solmaj7", "remaj7", "lamaj7", "lam7", "rem7", "mim7"), type: "mix" },
    { txt: "Tout mélangé", pool: () => [...ACCORDS.slice(0, 9).flatMap(L => L.pool())], type: "mix" },
  ];
  // de faux noms crédibles : la même forme une ou deux cases à côté, ou l'autre couleur (majeur / mineur)
  function leurres(key, A) {
    const [t, a] = key.split(":"), out = new Set();
    if (t !== "c") {
      const c = +a;
      [c - 2, c - 1, c + 1, c + 2].filter(x => x >= 1 && x <= 10).forEach(x => out.add(nomAcc(accord(`${t}:${x}:${A.q}`))));
      out.add(nomAcc(accord(`${t}:${c}:${A.q === "maj" ? "min" : "maj"}`)));
    } else {
      Object.keys(ouverts).map(id => accord("c:" + id)).filter(B => B.q === A.q || B.r === A.r).forEach(B => out.add(nomAcc(B)));
    }
    out.delete(nomAcc(A));
    return shuffle([...out]).slice(0, 3);
  }
  function qAccord(key, lvl, i) {
    const L = ACCORDS[lvl - 1];
    let k = key, type = L.type;
    if (key[0] === "p") { k = key.slice(1); type = "placer"; }
    else if (key[0] === "o") { k = key.slice(1); type = "oreille"; }
    else if (type === "mix") type = k.startsWith("c:") && i % 2 ? "placer" : "nom";
    const A = accord(k), nom = nomAcc(A), grave = A.fr.findIndex(f => f >= 0);
    const diag = A.fr.map((f, j) => [STR[j], f < 0 ? 0 : f, f < 0 ? "mute" : f === 0 ? "open" : "given", f < 0 ? "×" : ""]);
    const aide = `La note la plus grave jouée, sur ${corde(STR[grave])}, est un ${nomDe(OPEN[STR[grave]] + A.fr[grave])} : c'est souvent le nom de l'accord.`;
    if (type === "oreille") {
      return { key, type: "choix", texte: "Écoute : majeur ou mineur ?", voix: "Écoute : majeur ou mineur ?", oreille: A.fr, choix: [{ label: "Majeur", val: "maj" }, { label: "Mineur", val: "min" }], bonne: A.q,
        fin: diag, apres: `C'était ${nom}.`, aide: "Un accord majeur sonne clair et joyeux ; un mineur sonne plus sombre, plus triste." };
    }
    if (type === "placer") {
      return { key, type: "cases", texte: `Place l'accord de ${nom} sur le manche`, voix: `Place l'accord de ${parle(A.r)}${QP[A.q]}.`,
        targets: A.fr.map((f, j) => [STR[j], f]).filter(([, f]) => f > 0), fin: diag, son: A.fr,
        aide: `Touche chaque case où un doigt appuie (les cordes à vide ne comptent pas). ${aide}` };
    }
    return { key, type: "choix", texte: "Quel est cet accord ?", voix: "Quel est cet accord ?", donnees: diag, son: A.fr,
      choix: shuffle([nom, ...leurres(k, A)]).map(n => ({ label: n, val: n })), bonne: nom,
      aide: A.barre ? `Barré case ${A.barre} : la note de la corde la plus grave du barré donne le nom. ${aide}` : aide };
  }

  // =====================================================================
  // Les familles, et le moteur commun
  // =====================================================================
  // le nom lisible d'une question, pour le compte-rendu
  function libelle(f, key) {
    const [t, a, b] = key.split(":");
    if (f === "manche") return t === "o" ? `Octave du ${nomDe(OPEN[+a] + +b)} (${NOM_CORDE[+a]}, case ${b})` : `${nomDe(OPEN[+a] + +b)} sur ${NOM_CORDE[+a]} (case ${b})`;
    if (f === "gammes" || f === "penta") return POS[a] ? nomPos(POS[a]) : key;
    if (f === "accords") {
      const k = key[0] === "p" || key[0] === "o" ? key.slice(1) : key, A = accord(k);
      const nom = nomAcc(A) + (A.barre ? ` (barré case ${A.barre})` : "");
      return key[0] === "p" ? `Placer ${nom}` : key[0] === "o" ? `${nom} à l'oreille` : nom;
    }
    return key;
  }
  const FAMILLES = {
    manche: { titre: "Notes du manche", niveaux: MANCHE, q: qManche },
    gammes: { titre: "Gammes", niveaux: GAMMES, q: qPos(GAMMES) },
    penta: { titre: "Pentatonique", niveaux: PENTAS, q: qPos(PENTAS) },
    accords: { titre: "Accords", niveaux: ACCORDS, q: qAccord },
  };
  // v2 (24 octobre 2026) : « Gammes et penta » devient deux jeux, Gammes et Pentatonique, avec leurs propres niveaux
  function migre(m) {
    m.v = 2;
    const g = m.gammes; if (!g?.items) return;
    const items = { gammes: {}, penta: {} };
    for (const [k, v] of Object.entries(g.items)) {
      const f = k.startsWith("g:p") ? "penta" : "gammes";
      items[f][k] = [v[0], v[1], FAMILLES[f].niveaux.findIndex(L => L.pool().includes(k)) + 1 || 1];
    }
    m.gammes = { max: 1, best: {}, items: items.gammes };
    m.penta = { max: 1, best: {}, items: items.penta };
  }
  const debloque = f => Math.max(famMem(f).max || 1, J.niveauCours?.(f) || 1);
  const etat = f => ({ max: debloque(f), best: famMem(f).best || {} });

  // 10 questions : 7 du niveau, 3 des niveaux d'avant (rappel), pondérées par ce que tu rates
  function serie(f, lvl) {
    const F = FAMILLES[f];
    const neuf = F.niveaux[lvl - 1].pool().map(key => ({ f, key, lvl }));
    const vus = new Set(neuf.map(x => x.key));
    const avant = lvl < 10 ? F.niveaux.slice(0, lvl - 1).flatMap((L, i) => L.pool().filter(k => !vus.has(k)).map(key => ({ f, key, lvl: i + 1 }))) : [];
    const nr = avant.length ? 3 : 0;
    const a = tirage(f, neuf, 10 - nr), b = tirage(f, avant, nr);
    b.forEach((x, i) => a.splice(2 + i * 3, 0, x)); // une question de rappel toutes les 3
    return a;
  }

  // ---------- La feuille du jeu ----------
  let dlg = null, run = null;
  const stop = () => { if (run) { clearTimeout(run.timer); clearTimeout(run.chrono); run = null; } window.Sons?.tais(); };
  function feuille() {
    if (!dlg) { dlg = el("dialog", { class: "sheet jeu-sheet niv-sheet", "aria-labelledby": "nivTitre" }); document.body.append(dlg); dlg.addEventListener("close", () => { if (!dlg.open) stop(); }); } // rouvert entre-temps : on garde la partie
    return dlg;
  }
  const say = t => { if (t) window.Sons?.dire(t); };

  // opts : { revision: [{ f, key, lvl }], onDone(res) }
  function ouvrir(f, lvl, opts = {}) {
    const d = feuille(); stop();
    try { window.Sons?.unlock(); } catch {}
    const rev = opts.revision, sansFin = !rev && lvl === 10;
    const queue = rev ? rev.slice() : sansFin ? [] : serie(f, lvl);
    const pool10 = sansFin ? FAMILLES[f].niveaux[9].pool().map(key => ({ f, key, lvl: 10 })) : null;
    const vertical = window.matchMedia("(max-width: 700px)").matches;
    const L = rev ? null : FAMILLES[f].niveaux[lvl - 1];

    const close = el("button", { class: "icon-btn", type: "button", "aria-label": "Fermer", text: "✕", onclick: () => d.close() });
    const sound = el("button", { class: "icon-btn", type: "button", title: "Son de la guitare", "aria-pressed": String(son.get()), text: son.get() ? "🔊" : "🔈" });
    sound.addEventListener("click", () => { son.set(!son.get()); sound.textContent = son.get() ? "🔊" : "🔈"; sound.setAttribute("aria-pressed", String(son.get())); });
    const voixBtn = window.Sons ? el("button", { class: "icon-btn", type: "button", title: "Voix : lit les questions", "aria-pressed": String(Sons.voix), text: Sons.voix ? "🗣️" : "🤐" }) : null;
    voixBtn?.addEventListener("click", () => { Sons.voix = !Sons.voix; voixBtn.textContent = Sons.voix ? "🗣️" : "🤐"; voixBtn.setAttribute("aria-pressed", String(Sons.voix)); });
    const q = el("p", { class: "jeu-q" }), prog = el("span", { class: "jeu-prog" }), fb = el("p", { class: "jeu-fb", role: "status" });
    const chronoBar = el("div", { class: "niv-chrono", hidden: true }, el("i"));
    const hintBtn = el("button", { class: "btn small", type: "button", text: "💡 Indice" });
    const solveBtn = el("button", { class: "btn small", type: "button", text: "Résoudre" });
    const nextBtn = el("button", { class: "btn small primary", type: "button", text: "Suivant →", hidden: true });
    const ecoute = el("button", { class: "btn niv-ecoute", type: "button", hidden: true }, "🔊 Réécouter");
    const actions = el("div", { class: "jeu-actions" }, hintBtn, solveBtn, nextBtn);
    const boardHost = el("div", { class: "jeu-board-wrap" + (vertical ? " vertical" : "") });
    const answers = el("div", { class: "jeu-answers", hidden: true });
    const titre = rev ? "Révision du jour" : L.txt;
    const eyebrow = rev ? "Ce que tu as raté ces derniers jours" : `${FAMILLES[f].titre} · niveau ${lvl}${sansFin ? " · entretien" : ""}`;
    d.replaceChildren(el("div", { class: "sheet-in jeu-in" },
      el("div", { class: "sheet-head" }, el("div", {}, el("span", { class: "eyebrow", text: eyebrow }), el("h2", { id: "nivTitre", text: titre })), el("div", { class: "jeu-tools" }, nomsBtn?.(), voixBtn, sound, close)),
      el("p", { class: "muted small", text: rev ? "10 questions sur les notes, gammes, positions et accords que tu as ratés. Réussies, elles reviendront moins souvent."
        : sansFin ? "Sans fin : tu as 3 vies, et ton record est gardé. Le chrono est court : c'est l'entretien." : "10 questions. 8 justes du premier coup, sans indice, ouvrent le niveau suivant." + (CHRONO[lvl - 1] ? ` Chrono : ${CHRONO[lvl - 1]} s par note.` : "") }),
      el("div", { class: "jeu-bar" }, q, prog), chronoBar, actions, fb, ecoute, boardHost, answers));
    if (!d.open) d.showModal();

    let board = null, frets = 0;
    // pour le compte-rendu : essais (touches et réponses), notes demandées, fautes par question
    run = { i: 0, ok: 0, vies: 3, serie: 0, faits: [], erreurs: 0, essais: 0, notes: 0, fautes: {}, t0: Date.now(), timer: null, chrono: null, locked: false, help: false, err: false, found: new Set(), hintLvl: 0, remis: new Set() };
    const me = run;
    const cur = () => run?.cur;
    const setFb = (t, cls = "") => { fb.textContent = t; fb.className = "jeu-fb" + (cls ? " " + cls : ""); };
    const k2 = (s, fr) => s + ":" + fr;
    const reste = Q => Q.targets.filter(([s, fr]) => !run.found.has(k2(s, fr)));
    const secs = Q => {
      const base = rev ? 0 : CHRONO[lvl - 1];
      return base ? base * (Q.type === "cases" ? Math.max(1, Math.ceil(Q.targets.length * 0.6)) : 1) : 0;
    };
    const dessine = cells => cells?.forEach(([s, fr, st, lab]) => board.set(s, fr, st, lab));

    function poser() {
      const item = sansFin ? tirage(f, pool10, 1)[0] : queue[run.i];
      const F = FAMILLES[item.f], Q = F.q(item.key, item.lvl, run.i);
      Object.assign(run, { cur: { ...Q, item }, locked: false, help: false, err: false, found: new Set(), hintLvl: 0 });
      run.notes += Q.type === "cases" ? Q.targets.length : 1;
      const fr = Q.frets || 12;
      if (!board || fr !== frets) { board = Board(boardHost, { vertical, frets: fr }); frets = fr; board.onClick(touche); }
      board.clear(); board.dim(Q.cordes || null, Q.win || null);
      boardHost.hidden = !!Q.oreille; ecoute.hidden = !Q.oreille;
      dessine(Q.donnees);
      if (Q.src) { board.set(Q.src[0], Q.src[1], "src", Q.src[2]); J.base.play(OPEN[Q.src[0]] + Q.src[1]); }
      if (Q.ask) board.set(Q.ask[0], Q.ask[1], "ask", "?");
      if (Q.son && Q.type === "choix") gratte(Q.son);
      if (Q.oreille) gratte(Q.oreille);
      answers.hidden = Q.type !== "choix";
      answers.classList.toggle("douze", Q.choix?.length === 12);
      answers.classList.toggle("deux", Q.choix?.length <= 4);
      if (Q.type === "choix") answers.replaceChildren(...Q.choix.map(c => el("button", { type: "button", class: "btn", "data-v": String(c.val), onclick: () => repond(c.val) }, c.label, c.sub ? el("small", { text: c.sub }) : null)));
      q.textContent = Q.texte;
      prog.textContent = sansFin ? `Série ${run.serie} · ${"♥".repeat(run.vies)}${"♡".repeat(3 - run.vies)}` : `${run.i + 1} / ${queue.length}`;
      setFb(rev ? `${FAMILLES[item.f].titre} · niveau ${item.lvl}` : "");
      hintBtn.hidden = solveBtn.hidden = false; hintBtn.disabled = lvl === 10 && !rev; nextBtn.hidden = true;
      if (hintBtn.disabled) hintBtn.hidden = true;
      say(Q.voix);
      // le chrono
      clearTimeout(run.chrono);
      const t = secs(Q);
      chronoBar.hidden = !t;
      if (t) {
        const bar = chronoBar.firstChild;
        bar.style.transition = "none"; bar.style.width = "100%"; void bar.offsetWidth;
        bar.style.transition = `width ${t}s linear`; bar.style.width = "0%";
        run.chrono = setTimeout(() => { if (run === me && !run.locked) rate("Temps écoulé !"); }, t * 1000);
      }
    }

    // la question est finie : juste (du premier coup, sans aide) ou ratée
    function fini(juste) {
      const Q = cur(); if (!Q || run.locked) return;
      run.locked = true; clearTimeout(run.chrono);
      const chronoI = chronoBar.firstChild; chronoI.style.width = getComputedStyle(chronoI).width; chronoI.style.transition = "none";
      const bon = juste && !run.help && !run.err;
      retenir(Q.item.f, Q.item.key, bon, Q.item.lvl);
      run.faits.push(bon);
      if (!bon) { const fk = Q.item.f + "|" + Q.item.key; run.fautes[fk] = (run.fautes[fk] || 0) + 1; }
      if (bon) { run.ok++; run.serie++; } else if (sansFin) run.vies--;
      // une question ratée revient 3 questions plus loin (une fois)
      if (!bon && !sansFin && !run.remis.has(Q.item.key) && run.i + 3 < queue.length) { run.remis.add(Q.item.key); queue[run.i + 3] = Q.item; }
      if (Q.fin) { board.clear(); dessine(Q.fin); boardHost.hidden = false; }
      if (Q.son && Q.type === "cases") gratte(Q.son);
      hintBtn.hidden = solveBtn.hidden = true;
      sauve();
      const delai = bon ? 950 : 2200;
      if (sansFin && run.vies <= 0) { run.timer = setTimeout(() => run === me && finir(), delai); return; }
      const suite = () => { if (run !== me) return; run.i++; if (!sansFin && run.i >= queue.length) finir(); else poser(); };
      // gammes et penta : le manche reste vide un moment, pour que le cerveau oublie la position d'avant
      const blanc = () => { if (run !== me) return; board.clear(); board.dim(null, null); setFb(""); q.textContent = "…"; run.timer = setTimeout(suite, 1200); };
      run.timer = setTimeout(Q.pause && !(sansFin && run.vies <= 0) ? blanc : suite, delai);
    }
    function rate(msg) {
      const Q = cur(); if (!Q || run.locked) return;
      run.err = true;
      if (Q.type === "choix") {
        answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.dataset.v === String(Q.bonne)) b.classList.add("good"); });
        if (Q.ask) board.set(Q.ask[0], Q.ask[1], "sol", nomDe(OPEN[Q.ask[0]] + Q.ask[1]));
        setFb(`${msg} ${Q.apres || `C'était : ${Q.choix.find(c => c.val === Q.bonne)?.label}.`}`, "bad");
      } else {
        reste(Q).forEach(([s, fr]) => board.set(s, fr, "sol", nomDe(OPEN[s] + fr)));
        setFb(`${msg} Voilà où étaient ${reste(Q).length > 1 ? "les notes" : "la note"}.`, "bad");
      }
      fini(false);
    }

    function repond(v) {
      const Q = cur(); if (!Q || run.locked) return;
      const ok = String(v) === String(Q.bonne);
      run.essais++; if (!ok) run.erreurs++;
      answers.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.dataset.v === String(Q.bonne)) b.classList.add("good"); else if (b.dataset.v === String(v)) b.classList.add("bad"); });
      if (Q.ask) { board.set(Q.ask[0], Q.ask[1], ok ? "ok" : "bad", nomDe(OPEN[Q.ask[0]] + Q.ask[1])); J.base.play(OPEN[Q.ask[0]] + Q.ask[1]); }
      // la corde jouée suffit : pas de « cling » par-dessus (seulement quand rien ne sonne)
      if (ok) { setFb(run.help ? "Oui ! (avec un indice, elle reviendra)" : "Oui !", "good"); if (!Q.ask) window.Sons?.cling(); }
      else { run.err = true; setFb(`Non. ${Q.apres || `C'était : ${Q.choix.find(c => String(c.val) === String(Q.bonne))?.label}.`}`, "bad"); }
      fini(ok);
    }
    function touche(s, fr) {
      const Q = cur(); if (!Q || run.locked || Q.type !== "cases") return;
      if (Q.src && s === Q.src[0] && fr === Q.src[1]) return;
      if (run.found.has(k2(s, fr)) || (Q.donnees || []).some(([a, b, st]) => a === s && b === fr && st !== "rep")) return;
      // la bonne note hors du jeu (la corde à vide) : ce n'est pas une faute
      if (Q.pc != null && pcOf(s, fr) === Q.pc && !Q.targets.some(([a, b]) => a === s && b === fr)) { J.base.play(OPEN[s] + fr); return setFb(`Oui, c'est un ${nomDe(OPEN[s] + fr)}, mais à vide : cherche-le sur les cases.`, "hint"); }
      run.essais++;
      if (Q.targets.some(([a, b]) => a === s && b === fr)) {
        run.found.add(k2(s, fr)); board.set(s, fr, "ok", nomDe(OPEN[s] + fr)); J.base.play(OPEN[s] + fr);
        const r = reste(Q).length;
        if (r) { setFb(run.err ? `Oui. Encore ${r}.` : `Oui ! Encore ${r}.`, "good"); return; }
        setFb(run.err || run.help ? "Trouvé ! Elle reviendra pour être sûre." : "Parfait !", "good");
        return fini(true);
      }
      run.err = true; run.erreurs++;
      const n = nomDe(OPEN[s] + fr);
      board.set(s, fr, "bad", n); J.base.play(OPEN[s] + fr);
      setFb(`Ça, c'est un ${n}.`, "bad");
      setTimeout(() => { if (run === me && !run.found.has(k2(s, fr)) && !run.locked) board.set(s, fr, "", ""); }, 900);
    }

    hintBtn.addEventListener("click", () => {
      const Q = cur(); if (!Q || run.locked) return;
      run.help = true; const n = run.hintLvl++;
      if (Q.type === "choix") {
        if (n === 0 && Q.aide) return setFb(Q.aide, "hint");
        const keep = new Set([String(Q.bonne), ...shuffle(Q.choix.map(c => String(c.val)).filter(v => v !== String(Q.bonne))).slice(0, Q.choix.length > 4 ? 2 : 1)]);
        answers.querySelectorAll("button").forEach(b => { if (!keep.has(b.dataset.v)) b.disabled = true; });
        setFb("J'ai retiré des mauvaises réponses.", "hint"); hintBtn.disabled = true;
        return;
      }
      if (n === 0 && Q.aide) return setFb(Q.aide, "hint");
      const [s, fr] = reste(Q)[0];
      board.clearState("hint");
      for (let x = Math.max(0, fr - 1); x <= fr + 1; x++) if (!run.found.has(k2(s, x)) && !(Q.donnees || []).some(([a, b, st]) => a === s && b === x && st !== "rep")) board.set(s, x, "hint", "");
      setFb(`Indice : sur ${corde(s)}, autour de la case ${fr}.`, "hint");
    });
    solveBtn.addEventListener("click", () => { run.help = true; rate("Voilà la réponse."); });
    ecoute.addEventListener("click", () => { const Q = cur(); if (Q?.oreille) gratte(Q.oreille); });

    function finir() {
      clearTimeout(run.chrono); chronoBar.hidden = true;
      const fm = rev ? null : famMem(f), total = sansFin ? run.faits.length : queue.length, score = sansFin ? run.serie : run.ok;
      let ouvert = false, record = false;
      if (!rev) {
        const prev = fm.best[lvl] || 0;
        if (score > prev) { fm.best[lvl] = score; record = sansFin && prev > 0; }
        if (!sansFin && score >= 8 && lvl < 10 && debloque(f) <= lvl) { fm.max = lvl + 1; ouvert = true; }
      }
      // le journal, lu par le compte-rendu de la semaine : score, essais, notes, fautes les plus fréquentes, d'où le jeu a été lancé
      const fautes = Object.entries(run.fautes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => { const [ff, key] = k.split("|"); return [libelle(ff, key), n]; });
      const m = mem(); (m.log ||= []).push({ f: rev ? "revision" : f, n: rev ? 0 : lvl, s: score, t: total, d: new Date().toISOString(), w: J.semaine?.(),
        x: run.essais, no: run.notes, e: run.erreurs, dt: Math.round((Date.now() - run.t0) / 1000), r: fautes, src: opts.source || (rev ? "revision" : "jeux") });
      if (m.log.length > 300) m.log.splice(0, m.log.length - 300);
      sauve();
      const pct = total ? score / total : 0;
      const bravo = sansFin ? (record ? "Nouveau record !" : "Bien joué !") : pct === 1 ? "Parfait !" : pct >= 0.8 ? "Très bien !" : pct >= 0.5 ? "C'est en train de rentrer." : "On continue, ça va venir.";
      answers.hidden = true; ecoute.hidden = true; boardHost.hidden = false; actions.hidden = true; board?.dim(null, null);
      q.textContent = bravo; prog.textContent = "";
      setFb(sansFin ? `Série de ${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""}. Ton record : ${Math.max(score, famMem(f).best[10] || 0)}.`
        : `${score} juste${score > 1 ? "s" : ""} sur ${total} du premier coup.` + (ouvert ? ` Le niveau ${lvl + 1} est ouvert !` : !rev && lvl < 10 && score < 8 ? " Il en faut 8 pour ouvrir le niveau suivant." : ""), pct >= 0.8 || record ? "good" : "");
      say(ouvert ? "Bravo, niveau suivant débloqué !" : bravo);
      window.Sons?.[pct >= 0.8 || record ? "bloc" : "cling"]?.();
      const fin = el("div", { class: "jeu-end" });
      if (!rev && lvl < 10 && debloque(f) > lvl) fin.append(el("button", { class: "btn primary big", type: "button", text: `Niveau ${lvl + 1} →`, onclick: () => ouvrir(f, lvl + 1, opts) }));
      fin.append(el("button", { class: "btn big" + (fin.childElementCount ? "" : " primary"), type: "button", text: "Rejouer", onclick: () => (rev ? revision(opts) : ouvrir(f, lvl, opts)) }),
        el("button", { class: "btn big", type: "button", text: "Terminé", onclick: () => d.close() }));
      boardHost.replaceChildren(fin); board = null; frets = 0;
      try { opts.onDone?.({ f, lvl, score, total, ouvert, fautes }); } catch {}
    }

    poser();
  }

  // ---------- Révision du jour : tout ce qui a été raté (boîtes 1 et 2), les 4 jeux mélangés ----------
  const aReviser = () => Object.keys(FAMILLES).flatMap(f => Object.entries(famMem(f).items).filter(([, v]) => v[0] <= 2).map(([key, v]) => ({ f, key, lvl: v[2] || 1 })))
    .filter(x => FAMILLES[x.f].niveaux[x.lvl - 1]);
  function revision(opts = {}) {
    let items = shuffle(aReviser()).slice(0, 10);
    // pas assez d'erreurs à revoir : on complète avec des questions des niveaux déjà ouverts
    while (items.length < 10) {
      const f = pick(Object.keys(FAMILLES)), lvl = 1 + Math.floor(Math.random() * Math.min(9, debloque(f)));
      const key = pick(FAMILLES[f].niveaux[lvl - 1].pool());
      if (!items.some(x => x.key === key)) items.push({ f, key, lvl });
    }
    ouvrir(null, null, { ...opts, revision: shuffle(items) });
  }

  J.niveaux = { FAMILLES, ouvrir, revision, aReviser, etat, debloque, libelle, courant: () => run?.cur }; // courant : la question posée (pour les tests)
})();
