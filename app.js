/* Ma gratte : mon cours, mon manche, mon bilan */
(() => {
  "use strict";

  const PROJECT_URL = "https://claude.ai/code/project/chan_01Dgiqrk7dDH3Kf79dSDsg79";
  const KEY = "maguitare:v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  };

  // ---------- État (gardé sur l'appareil) ----------
  const blank = () => ({ cours: {}, current: null, view: "cours", open: {} });
  let state = blank();
  try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {}
  let saveTimer = null, saveRate = false;
  // si le navigateur refuse d'enregistrer (navigation privée, mémoire pleine), on le dit une fois
  const ecrit = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); saveRate = false; }
    catch { if (!saveRate) { saveRate = true; toast("Je n'arrive pas à enregistrer tes progrès : fais une sauvegarde (Mon bilan › Mes données)."); } }
  };
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(ecrit, 250); };
  const flush = () => { clearTimeout(saveTimer); ecrit(); };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  const cs = id => (state.cours[id] ||= { ex: {}, tests: {} });
  const exState = (cid, key) => (cs(cid).ex[key] ||= {});

  // ---------- Données du cours ----------
  let DATA = null, RETOURS = [], SCHEMAS = {};
  const byId = id => DATA.cours.find(c => c.id === id);
  const palierOf = c => DATA.paliers.find(p => p.num === c.palier);
  const exKey = (b, e) => b.id + "/" + e.id;
  const allEx = c => c.blocs.flatMap(b => b.exercices.map(e => ({ b, e, key: exKey(b, e) })));
  const isDone = id => !!state.cours[id]?.finishedAt;
  const isStarted = id => {
    const s = state.cours[id];
    return !!s && (Object.values(s.ex).some(x => x.done || x.feel || x.note || x.tempo) || !!s.startedAt);
  };
  const nextCours = () => DATA.cours.find(c => !isDone(c.id)) || DATA.cours[DATA.cours.length - 1];

  async function loadJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }

  // ---------- Navigation entre sections ----------
  const VIEWS = ["cours", "manche", "morceaux", "jeux", "bilan"]; // dans l'ordre de la barre du bas (balayage)
  // En revenant au cours (barre du bas, « ← Cours N », balayage), on retrouve l'endroit où on était.
  function go(view, opts = {}) {
    if (!VIEWS.includes(view)) view = "cours";
    const from = state.view;
    if (from === "cours" && view !== "cours") coursScroll = window.scrollY;
    state.view = view; save();
    for (const v of VIEWS) $("#view-" + v).hidden = v !== view;
    document.querySelectorAll(".tabbar button").forEach(b => { if (b.dataset.go === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (view === "manche") openManche(opts.pos); else $("#backToCours").hidden = true;
    if (view === "bilan") renderBilan();
    if (view === "morceaux") renderMorceaux();
    if (view === "jeux") renderJeux();
    if (view !== "cours") window.scrollTo({ top: 0 });
    else if (from !== "cours" || opts.restore) window.scrollTo({ top: coursScroll });
    // lecteur d'écran : le focus va sur le titre de la nouvelle section, qui est alors annoncée
    if (opts.focus) {
      const sec = $("#view-" + view), h = sec.querySelector("h1, h2") || sec;
      h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
    }
  }
  let coursScroll = 0;
  document.querySelectorAll(".tabbar button").forEach(b => b.addEventListener("click", () => go(b.dataset.go, { focus: true })));

  // Balayer de droite à gauche : section suivante ; de gauche à droite : section précédente.
  function swipe(target, { edgeOnly = false } = {}) {
    let x0 = 0, y0 = 0, t0 = 0, ok = false;
    target.addEventListener("touchstart", e => {
      const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
      const tag = e.target.closest?.("input, textarea, select, .cours-tabs, .recap, .expl-table, [data-noswipe]");
      ok = e.touches.length === 1 && !tag && (!edgeOnly || x0 < 28);
    }, { passive: true });
    target.addEventListener("touchend", e => {
      if (!ok) return; ok = false;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Date.now() - t0 > 700 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      const i = VIEWS.indexOf(state.view);
      const j = dx < 0 ? i + 1 : i - 1;
      if (edgeOnly && dx < 0) return;
      if (j >= 0 && j < VIEWS.length) go(VIEWS[j]);
    }, { passive: true });
  }
  swipe($("#views"));

  // ---------- Mon manche ----------
  const frame = $("#mancheFrame");
  let mancheLoaded = false;
  function openManche(pos) {
    const hash = !pos ? "" : pos.startsWith("gamme-") ? "#" + pos : "#pos-" + pos; // une position, ou une gamme (#gamme-la-penta-mineure-z5)
    if (!mancheLoaded) {
      mancheLoaded = true;
      frame.src = "manche.html" + hash;
      frame.addEventListener("load", () => {
        try { swipe(frame.contentDocument, { edgeOnly: true }); } catch {}
      }, { once: true });
    } else if (pos) {
      try { frame.contentWindow.location.hash = hash; } catch { frame.src = "manche.html" + hash; }
    }
    const back = $("#backToCours");
    back.hidden = !pos;
    if (pos) back.textContent = "← Cours " + (byId(state.current)?.num ?? "");
  }
  $("#backToCours").addEventListener("click", () => go("cours"));

  // ---------- Onglets des cours ----------
  // En haut : les 3 paliers, puis les 4 semaines du palier choisi ; la semaine ouverte montre ses 3 cours.
  let navWeek = null; // semaine ouverte (par défaut, celle du cours affiché)
  function renderTabs() {
    const nav = $("#coursTabs");
    nav.replaceChildren();
    const cur = byId(state.current) || nextCours();
    const week = navWeek ?? cur.semaine;
    const pal = DATA.cours.find(c => c.semaine === week).palier;
    const pals = el("div", { class: "pal-row", role: "tablist", "aria-label": "Paliers" });
    for (const p of DATA.paliers) {
      const pc = DATA.cours.filter(c => c.palier === p.num), fait = pc.filter(c => isDone(c.id)).length;
      const bar = el("i", { class: "pal-bar", "aria-hidden": "true" }); bar.style.setProperty("--p", fait / pc.length);
      pals.append(el("button", {
        type: "button", class: "pal-btn", role: "tab", "aria-selected": String(p.num === pal),
        title: `${p.titre} · semaines ${pc[0].semaine} à ${pc.at(-1).semaine} · cours ${pc[0].num} à ${pc.at(-1).num} · ${fait} / ${pc.length} faits`,
        onclick: () => {
          if (p.num === pal) return;
          // la semaine à reprendre dans ce palier : celle du cours affiché, sinon la première pas finie
          const w = (cur.palier === p.num ? cur : pc.find(c => !isDone(c.id)) || pc[0]).semaine;
          navWeek = w; renderTabs();
        },
      }, el("span", { class: "pal-num", text: String(p.num) }), el("span", { class: "pal-nom", text: p.nom }), bar));
    }
    const weeks = el("div", { class: "week-row" });
    const wk = [...new Set(DATA.cours.filter(c => c.palier === pal).map(c => c.semaine))];
    for (const w of wk) {
      const wc = DATA.cours.filter(c => c.semaine === w);
      const st = wc.every(c => isDone(c.id)) ? "done" : wc.some(c => isDone(c.id) || isStarted(c.id)) ? "started" : "";
      const open = w === week;
      const head = el("button", {
        type: "button", class: "week-btn", "aria-expanded": String(open), title: `Semaine ${w} : cours ${wc[0].num} à ${wc.at(-1).num}`,
        onclick: () => { navWeek = w; renderTabs(); },
      }, el("span", { class: "week-long", text: "Semaine " }), el("span", { class: "week-short", text: "S" }), String(w));
      const grp = el("div", { class: ["week", open ? "open" : "", st].join(" ") }, head);
      if (open) for (const c of wc) {
        const cls = ["ctab", isDone(c.id) ? "done" : isStarted(c.id) ? "started" : ""].join(" ");
        grp.append(el("button", {
          type: "button", class: cls, "aria-current": c.id === state.current ? "true" : "false",
          "data-id": c.id, title: c.titre, onclick: () => selectCours(c.id),
        }, el("span", { class: "dot", "aria-hidden": "true" }), el("span", { class: "ctab-w", text: "Cours " }), String(c.num)));
      }
      weeks.append(grp);
    }
    nav.append(pals, weeks);
  }
  function selectCours(id) {
    Sons.tais();
    state.current = id; save(); navWeek = null;
    renderTabs(); renderCours(); updateSeance();
    window.scrollTo({ top: 0 });
  }

  // ---------- Un cours ----------
  // un bout de manche vu comme une grille d'accord : sillet, 2 cases, un doigt posé
  const ICON_POS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 7.6h14" stroke="currentColor" stroke-width="2.4"/><path d="M5 12.2h14M5 16.4h14" stroke="currentColor" stroke-width="1.2"/><path d="M9.7 7.6v12.9M14.3 7.6v12.9" stroke="currentColor" stroke-width="1"/><circle cx="14.3" cy="10" r="1.7" fill="currentColor"/></svg>';
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_TIMER = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 13.5V9.5M9.5 2.5h5M12 2.5V6M18.4 6.6l1.4-1.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_SPEAK = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_ZOOM = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const withIcon = (node, icon, text) => { node.insertAdjacentHTML("afterbegin", icon); if (text != null) node.append(text); return node; };

  const FRET_INLAYS = new Set([3, 5, 7, 9, 12, 15, 17, 19]);
  function progressOf(c) {
    const list = allEx(c), s = state.cours[c.id];
    const done = list.filter(x => s?.ex[x.key]?.done).length;
    return { done, total: list.length };
  }

  function renderCours() {
    const c = byId(state.current) || nextCours();
    state.current = c.id;
    const s = cs(c.id);
    const p = palierOf(c);
    const body = $("#coursBody");
    body.replaceChildren();
    seanceUI = {};

    // En-tête : un manche en bois, une case par exercice, qui s'allume quand il est fait
    const pr = progressOf(c);
    const frets = el("div", { class: "frets", "aria-hidden": "true" });
    frets.style.setProperty("--n", pr.total);
    const prLabel = el("span", { class: "progress-label" });
    const hero = el("header", { class: "hero" },
      el("span", { class: "hero-kicker", text: `Palier ${p.num} · ${p.nom}` }),
      el("h1", { text: "Cours " + c.num }),
      el("p", { class: "sub", text: c.titre }),
      frets, prLabel,
    );
    body.append(hero);
    if (!s.finishedAt) hero.append(renderSeance(c));
    const updateProgress = () => {
      const q = progressOf(c);
      const keys = allEx(c).map(x => !!s.ex[x.key]?.done);
      frets.replaceChildren(...keys.map((on, k) => el("i", { class: (on ? "on " : "") + (FRET_INLAYS.has(k + 1) ? "inlay" + (k + 1 === 12 ? " double" : "") : "") })));
      prLabel.textContent = `${q.done} / ${q.total} exercices faits`;
      const tab = document.querySelector(`.ctab[data-id="${c.id}"]`);
      if (tab && !isDone(c.id)) tab.classList.toggle("started", isStarted(c.id));
    };
    updateProgress();

    // Le mot du prof (retours écrits après tes bilans)
    const mots = RETOURS.filter(r => r.pour === c.id);
    if (c.mot) mots.unshift({ titre: "Le mot du prof", texte: c.mot });
    // (introSegs lit les mots dans ce même ordre : c.mot, puis les retours)
    for (const m of mots) {
      const card = el("div", { class: "card prof-card" }, el("span", { class: "eyebrow", text: m.titre || "Le mot du prof" }));
      String(m.texte).split(/\n+/).forEach(t => card.append(el("p", { text: t })));
      body.append(card);
    }
    if (c.num === 1 && !mots.length) {
      body.append(el("div", { class: "card prof-card" },
        el("span", { class: "eyebrow", text: "Comment ça marche" }),
        el("p", { text: "Coche chaque exercice fait, dis si c'était facile, correct ou une galère, note ton tempo et un commentaire si besoin." }),
        el("p", { text: "À la fin, touche « Terminer le cours ». Après le cours 3, le dernier de la semaine, envoie-moi ton bilan : j'adapte la semaine suivante." }),
      ));
    }
    if (p.num && c.num === (p.num - 1) * 12 + 1) {
      body.append(el("div", { class: "card palier-card" },
        el("span", { class: "eyebrow", text: "Ce palier" }),
        el("p", {}, el("strong", { text: "Le but : " }), p.but),
        el("p", {}, el("strong", { text: "Ta mission : " }), p.mission),
      ));
    }

    // Les 6 blocs
    c.blocs.forEach((b, bi) => body.append(renderBloc(c, b, bi, updateProgress)));

    // Bilan de palier
    if (c.bilan) body.append(renderTests(c));

    // Terminer
    body.append(renderFin(c));

    // Cours précédent / suivant
    const i = DATA.cours.indexOf(c);
    const prev = DATA.cours[i - 1], next = DATA.cours[i + 1];
    body.append(el("div", { class: "nav-cours" },
      el("button", { class: "btn", type: "button", disabled: !prev, onclick: () => prev && selectCours(prev.id) }, "← Cours " + (prev ? prev.num : "")),
      el("button", { class: "btn", type: "button", disabled: !next, onclick: () => next && selectCours(next.id) }, "Cours " + (next ? next.num : "") + " →"),
    ));
  }

  function renderBloc(c, b, bi, updateProgress) {
    const s = cs(c.id);
    const openKey = c.id + "/" + b.id;
    const firstTodo = c.blocs.find(x => !x.exercices.every(e => s.ex[exKey(x, e)]?.done));
    const isOpen = state.open[openKey] ?? (firstTodo ? firstTodo.id === b.id : false);
    const complete = () => b.exercices.every(e => s.ex[exKey(b, e)]?.done);

    const card = el("article", { class: "card bloc" + (complete() ? " complete" : ""), "open-state": isOpen ? "open" : "closed" });
    const head = el("button", { class: "bloc-head", type: "button", "aria-expanded": String(isOpen) },
      el("span", { class: "bloc-num", text: String(bi + 1) }),
      el("span", { class: "bloc-title" },
        el("h3", { text: b.titre.replace(/^\d+\.\s*/, "") }),
        el("span", { class: "meta", text: `${b.duree} min · ${b.exercices.length} exercice${b.exercices.length > 1 ? "s" : ""}` })),
    );
    head.insertAdjacentHTML("beforeend", CHEV);
    const inner = el("div", { class: "bloc-body", hidden: !isOpen });
    head.addEventListener("click", () => {
      const open = inner.hidden;
      inner.hidden = !open; card.setAttribute("open-state", open ? "open" : "closed");
      head.setAttribute("aria-expanded", String(open));
      state.open[openKey] = open; save();
    });
    // le prof explique le bloc : visible même bloc replié, et il l'ouvre
    const consigne = b.voix?.consigne || [`${b.titre.replace(/^\d+\.\s*/, "")}.`, b.sert, `À faire : ${b.faire}`];
    const ecoute = withIcon(el("button", { class: "bloc-ecoute", type: "button", title: "Le prof explique ce bloc", "aria-label": `Le prof explique le bloc ${bi + 1}` }), ICON_SPEAK);
    ecoute.addEventListener("click", async () => {
      if (ecoute.classList.contains("speaking")) return Sons.tais();
      if (inner.hidden) head.click();
      ecoute.classList.add("speaking");
      try { await parle(consigne.map(t => ({ t, cible: bi }))); } finally { ecoute.classList.remove("speaking"); }
    });
    card.append(el("div", { class: "bloc-top" }, head, ecoute), inner);

    inner.append(el("blockquote", { class: "sert", text: b.sert }));
    if (b.quand?.length) {
      // ouvert quand la notion est nouvelle (premier cours du palier), sinon replié
      const prevC = DATA.cours[DATA.cours.indexOf(c) - 1];
      const isNew = !prevC || prevC.palier !== c.palier;
      const quandKey = openKey + "/quand";
      const q = el("details", { class: "quand", open: state.open[quandKey] ?? isNew },
        el("summary", {}, "Pourquoi c'est utile, et quand tu t'en serviras"));
      q.addEventListener("toggle", () => { state.open[quandKey] = q.open; save(); });
      q.append(el("div", { class: "quand-in" },
        el("ul", {}, b.quand.map(t => el("li", { text: t }))),
        b.voix?.quand ? speakBtn(b.voix.quand, "Écouter", "Écouter pourquoi c'est utile") : null));
      inner.append(q);
    }
    inner.append(el("p", { class: "faire" }, el("strong", { text: "À faire : " }), b.faire));

    const sch = (b.schemas || []).map(k => SCHEMAS[k]).filter(Boolean);
    if (sch.length) inner.append(el("div", { class: "schemas" }, sch.map(schemaFig)));

    const tools = el("div", { class: "row-tools" });
    tools.append(withIcon(el("button", { class: "btn small", type: "button", onclick: () => startTimer(b.duree, b.titre.replace(/^\d+\.\s*/, "")) }), ICON_TIMER, `Minuteur ${b.duree} min`));
    // chaque position (Do, Sol7…) va dans les exercices qui la nomment ; une position qu'aucun exercice ne nomme reste ici
    const posEx = new Map(), libres = [];
    // « Fa, Sol, La mineurs » se lit « Fa mineur, Sol mineur, La mineur »
    const NOTE = "(?:Do|Ré|Mi|Fa|Sol|La|Si)[♯♭#b]?";
    const liste = new RegExp(`${NOTE}(?:\\s*(?:,|et)\\s*${NOTE})+(?=\\s+mineure?s(?![\\p{L}]))`, "gu");
    const lu = new Map(b.exercices.map(e => [e, e.label.replace(liste, l => l.replace(new RegExp(NOTE, "gu"), n => n + " mineur")).replace(/(mineur)\s+mineure?s(?![\p{L}])/gu, "$1")]));
    (b.positions || []).forEach(pz => {
      const brut = pz.motif || pz.label.replace(/\s*\(.*\)$/, "");
      const nom = brut.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // un accord majeur (« Sol ») ne va pas dans « Sol mineur »
      const pasMineur = /^\S+$/.test(brut) ? "(?!\\s+mineur)" : "";
      const re = new RegExp(`(^|[^\\p{L}])${nom}(?![\\p{L}\\d♯♭#])${pasMineur}`, "u");
      const vises = b.exercices.filter(e => re.test(lu.get(e)));
      if (!vises.length) libres.push(pz);
      vises.forEach(e => { if (!posEx.has(e)) posEx.set(e, []); posEx.get(e).push(pz); });
    });
    libres.forEach(pz => tools.append(posBtn(pz)));
    inner.append(tools);

    if (c.num > 1 && [1, 3, 4].includes(bi)) { const rv = revisionCard(c, bi); if (rv) inner.append(rv); }
    if (bi === 5) { const sm = semaineCard(c); if (sm) inner.append(sm); }
    const ul = el("ul", { class: "exos" });
    let wasComplete = complete();
    b.exercices.forEach(e => ul.append(renderExo(c, b, e, posEx.get(e), checked => {
      const now = complete();
      card.classList.toggle("complete", now);
      // chaque exercice coché joue la note suivante de la gamme du cours ; la fin d'un bloc, une double note
      const finBloc = now && !wasComplete;
      if (checked || finBloc) Sons.noteCours(c.num, Math.max(0, progressOf(c).done - 1), finBloc);
      if (finBloc) toast(`Bloc ${bi + 1} terminé, bravo !`);
      wasComplete = now; updateProgress();
    })));
    inner.append(ul);
    const jb = jeuBloc(c, bi); if (jb) inner.append(jb);

    const moreKey = openKey + "/more";
    const more = el("details", { class: "more", open: state.open[moreKey] ?? true }, el("summary", { text: "Explication et vidéos" }));
    more.addEventListener("toggle", () => { if (state.open[moreKey] !== more.open) { state.open[moreKey] = more.open; save(); } });
    const mi = el("div", { class: "more-in" });
    if (b.voix?.explication?.length) mi.append(el("div", { class: "row-tools" }, speakBtn(b.voix.explication, "Écouter l'explication", "Écouter l'explication")));
    b.explication.forEach(t => {
      if (typeof t === "string") return mi.append(el("p", { text: t }));
      if (t.titre) mi.append(el("h4", { class: "expl-titre", text: t.titre }));
      if (t.liste) mi.append(el(t.ordonnee ? "ol" : "ul", { class: "expl-liste" }, t.liste.map(x => el("li", { text: x }))));
      if (t.table) {
        const [head, ...rows] = t.table;
        mi.append(el("div", { class: "expl-table" }, el("table", {},
          el("thead", {}, el("tr", {}, head.map(h => el("th", { text: h })))),
          el("tbody", {}, rows.map(r => el("tr", {}, r.map((c, i) => el(i ? "td" : "th", { text: c }))))))));
      }
    });
    // ouvert tant qu'un exercice demande de lire l'explication (« Lire « Comprendre les barrés… » »)
    if (b.exercices.some(e => /^Lire\b/.test(e.label) && !s.ex[exKey(b, e)]?.done)) more.open = true;
    if (b.videos?.length) mi.append(el("p", { class: "eyebrow", text: "Vidéos" }), lecteur(b.videos, b.titre, { liste: true }));
    more.append(mi);
    inner.append(more);
    return card;
  }

  // Bouton « Écouter » : lit une suite de phrases ; retouché pendant la lecture, il l'arrête.
  function speakBtn(segs, label, title) {
    const txt = document.createTextNode(label);
    const b = withIcon(el("button", { class: "btn small speak-btn", type: "button", title }), ICON_SPEAK);
    b.append(txt);
    b.addEventListener("click", async () => {
      if (b.classList.contains("speaking")) return Sons.tais();
      b.classList.add("speaking"); txt.textContent = "Arrêter";
      try { await parle(typeof segs === "function" ? segs() : segs); } finally { b.classList.remove("speaking"); txt.textContent = label; }
    });
    return b;
  }
  // Une liste de phrases, ou de { t, cible } : pendant chaque phrase, sa partie du cours est mise en avant à l'écran
  let parleN = 0;
  function parle(list) {
    const n = ++parleN;
    const L = (Array.isArray(list) ? list : [list]).map(x => (typeof x === "string" ? { t: x } : x)).filter(x => String(x?.t || "").trim());
    const vise = L.some(x => x.cible != null);
    return Sons.dire(L.map(x => x.t), { force: true, onSeg: vise ? i => montre(L[i]?.cible) : null }).finally(() => { if (vise && n === parleN) montre(null); });
  }
  // la partie dont parle le prof grossit un peu, au centre de l'écran ; l'écran descend doucement vers la suivante
  function montre(cible) {
    document.querySelectorAll(".en-parole, .pres-parole").forEach(e => { e.classList.remove("en-parole", "pres-parole"); e.style.removeProperty("--zoom"); });
    if (cible == null || state.view !== "cours" || !Reglages.get("animation")) return;
    const body = $("#coursBody");
    // l'en-tête, les mots du prof, puis les 6 blocs : plus une partie est proche de celle annoncée, plus elle grossit
    const suite = [body.querySelector(".hero"), ...body.querySelectorAll(".prof-card, .palier-card"), ...body.querySelectorAll(".bloc")].filter(Boolean);
    const e = cible === "tete" ? body.querySelector(".hero") : cible === "palier" ? body.querySelector(".palier-card")
      : String(cible).startsWith("mot:") ? body.querySelectorAll(".prof-card")[+String(cible).slice(4)]
      : body.querySelectorAll(".bloc")[cible];
    if (!e) return;
    const i = suite.indexOf(e);
    suite.forEach((x, j) => { const d = Math.abs(j - i); if (d <= 2) { x.classList.add("pres-parole"); x.style.setProperty("--zoom", [1.05, 1.022, 1.008][d]); } });
    e.classList.add("en-parole");
    const grand = e.getBoundingClientRect().height > window.innerHeight * 0.6;
    e.scrollIntoView({ behavior: "smooth", block: grand ? "start" : "center" });
  }

  // ---------- Schémas (les mêmes que dans le cours du Claude Doc) ----------
  function schemaFig(s) {
    const fig = el("figure", { class: "schema", role: "button", tabindex: "0", "aria-label": "Agrandir le schéma : " + s.titre });
    const hint = withIcon(el("span", { class: "zoom-hint", "aria-hidden": "true" }), ICON_ZOOM);
    fig.append(el("figcaption", {}, el("div", {}, el("strong", { text: s.titre }), s.sous ? el("span", { text: s.sous }) : null), hint));
    const art = el("div", { class: "schema-art" });
    if (s.svg) art.innerHTML = s.svg;
    else art.append(el("img", { src: s.img, alt: s.titre, loading: "lazy", width: s.w, height: s.h }));
    fig.append(art);
    fig.addEventListener("click", () => openSchema(s));
    fig.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSchema(s); } });
    return fig;
  }
  let schemaView = null;
  function openSchema(s) {
    if (!schemaView) {
      schemaView = el("dialog", { class: "schema-view", "aria-label": "Schéma agrandi" });
      schemaView.addEventListener("click", () => schemaView.close());
      document.body.append(schemaView);
    }
    const fig = el("figure", { class: "sv-fig", style: `--ar:${(s.w / s.h).toFixed(3)}` },
      el("figcaption", {}, el("strong", { text: s.titre }), s.sous ? el("span", { text: s.sous }) : null));
    if (s.svg) fig.insertAdjacentHTML("beforeend", s.svg); else fig.append(el("img", { src: s.img, alt: s.titre }));
    const portrait = matchMedia("(orientation: portrait) and (max-width: 700px)").matches;
    schemaView.replaceChildren(
      el("div", { class: "sv-stage" }, fig),
      el("button", { class: "icon-btn sv-close", type: "button", "aria-label": "Fermer", text: "✕" }),
      el("p", { class: "sv-tip", text: portrait ? "Tourne ton téléphone pour lire le schéma en grand. Touche l'écran pour fermer." : "Touche l'écran pour fermer." }));
    openSheet(schemaView);
  }

  // ---------- Mes morceaux : les missions du cours, les morceaux au choix et les tiens ----------
  // statut : « travail » (je le travaille), « maitrise », ou rien (je pourrais le travailler).
  // Les missions (Fragile, Bamboleo) sont travaillées d'office dès leur semaine. Tes morceaux à toi vont dans « Mes morceaux »
  // jusqu'à ce que tu choisisses de les travailler ; je les analyse au bilan (DATA.analyses, retrouvés par leur titre).
  const NIVEAU = ["", "Abordable", "Moyen", "Costaud"];
  const NIVEAUX = { 1: "Fondations", 2: "Indépendance", 3: "Liberté", 4: "Bossa nova" };
  const cleMorceau = t => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const analyseDe = x => (DATA.analyses || []).find(a => a.cle === cleMorceau(x.titre));
  const tousMorceaux = () => [...(DATA.morceaux || []), ...(state.mesPieces || []).map(x => { const a = analyseDe(x); return { ...a, ...Object.fromEntries(Object.entries(x).filter(([, v]) => v !== "")), perso: true, analyse: !!a }; })];
  const morceau = id => tousMorceaux().find(x => x.id === id);
  const semaineAtteinte = c => Math.max(c?.semaine || 0, nextCours().semaine);
  const verrou = (pz, sem) => !pz.perso && sem < (pz.des || 1);
  const statutDe = (pz, sem) => (state.morceaux ||= {})[pz.id] || (pz.mission && !verrou(pz, sem) ? "travail" : "");
  const setStatut = (pz, st) => { (state.morceaux ||= {})[pz.id] = st; save(); };
  const missionDe = c => morceau(c.palier === 1 ? "fragile" : "bamboleo");
  const quandTxt = pz => (pz.des > 12 ? "Après le palier 3" : `Dès la semaine ${pz.des}`);
  const tri = (a, b) => (a.palier || 9) - (b.palier || 9) || (a.des || 0) - (b.des || 0) || (a.niveau || 0) - (b.niveau || 0);

  // ---------- Vidéo dans l'app, tablatures, et tes propres ajouts ----------
  const ytId = u => {
    try {
      const x = new URL(u), h = x.hostname;
      if (/(^|\.)youtu\.be$/.test(h)) return x.pathname.slice(1).split("/")[0] || null;
      if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) return x.searchParams.get("v") || (x.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/) || [])[1] || null;
    } catch {}
    return null;
  };
  const urlOk = u => /^https?:\/\/\S+$/i.test(u);
  // Les fichiers que tu ajoutes (photo ou PDF de tablature) sont gardés sur l'appareil, dans IndexedDB.
  const fichiers = (() => {
    let p = null;
    const open = () => (p ||= new Promise((ok, ko) => {
      const r = indexedDB.open("maguitare-fichiers", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("f");
      r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
    }));
    const tx = (mode, fn) => open().then(db => new Promise((ok, ko) => {
      const t = db.transaction("f", mode), q = fn(t.objectStore("f"));
      t.oncomplete = () => ok(q?.result); t.onerror = t.onabort = () => ko(t.error);
    }));
    return { put: (k, v) => tx("readwrite", s => s.put(v, k)), get: k => tx("readonly", s => s.get(k)), del: k => tx("readwrite", s => s.delete(k)) };
  })();
  // une photo de tablature : réduite à 1800 px pour rester légère, tout en restant lisible
  async function reduireImage(file) {
    try {
      const bmp = await createImageBitmap(file), k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      return (await new Promise(ok => c.toBlob(ok, "image/jpeg", 0.85))) || file;
    } catch { return file; }
  }
  // La visionneuse plein écran des tablatures importées (photo ou PDF) : zoom avec − et +, ou double toucher.
  // Les PDF sont dessinés par pdf.js (lib/pdfjs, chargé seulement à la première ouverture).
  let pdfjs = null;
  const chargePdf = () => (pdfjs ||= new Promise((ok, ko) => {
    const sc = el("script", { src: "lib/pdfjs/pdf.min.js" });
    sc.onload = () => { const L = window.pdfjsLib; if (!L) return ko(new Error("pdf.js")); L.GlobalWorkerOptions.workerSrc = "lib/pdfjs/pdf.worker.min.js"; ok(L); };
    sc.onerror = () => { pdfjs = null; ko(new Error("pdf.js")); };
    document.head.append(sc);
  }));
  let fichierView = null;
  async function openFichier(blob, titre) {
    if (!fichierView) {
      fichierView = el("dialog", { class: "fichier-view", "aria-label": "Tablature" });
      fichierView.addEventListener("click", e => { if (e.target.closest(".fv-close")) fichierView.close(); });
      document.body.append(fichierView);
    }
    const pdf = blob.type === "application/pdf";
    const pages = el("div", { class: "fv-pages" }), scroll = el("div", { class: "fv-scroll", "data-noswipe": "" }, pages);
    const zt = el("span", { class: "fv-zoom", "aria-live": "polite", text: "100 %" });
    let z = 1;
    const zoom = k => {
      const cx = scroll.scrollLeft + scroll.clientWidth / 2, cy = scroll.scrollTop + scroll.clientHeight / 2, r = Math.min(4, Math.max(1, k)) / z;
      z *= r; pages.style.width = z * 100 + "%"; pages.style.maxWidth = z > 1 ? "none" : ""; zt.textContent = Math.round(z * 100) + " %";
      scroll.scrollLeft = cx * r - scroll.clientWidth / 2; scroll.scrollTop = cy * r - scroll.clientHeight / 2;
    };
    scroll.addEventListener("dblclick", () => zoom(z > 1 ? 1 : 2));
    const bouton = (txt, label, fn) => el("button", { class: "icon-btn fv-btn", type: "button", "aria-label": label, text: txt, onclick: fn });
    fichierView.replaceChildren(
      el("div", { class: "fv-bar" }, el("strong", { class: "fv-titre", text: titre }),
        el("div", { class: "fv-outils" }, bouton("−", "Dézoomer", () => zoom(z / 1.4)), zt, bouton("+", "Zoomer", () => zoom(z * 1.4)), bouton("✕", "Fermer", () => fichierView.close()))),
      scroll);
    const urls = [];
    fichierView.addEventListener("close", () => urls.forEach(u => URL.revokeObjectURL(u)), { once: true });
    openSheet(fichierView);
    if (!pdf) { const u = URL.createObjectURL(blob); urls.push(u); pages.append(el("img", { src: u, alt: titre })); return; }
    const attente = el("p", { class: "fv-attente", text: "J'ouvre le PDF…" });
    pages.append(attente);
    try {
      const L = await chargePdf();
      const doc = await L.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
      attente.remove();
      // chaque page dessinée assez grande pour rester nette quand on zoome
      const largeur = Math.min(2400, Math.max(1200, scroll.clientWidth * (window.devicePixelRatio || 1) * 2));
      for (let i = 1; i <= doc.numPages; i++) {
        if (!fichierView.open) break;
        const page = await doc.getPage(i), v0 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: largeur / v0.width });
        const cv = el("canvas", { width: Math.floor(vp.width), height: Math.floor(vp.height), "aria-label": `${titre}, page ${i}` });
        pages.append(cv);
        await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      }
    } catch {
      // pdf.js indisponible : le PDF s'ouvre dans le lecteur de l'appareil
      attente.textContent = "Je n'arrive pas à l'afficher ici : il s'ouvre dans un nouvel onglet.";
      const u = URL.createObjectURL(blob); urls.push(u); window.open(u, "_blank");
    }
  }

  const ajoutsDe = pz => ((state.ajouts ||= {})[pz.id] ||= { videos: [], tabs: [] });
  const sansAjouts = pz => { const a = state.ajouts?.[pz.id]; if (a && !a.videos.length && !a.tabs.length) delete state.ajouts[pz.id]; };
  // toutes les vidéos d'un morceau : celles du cours, puis les tiennes
  const videosDe = pz => [
    pz.ecouter ? { t: "Écouter", u: pz.ecouter } : null,
    pz.tuto ? { t: "Tuto", u: pz.tuto } : null,
    ...(pz.plus || []),
    ...(state.ajouts?.[pz.id]?.videos || []).map(v => ({ ...v, a: true })),
  ].filter(Boolean);

  // Les boutons vidéo ; un touché lit la vidéo juste en dessous, un autre la ferme. Une vidéo qui ne se lit pas ici reste ouverte sur YouTube.
  function lecteurVideos(pz, onChange) {
    const vids = videosDe(pz);
    const wrap = lecteur(vids, pz.titre, { apres: (v, bar) => {
      if (v.a) bar.append(el("button", { class: "link-btn x", type: "button", "aria-label": `Retirer la vidéo ${v.t}`, text: "✕", onclick: () => {
        const a = ajoutsDe(pz); a.videos = a.videos.filter(x => x !== a.videos.find(y => y.u === v.u && y.t === v.t)); sansAjouts(pz); save(); onChange();
      } }));
    } });
    if (!vids.length) wrap.querySelector(".row-tools").append(el("span", { class: "muted small", text: "Pas encore de vidéo : ajoute-en une ci-dessous." }));
    return wrap;
  }
  // Des boutons vidéo : un touché lit la vidéo juste en dessous (dans l'app, aussi sur Mac), un autre la ferme.
  // liste : un bouton par ligne (les vidéos des blocs ont de longs titres)
  function lecteur(vids, titre, { apres = null, liste = false } = {}) {
    const wrap = el("div", { class: "lecteur" }), slot = el("div", { class: "lecteur-slot", hidden: true });
    let ouverte = null;
    const bar = el("div", { class: "row-tools" + (liste ? " vids-liste" : "") });
    vids.forEach(v => {
      const id = ytId(v.u), nom = (v.t === "Écouter" ? "▶ Écouter" : v.t === "Tuto" ? "▶ Tuto" : "▶ " + v.t);
      if (!id) { bar.append(el("a", { class: "btn small ghost", href: v.u, target: "_blank", rel: "noopener" }, nom + " ↗")); return; }
      const b = el("button", { class: "btn small vid-btn" + (v.t === "Tuto" ? " tuto" : ""), type: "button", "aria-pressed": "false" }, nom);
      b.addEventListener("click", () => {
        const deja = ouverte === id;
        bar.querySelectorAll(".vid-btn").forEach(x => x.setAttribute("aria-pressed", "false"));
        Sons.tais();
        if (deja) { ouverte = null; slot.hidden = true; slot.replaceChildren(); return; }
        ouverte = id; b.setAttribute("aria-pressed", "true");
        slot.replaceChildren(
          el("div", { class: "yt" }, el("iframe", {
            src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`, title: `${titre} : ${v.t}`, loading: "lazy", allowfullscreen: true,
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", referrerpolicy: "strict-origin-when-cross-origin" })),
          el("a", { class: "link-btn small", href: `https://www.youtube.com/watch?v=${id}`, target: "_blank", rel: "noopener" }, "Elle ne se lit pas ? Ouvrir sur YouTube ↗"));
        slot.hidden = false;
      });
      bar.append(b);
      apres?.(v, bar);
    });
    wrap.append(bar, slot);
    return wrap;
  }

  // Les tablatures : celles que j'ai trouvées (liens), puis les tiennes (liens, photos, PDF). Chacune est un bouton :
  // son nom (sans la source entre parenthèses) ; un contour laiton pour les miennes, vert pour les tiennes.
  const ICONE_TAB = {
    tab: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" stroke-width="1.3" opacity=".55"/><circle cx="8" cy="10" r="1.9" fill="currentColor"/><circle cx="13" cy="14" r="1.9" fill="currentColor"/><circle cx="17" cy="6" r="1.9" fill="currentColor"/>',
    pdf: '<path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" stroke="currentColor" stroke-width="1.5"/>',
    photo: '<rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.7" fill="currentColor"/><path d="M4 17l5-4.5 3.5 3 3-2.5L20 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  };
  function tabCarte(t, { href, onclick, icone = "tab", mine = false }) {
    const nom = mine ? t.t : t.t.replace(/\s*\(.+\)$/, "");
    const ic = el("span", { class: "tab-ic", "aria-hidden": "true" }); ic.innerHTML = `<svg viewBox="0 0 24 24">${ICONE_TAB[icone]}</svg>`;
    const kids = [ic, el("span", { class: "tab-txt" }, el("strong", { text: nom })), el("span", { class: "tab-go", "aria-hidden": "true", text: href ? "↗" : "›" })];
    const cls = "tab-card" + (mine ? " mine" : ""), title = mine ? "Ta tablature" : t.t;
    return href ? el("a", { class: cls, href, target: "_blank", rel: "noopener", title }, kids) : el("button", { class: cls, type: "button", title, onclick }, kids);
  }
  function listeTabs(pz, onChange) {
    const box = el("div", { class: "tabs-list" });
    const mine = state.ajouts?.[pz.id]?.tabs || [];
    const ul = el("ul", { class: "tab-cards" });
    (pz.tabs || []).forEach(t => ul.append(el("li", {}, tabCarte(t, { href: t.u }))));
    mine.forEach(t => {
      const li = el("li", { class: "mine" });
      const pdf = t.type === "application/pdf";
      li.append(t.u ? tabCarte(t, { href: t.u, mine: true }) : tabCarte(t, { icone: pdf ? "pdf" : "photo", mine: true, onclick: async () => {
        try { const f = await fichiers.get(t.f); if (!f) throw 0; openFichier(f, t.t); }
        catch { toast("Ce fichier n'est plus sur cet appareil : ajoute-le à nouveau."); }
      } }));
      li.append(el("button", { class: "icon-btn tab-x", type: "button", "aria-label": `Retirer ${t.t}`, text: "✕", onclick: async () => {
        const a = ajoutsDe(pz); a.tabs = a.tabs.filter(x => x !== t); sansAjouts(pz); save();
        if (t.f) fichiers.del(t.f).catch(() => {});
        onChange();
      } }));
      ul.append(li);
    });
    if (ul.children.length) box.append(ul);
    else box.append(el("p", { class: "muted small", text: "Pas encore de tablature : ajoute la tienne ci-dessous." }));
    if (pz.tabs?.length && mine.length) box.append(el("p", { class: "tab-legende" }, el("span", { text: "Trouvées pour toi" }), el("span", { class: "mine", text: "Les tiennes" })));
    return box;
  }

  // Ajouter une vidéo ou une tablature à un morceau
  function formAjout(pz, onChange) {
    const d = el("details", { class: "ajout" }, el("summary", { text: "+ Ajouter ma tablature ou ma vidéo" }));
    const nomT = el("input", { type: "text", placeholder: "Nom (ex. Intro, tab de mon prof)", "aria-label": "Nom de la tablature" });
    const lienT = el("input", { type: "url", placeholder: "Lien vers une tablature", "aria-label": "Lien vers une tablature" });
    const fic = el("input", { type: "file", accept: "image/*,application/pdf", hidden: true });
    const msg = el("p", { class: "muted small", role: "status" });
    const ajouterTab = t => { ajoutsDe(pz).tabs.push(t); save(); Sons.cling(); onChange(); };
    d.append(el("p", { class: "eyebrow", text: "Tablature" }), nomT, lienT,
      el("div", { class: "row-tools" },
        el("button", { class: "btn small", type: "button", onclick: () => {
          const u = lienT.value.trim(); if (!urlOk(u)) { msg.textContent = "Colle un lien complet, qui commence par https://."; return; }
          ajouterTab({ t: nomT.value.trim() || "Ma tablature", u });
        } }, "Ajouter le lien"),
        el("button", { class: "btn small", type: "button", onclick: () => fic.click() }, "Photo ou PDF…")),
      fic, msg);
    fic.addEventListener("change", async () => {
      const f = fic.files[0]; if (!f) return;
      if (f.size > 15e6) { msg.textContent = "Ce fichier est trop gros (15 Mo au plus)."; return; }
      msg.textContent = "J'enregistre…";
      try {
        const pdf = f.type === "application/pdf", blob = pdf ? f : await reduireImage(f), id = "f-" + Date.now().toString(36);
        await fichiers.put(id, blob);
        ajouterTab({ t: nomT.value.trim() || f.name.replace(/\.[^.]+$/, "") || "Ma tablature", f: id, type: pdf ? "application/pdf" : "image/jpeg" });
      } catch { msg.textContent = "Je n'ai pas pu garder ce fichier sur l'appareil. Colle plutôt un lien."; }
    });
    const nomV = el("input", { type: "text", placeholder: "Nom (ex. Tuto de ma prof)", "aria-label": "Nom de la vidéo" });
    const lienV = el("input", { type: "url", placeholder: "Lien YouTube", "aria-label": "Lien de la vidéo" });
    d.append(el("p", { class: "eyebrow", text: "Vidéo" }), nomV, lienV,
      el("button", { class: "btn small", type: "button", onclick: () => {
        const u = lienV.value.trim(); if (!urlOk(u)) { msg.textContent = "Colle un lien complet, qui commence par https://."; return; }
        ajoutsDe(pz).videos.push({ t: nomV.value.trim() || "Ma vidéo", u }); save(); Sons.cling(); onChange();
      } }, "Ajouter la vidéo"),
      el("p", { class: "muted small", text: "Les photos et PDF restent sur cet appareil : ils ne sont pas dans la sauvegarde. Les liens, eux, y sont." }));
    return d;
  }

  // La fiche d'un morceau : sa vidéo à lire ici, ses tablatures, et ce que tu as ajouté
  function ficheMorceau(pz, onChange) {
    return el("div", { class: "fiche" },
      el("span", { class: "eyebrow", text: "Vidéos" }), lecteurVideos(pz, onChange),
      el("span", { class: "eyebrow", text: "Tablatures" }), listeTabs(pz, onChange),
      pz.perso ? chercheTab(pz) : null,
      formAjout(pz, onChange));
  }
  // une recherche toute prête sur les deux grandes banques de tablatures ; Songsterr d'abord, celle qu'il préfère
  function chercheTab(pz) {
    const q = encodeURIComponent([pz.titre, pz.artiste].filter(Boolean).join(" "));
    const lien = (href, text) => el("a", { class: "btn small", href, target: "_blank", rel: "noopener", text });
    return el("div", { class: "cherche-tab" }, el("span", { class: "muted small", text: "Chercher la tablature :" }),
      lien(`https://www.songsterr.com/?pattern=${q}`, "Songsterr"),
      lien(`https://www.ultimate-guitar.com/search.php?search_type=title&value=${q}`, "Ultimate Guitar"));
  }

  // « Pour le maîtriser » : les notions du morceau et les jeux qui t'y préparent, repliés dans la fiche
  function maitriserBox(pz) {
    const M = pz.maitriser; if (!M) return null;
    const k = "maitriser/" + pz.id, d = el("details", { class: "maitriser", open: !!state.open[k] });
    d.addEventListener("toggle", () => { state.open[k] = d.open; save(); });
    const N = NIV();
    d.append(el("summary", {}, el("span", { class: "mt-titre", text: "Pour le maîtriser" }),
      el("span", { class: "mt-resume", text: [M.notions?.length && `${M.notions.length} notion${M.notions.length > 1 ? "s" : ""}`, M.jeux?.length && `${M.jeux.length} jeu${M.jeux.length > 1 ? "x" : ""}`].filter(Boolean).join(" · ") })));
    const corps = el("div", { class: "mt-corps" });
    if (M.notions?.length) corps.append(el("ul", { class: "mt-notions" }, M.notions.map(n => el("li", {}, el("strong", { text: n.t }), el("span", { text: n.d })))));
    if (M.jeux?.length && N) {
      corps.append(el("span", { class: "eyebrow", text: "Les jeux qui t'y préparent" }));
      corps.append(el("div", { class: "mt-jeux" }, M.jeux.map(j => {
        const F = N.FAMILLES[j.f]; if (!F) return null;
        const n = Math.min(j.n, N.debloque(j.f)), bas = n < j.n;
        return el("button", { class: "mt-jeu", type: "button", onclick: () => N.ouvrir(j.f, n, { source: "morceau:" + pz.id }) },
          el("span", { class: "mt-jeu-nom", text: `${F.titre} · niveau ${n}` }),
          el("span", { class: "mt-jeu-p", text: j.p + (bas ? ` (le niveau ${j.n} s'ouvrira en avançant)` : "") }));
      })));
    }
    d.append(corps);
    return d;
  }

  function morceauCard(pz, sem, refresh) {
    const lock = verrou(pz, sem), st = statutDe(pz, sem);
    const li = el("li", { class: "piece" + (lock ? " locked" : "") + (st === "travail" ? " chosen" : "") + (st === "maitrise" ? " mastered" : "") });
    const nv = pz.niveau || 0;
    // toucher le titre ouvre la fiche ; les morceaux en cours sont ouverts, sauf si tu l'as refermée
    const ouvKey = "morceau/" + pz.id;
    let ouvert = state.open[ouvKey] ?? st === "travail";
    const corps = el("div", { class: "piece-corps", hidden: !ouvert });
    const head = el("button", { class: "piece-head", type: "button", "aria-expanded": String(ouvert) },
      el("span", { class: "piece-titres" },
        pz.mission ? el("span", { class: "piece-tag mission", text: "Mission du cours" }) : pz.perso ? el("span", { class: "piece-tag", text: pz.analyse ? "Ton morceau" : "Ton morceau · à analyser" }) : null,
        el("span", { class: "piece-titre", text: pz.titre }),
        pz.artiste ? el("span", { class: "piece-artiste", text: pz.artiste }) : null),
      el("span", { class: "pli-chev", "aria-hidden": "true" }));
    head.addEventListener("click", () => {
      ouvert = !ouvert; corps.hidden = !ouvert; head.setAttribute("aria-expanded", String(ouvert));
      li.classList.toggle("ouvert", ouvert); state.open[ouvKey] = ouvert; save();
    });
    li.classList.toggle("ouvert", ouvert);
    const draw = () => {
      corps.replaceChildren();
      if (pz.interet) corps.append(el("p", { class: "piece-interet" }, pz.interet));
      if (pz.perso && !pz.analyse) corps.append(el("p", { class: "muted small quand-pz", text: "Je l'analyse à ton prochain bilan : sa difficulté, ce qu'il te fait travailler et ses passages difficiles." }));
      if (pz.techniques?.length) corps.append(el("div", { class: "tech" }, el("ul", {}, pz.techniques.map(t => el("li", { text: t })))));
      if (pz.difficultes?.length) corps.append(el("div", { class: "piece-diffs" }, el("span", { class: "eyebrow", text: "Les passages difficiles" }), el("ul", {}, pz.difficultes.map(t => el("li", { text: t })))));
      if (!pz.perso && lock) corps.append(el("p", { class: "muted small quand-pz", text: `${quandTxt(pz)} : tu peux l'écouter, et le travailler quand le cours t'aura donné sa technique.` }));
      else if (pz.mission && pz.id === "fragile" && sem > 4) corps.append(el("p", { class: "muted small quand-pz", text: "En entretien : une fois en entier au premier cours de chaque semaine." }));
      corps.append(ficheMorceau(pz, () => { const o = corps.querySelector(".ajout")?.open; draw(); if (o) corps.querySelector(".ajout").open = true; }));
      const mt = maitriserBox(pz); if (mt) corps.append(mt);
    };
    draw();
    // la ligne d'action : le bouton, puis le niveau et le style, discrets
    const tools = el("div", { class: "piece-actions" });
    const act = (text, fn, cls = "") => el("button", { class: "btn small pick-btn " + cls, type: "button", onclick: () => { fn(); refresh(); } }, text);
    if (lock) tools.append(el("button", { class: "btn small pick-btn", type: "button", disabled: true }, quandTxt(pz)));
    else if (st === "travail") {
      tools.append(act("✓ Je le maîtrise", () => { setStatut(pz, "maitrise"); Sons.bloc(); }, "maitrise-btn"));
      if (!pz.mission) tools.append(act("Je ne le travaille plus", () => setStatut(pz, ""), "ghost"));
    } else if (st === "maitrise") tools.append(act("Le retravailler", () => setStatut(pz, "travail")));
    else tools.append(act("Je le travaille", () => { setStatut(pz, "travail"); Sons.cling(); }, "primary"));
    const meta = el("span", { class: "piece-meta" },
      nv ? el("span", { class: "niveau n" + nv, title: "Difficulté dans son niveau" }, el("span", { class: "pts", "aria-hidden": "true", text: "●".repeat(nv) + "○".repeat(3 - nv) }), " " + NIVEAU[nv]) : null,
      !pz.perso && pz.style ? el("span", { class: "piece-style", text: pz.style }) : null);
    tools.append(meta);
    if (pz.perso) tools.append(el("button", { class: "link-btn", type: "button", text: "Supprimer", onclick: () => {
      if (!confirm(`Retirer « ${pz.titre} » de tes morceaux ?`)) return;
      (state.ajouts?.[pz.id]?.tabs || []).forEach(t => t.f && fichiers.del(t.f).catch(() => {}));
      delete state.ajouts?.[pz.id];
      state.mesPieces = (state.mesPieces || []).filter(x => x.id !== pz.id); delete state.morceaux?.[pz.id]; save(); refresh();
    } }));
    li.append(head, tools, corps);
    return li;
  }

  function renderMorceaux() {
    const body = $("#morceauxBody");
    const sem = semaineAtteinte(), all = tousMorceaux().sort(tri);
    const refresh = () => { const y = window.scrollY; renderMorceaux(); window.scrollTo({ top: y }); };
    const by = st => all.filter(pz => statutDe(pz, sem) === st);
    const enCours = by("travail").sort((a, b) => !!b.mission - !!a.mission), faits = by("maitrise");
    const miens = by("").filter(pz => pz.perso), possibles = by("").filter(pz => !pz.perso);
    body.replaceChildren(el("div", { class: "cours-head" },
      el("span", { class: "eyebrow", text: `Semaine ${Math.min(sem, 12)} du cours` }),
      el("h1", { text: "Mes morceaux" }),
      el("p", { class: "sub", text: "Ceux que tu travailles, ceux que tu as ajoutés, et ceux que je te conseille. Fragile et Bamboleo restent tes morceaux de base ; les autres sont en plus." })));
    const section = (titre, hint, ...kids) => body.append(el("section", { class: "card morceaux-sec" }, el("h2", { text: titre }), hint ? el("p", { class: "muted small", text: hint }) : null, ...kids));
    const swap = morceau(state.semaineMorceau?.[sem]);
    section("Je les travaille", swap ? `Cette semaine, dans le cours : ${swap.titre}, à la place de ta mission.` : "Ta mission du moment, et les morceaux que tu as choisis de travailler.",
      el("ul", { class: "pieces" }, enCours.map(pz => morceauCard(pz, sem, refresh))));
    const groupes = el("div", { class: "niveaux" });
    const palActuel = Math.min(3, DATA.cours.find(c => c.semaine === Math.min(sem, 12))?.palier || 1);
    for (const n of [1, 2, 3, 4]) {
      const list = possibles.filter(pz => pz.palier === n);
      if (!list.length) continue;
      const pc = DATA.cours.filter(c => c.palier === n), ouvKey = "niveau/" + n;
      const det = el("details", { class: "lvl", open: state.open[ouvKey] ?? n === palActuel },
        el("summary", { class: "lvl-head" }, el("strong", { text: `Niveau ${n} · ${NIVEAUX[n]}` }),
          el("span", { class: "muted small", text: `${pc.length ? `semaines ${pc[0].semaine} à ${pc.at(-1).semaine}` : "après le palier 3"} · ${list.length} morceau${list.length > 1 ? "x" : ""}` })),
        el("ul", { class: "pieces" }, list.map(pz => morceauCard(pz, sem, refresh))));
      det.addEventListener("toggle", () => { if (state.open[ouvKey] !== det.open) { state.open[ouvKey] = det.open; save(); } });
      groupes.append(det);
    }
    // un morceau à toi : il part dans ton bilan, et j'ajoute sa tablature et ses passages difficiles au cours
    const titre = el("input", { type: "text", placeholder: "Titre", "aria-label": "Titre du morceau" });
    const artiste = el("input", { type: "text", placeholder: "Artiste (facultatif)", "aria-label": "Artiste" });
    const lien = el("input", { type: "url", placeholder: "Lien YouTube (facultatif)", "aria-label": "Lien pour l'écouter" });
    const add = el("details", { class: "add-piece" }, el("summary", { text: "+ Ajouter un morceau à moi" }),
      el("p", { class: "muted small", text: "Un morceau qui te plaît, en dehors du cours. Il part dans ton bilan : j'analyse sa difficulté, ce qu'il te fait travailler et ses passages difficiles." }),
      titre, artiste, lien,
      el("button", { class: "btn primary", type: "button", onclick: () => {
        const t = titre.value.trim(); if (!t) { titre.focus(); return; }
        const u = lien.value.trim();
        (state.mesPieces ||= []).push({ id: "perso-" + Date.now().toString(36), titre: t, artiste: artiste.value.trim(), ecouter: /^https?:\/\//.test(u) ? u : "" });
        save(); Sons.cling(); toast(`« ${t} » ajouté à Mes morceaux.`); refresh();
      } }, "Ajouter"));
    section("Mes morceaux", miens.length ? "Ceux que tu as ajoutés. Touche « Je le travaille » quand tu veux t'y mettre." : null,
      miens.length ? el("ul", { class: "pieces" }, miens.map(pz => morceauCard(pz, sem, refresh))) : null, add);
    if (possibles.length) section("Les morceaux que je te conseille", "Choisis ceux qui te tentent. Rangés par niveau, du plus abordable au plus costaud ; chacun se débloque quand le cours t'a donné sa technique.", groupes);
    if (faits.length) section("Je les maîtrise", null, el("ul", { class: "pieces" }, faits.map(pz => morceauCard(pz, sem, refresh))));
  }

  // Dans le bloc Morceau : la mission reste le morceau de base ; on peut la changer pour une semaine seulement.
  function semaineCard(c) {
    const base = missionDe(c); if (!base) return null;
    const card = el("div", { class: "morceau-semaine" });
    const draw = () => {
      const sem = semaineAtteinte(c), pz = morceau(state.semaineMorceau?.[c.semaine]);
      card.classList.toggle("swapped", !!pz);
      const kids = [el("span", { class: "eyebrow", text: `Ton morceau de la semaine ${c.semaine}` })];
      if (pz) {
        kids.push(el("p", {}, el("strong", { text: pz.titre }), ` à la place de ${base.titre}. Fais les exercices ci-dessous avec ce morceau.`));
        kids.push(el("div", { class: "row-tools" },
          el("button", { class: "btn small", type: "button", onclick: () => { delete state.semaineMorceau[c.semaine]; save(); draw(); } }, `Revenir à ${base.titre}`)));
      } else {
        kids.push(el("p", { class: "small" }, el("strong", { text: base.titre }), ", ta mission. Tu peux le changer pour cette semaine seulement."));
        // la liste est faite au moment du toucher : elle suit ce que tu as changé dans « Mes morceaux »
        const list = el("div", { class: "swap-list", hidden: true });
        const ouvrir = () => {
          if (!list.hidden) { list.hidden = true; return; }
          const choix = tousMorceaux().filter(x => x.id !== base.id && !verrou(x, sem) && statutDe(x, sem) !== "maitrise")
            .sort((a, b) => (statutDe(b, sem) === "travail") - (statutDe(a, sem) === "travail") || tri(a, b));
          list.replaceChildren(...(choix.length ? choix.map(x => el("button", { class: "btn small", type: "button", onclick: () => {
            (state.semaineMorceau ||= {})[c.semaine] = x.id; save(); Sons.cling(); draw();
          } }, x.titre)) : [el("p", { class: "muted small", text: "Pas encore d'autre morceau débloqué : regarde dans « Mes morceaux »." })]));
          list.hidden = false;
        };
        kids.push(el("div", { class: "row-tools" },
          el("button", { class: "btn small", type: "button", onclick: ouvrir }, "Changer pour cette semaine"),
          el("button", { class: "link-btn", type: "button", text: "Voir tous mes morceaux →", onclick: () => go("morceaux") })), list);
      }
      // la vidéo et la tablature du morceau du moment, à portée de main pendant le bloc
      const cur = pz || base, ouvKey = "cours-fiche/" + cur.id;
      const det = el("details", { class: "mini fiche-cours", open: !!state.open[ouvKey] }, el("summary", { text: `Vidéo et tablature : ${cur.titre}` }),
        el("div", { class: "piece-corps" }, ficheMorceau(cur, () => { const o = det.querySelector(".ajout")?.open; draw(); const n = card.querySelector(".ajout"); if (n && o) n.open = true; }), maitriserBox(cur)));
      det.addEventListener("toggle", () => { if (!!state.open[ouvKey] !== det.open) { state.open[ouvKey] = det.open; save(); } });
      card.replaceChildren(...kids, det);
    };
    draw();
    return card;
  }

  // Révision : un exercice déjà vu dans un cours précédent, tiré au sort (le même pour un cours donné)
  function revisionCard(c, bi) {
    const seen = new Set(), pool = [];
    for (const x of DATA.cours) {
      if (x.num >= c.num) break;
      for (const e of x.blocs[bi]?.exercices || []) if (!/^Lire\b|^Étirements|^Jeu facile|Quiz/.test(e.label) && !seen.has(e.label)) { seen.add(e.label); pool.push({ e, num: x.num }); }
    }
    if (!pool.length) return null;
    const key = c.id + "/" + bi;
    const card = el("div", { class: "revision" });
    const draw = () => {
      const off = state.revOff?.[key] || 0;
      const p = pool[(c.num * 7 + bi * 13 + off) % pool.length];
      card.replaceChildren(
        el("span", { class: "eyebrow", text: "Révision tirée au sort · 2 min" }),
        el("p", { text: p.e.label }),
        el("div", { class: "row-tools" },
          el("span", { class: "muted small", text: `Vu au cours ${p.num}` }),
          el("button", { class: "link-btn", type: "button", text: "Une autre", onclick: () => { state.revOff ||= {}; state.revOff[key] = off + 1; save(); draw(); } })));
    };
    draw();
    return card;
  }

  // un bouton qui ouvre la position sur Mon manche
  function posBtn(pz) {
    const btn = el("button", { class: "btn small pos-btn", type: "button", title: "Voir sur le manche", onclick: () => go("manche", { pos: pz.code }) });
    btn.innerHTML = ICON_POS; btn.append(pz.label);
    return btn;
  }
  function renderExo(c, b, e, positions, onChange) {
    const key = exKey(b, e);
    const x = exState(c.id, key);
    const id = "x-" + c.id + "-" + key.replace(/\W/g, "-");
    const li = el("li", { class: "exo" + (x.done ? " is-done" : "") });
    const box = el("input", { type: "checkbox", class: "check", id, checked: !!x.done, "aria-label": e.label });
    box.addEventListener("change", () => { x.done = box.checked; li.classList.toggle("is-done", x.done); touch(c); save(); onChange(x.done); });
    const label = el("label", { class: "exo-label", for: id }, e.label, e.aide ? el("span", { class: "aide", text: e.aide }) : null);
    const main = el("div", { class: "exo-main" }, box, label);
    if (positions?.length) label.append(el("span", { class: "exo-pos" }, positions.map(posBtn)));
    // Tempo qui progresse : on part un peu sous la cible, +4 bpm après 3 passages propres d'affilée, jusqu'à la cible
    const depart = e.tempo ? Math.max(40, e.tempo - 10) : 0;
    const bpmNow = () => x.bpm ?? depart;
    const chip = e.tempo ? el("button", { class: "tempo-chip", type: "button", title: "Régler le métronome", onclick: () => openMetro(bpmNow()) }, `${bpmNow()} bpm`) : null;
    if (chip) main.append(chip);
    li.append(main);

    const progRow = e.tempo ? el("div", { class: "tempo-prog" }) : null;
    const drawProg = () => {
      if (!progRow) return;
      const passes = x.passes || 0;
      if (chip) chip.textContent = `${bpmNow()} bpm`;
      progRow.replaceChildren(
        el("span", {}, `Tu joues à ${bpmNow()} bpm, cible ${e.tempo}. `),
        el("span", { class: "muted small" }, `${passes}/3 passages propres`),
        el("button", { class: "link-btn", type: "button", text: "Propre", onclick: () => {
          x.passes = passes + 1;
          if (x.passes >= 3) {
            x.bpm = Math.min(e.tempo, bpmNow() + 4); x.passes = 0;
            toast(x.bpm >= e.tempo ? `Cible atteinte : ${e.tempo} bpm !` : `Monte à ${x.bpm} bpm.`);
          }
          touch(c); save(); drawProg(); onChange();
        } }),
        el("button", { class: "link-btn", type: "button", text: "Pas propre", onclick: () => { x.passes = 0; save(); drawProg(); } }),
      );
    };
    const moreRow = el("div", { class: "exo-more" });
    if (progRow) drawProg();
    const feel = el("div", { class: "feel", role: "group", "aria-label": "Ressenti" });
    [["facile", "Facile"], ["correct", "Correct"], ["galere", "Galère"]].forEach(([k, t]) => {
      const fb = el("button", { type: "button", "data-feel": k, "aria-pressed": String(x.feel === k), text: t });
      fb.addEventListener("click", () => {
        x.feel = x.feel === k ? undefined : k;
        feel.querySelectorAll("button").forEach(q => q.setAttribute("aria-pressed", String(q.dataset.feel === x.feel)));
        touch(c); save(); onChange();
      });
      feel.append(fb);
    });
    moreRow.append(feel);
    if (e.tempo) {
      const tin = el("input", { type: "number", inputmode: "numeric", min: "20", max: "260", placeholder: String(e.tempo), value: x.tempo ?? "", "aria-label": "Tempo atteint" });
      tin.addEventListener("input", () => { const v = parseInt(tin.value, 10); x.tempo = Number.isFinite(v) ? v : undefined; touch(c); save(); });
      moreRow.append(el("label", { class: "tempo-in" }, "Atteint", tin, "bpm"));
    }
    const noteWrap = el("div", { class: "note-field", hidden: !x.note });
    const ta = el("textarea", { rows: "2", placeholder: "Ce qui coince, une sensation, une question…", "aria-label": "Commentaire" });
    ta.value = x.note || "";
    ta.addEventListener("input", () => { x.note = ta.value.trim() ? ta.value : undefined; touch(c); save(); });
    noteWrap.append(ta);
    const nb = el("button", { class: "link-btn", type: "button", text: x.note ? "Commentaire" : "+ Commentaire" });
    nb.addEventListener("click", () => { noteWrap.hidden = !noteWrap.hidden; if (!noteWrap.hidden) ta.focus(); });
    moreRow.append(nb);
    li.append(...[progRow, moreRow, noteWrap].filter(Boolean));
    if (e.jeux?.length && window.Jeux) {
      const row = el("div", { class: "exo-jeux" });
      const last = el("p", { class: "jeu-last" });
      const showLast = () => {
        const r = Object.values(x.jeux || {}).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
        last.textContent = r ? "Dernier jeu · " + Jeux.resume(r) : ""; last.hidden = !r;
      };
      e.jeux.forEach(j => row.append(el("button", {
        class: "btn small jeu-btn", type: "button",
        onclick: () => Jeux.open(j, res => {
          x.jeux ||= {}; x.jeux[j.label] = res;
          let checked = false;
          if (!x.done && res.score / res.total >= 0.8) { x.done = checked = true; box.checked = true; li.classList.add("is-done"); }
          touch(c); save(); showLast(); onChange(checked);
        }),
      }, "▶ " + j.label)));
      showLast();
      li.append(row, last);
    }
    return li;
  }

  function touch(c) { const s = cs(c.id); s.startedAt ||= new Date().toISOString(); }

  function renderTests(c) {
    const s = cs(c.id);
    const card = el("section", { class: "card" },
      el("span", { class: "eyebrow", text: "Fin de palier" }),
      el("h2", { text: c.bilan.titre }),
      el("p", { class: "muted small", text: c.bilan.regle }));
    const ul = el("ul", { class: "tests" });
    c.bilan.tests.forEach(t => {
      const r = (s.tests[t.id] ||= {});
      const seg = el("div", { class: "feel", role: "group", "aria-label": "Résultat" });
      [["ok", "Réussi"], ["ko", "Pas encore"]].forEach(([k, lab]) => {
        const bt = el("button", { type: "button", "data-res": k, "aria-pressed": String(r.res === k), text: lab });
        bt.addEventListener("click", () => { r.res = r.res === k ? undefined : k; seg.querySelectorAll("button").forEach(q => q.setAttribute("aria-pressed", String(q.dataset.res === r.res))); touch(c); save(); });
        seg.append(bt);
      });
      const ta = el("textarea", { rows: "1", placeholder: "Ton résultat (tempo, temps par note…)", "aria-label": "Résultat du test" });
      ta.value = r.note || "";
      ta.addEventListener("input", () => { r.note = ta.value.trim() ? ta.value : undefined; save(); });
      ul.append(el("li", { class: "test" },
        el("div", { class: "test-top" }, el("div", {}, el("strong", { text: t.label }), el("div", { class: "obj", text: "Objectif : " + t.objectif })), seg),
        ta));
    });
    card.append(ul);
    return card;
  }

  function renderFin(c) {
    const s = cs(c.id);
    if (s.finishedAt) {
      const d = new Date(s.finishedAt);
      return el("section", { class: "card done-card" },
        el("span", { class: "eyebrow", text: "Cours terminé" }),
        el("p", { text: `Terminé le ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}` + (s.duree ? `, en ${s.duree} min.` : ".") }),
        el("button", { class: "btn primary", type: "button", onclick: () => showRecap(c) }, semaineDe(c.semaine).every(x => isDone(x.id)) || c.seance === "C" ? "Revoir et renvoyer mon bilan de la semaine" : "Voir mon bilan de la semaine (en cours)"),
        speakBtn(() => finSegs(c), "Écouter le bilan du prof", "Le prof te fait le compte-rendu du cours"),
        el("button", { class: "btn ghost", type: "button", onclick: () => { delete s.finishedAt; save(); renderTabs(); renderCours(); } }, "Rouvrir ce cours"));
    }
    const field = (k, label, hint) => {
      const ta = el("textarea", { rows: "2", placeholder: hint });
      ta.value = s[k] || "";
      ta.addEventListener("input", () => { s[k] = ta.value.trim() ? ta.value : undefined; save(); });
      return el("label", {}, label, ta);
    };
    const duree = el("input", { type: "number", inputmode: "numeric", min: "0", max: "300", placeholder: s.seance ? String(Math.max(1, Math.round(seanceMs(s) / 60000))) : "90", value: s.duree ?? "", "aria-label": "Durée en minutes" });
    duree.addEventListener("input", () => { const v = parseInt(duree.value, 10); s.duree = Number.isFinite(v) ? v : undefined; save(); });
    seanceUI.duree = duree;
    return el("section", { class: "card fin" },
      el("span", { class: "eyebrow", text: "Fin du cours" }),
      el("h2", { text: "Comment ça s'est passé ?" }),
      field("galere", "Là où j'ai galéré", "Un geste, un passage, une main qui fatigue…"),
      field("bien", "Ce qui a bien marché", "Ce qui est devenu plus facile, une petite victoire…"),
      field("autre", "Pour mon prof", "Une envie, une question, du temps en plus ou en moins…"),
      el("label", { class: "tempo-in", style: "flex-direction:row;font-weight:600;color:var(--ink)" }, "Durée de la séance", duree, "min"),
      s.seance ? el("p", { class: "muted small", text: "Laisse vide : le minuteur de séance la remplit tout seul." }) : null,
      el("button", { class: "btn ok big", type: "button", onclick: () => finish(c) }, "Terminer le cours"),
    );
  }

  // ---------- Le prof qui parle : intro au démarrage de la séance, bilan à « Terminer le cours » ----------
  // Tous les morceaux sont enregistrés d'avance (data/cours.json : prof, et les exercices) : seul l'assemblage dépend de toi.
  const lignes = t => String(t || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
  const profOn = () => { try { return localStorage.getItem("maguitare:prof") !== "0"; } catch { return true; } };
  const exNotes = c => allEx(c).map(a => ({ ...a, x: state.cours[c.id]?.ex[a.key] || {} }));
  function introSegs(c) {
    // l'accueil (en-tête du cours), le mot du prof, ce qui a coincé, puis le plan des 6 blocs (chaque bloc mis en avant)
    const P = DATA.prof, pr = c.prof || {};
    // le but et la mission du palier : leur carte s'il y en a une (premier cours du palier), sinon l'en-tête
    const S = (pr.intro || []).map(t => ({ t, cible: /^(On attaque le palier|Ta mission)/.test(t) && c.num % 12 === 1 ? "palier" : "tete" }));
    // le mot du prof : sa carte est mise en avant pendant qu'il le lit (même ordre que l'affichage)
    const mots = [...(c.mot ? [c.mot] : []), ...RETOURS.filter(r => r.pour === c.id).map(r => r.texte)];
    mots.forEach((m, k) => S.push(...lignes(m).map(t => ({ t, cible: "mot:" + k }))));
    const prev = DATA.cours[DATA.cours.indexOf(c) - 1];
    const dur = prev ? exNotes(prev).filter(a => a.x.feel === "galere").slice(0, 2) : [];
    if (dur.length) S.push(P.intro_galere, ...dur.map(a => a.e.label), P.intro_galere_fin);
    return [...S, ...(pr.intro_suite || []).map(t => ({ t, cible: "tete" })), ...(pr.plan || []).map(x => ({ t: x.t, cible: x.b })), ...(pr.intro_fin || []).map(t => ({ t, cible: 0 }))];
  }
  function finSegs(c) {
    const P = DATA.prof, pr = c.prof || {}, s = cs(c.id), all = exNotes(c);
    const S = [...(pr.fin || [])];
    const q = progressOf(c), r = q.total ? q.done / q.total : 0;
    S.push(r >= 1 ? P.tout : r >= .8 ? P.presque : r >= .5 ? P.moitie : P.peu);
    if (s.duree >= 5) S.push(P.minutes[String(Math.min(120, Math.round(s.duree / 5) * 5))]);
    const fac = all.filter(a => a.x.feel === "facile").slice(0, 2), gal = all.filter(a => a.x.feel === "galere").slice(0, 3);
    if (fac.length) S.push(P.facile, ...fac.map(a => a.e.label));
    if (gal.length) S.push(P.galere, ...gal.map(a => a.e.label), P.galere_fin);
    else if (r >= .8) S.push(P.rien_galere);
    const up = all.filter(a => a.e.tempo && a.x.bpm > Math.max(40, a.e.tempo - 10)).length;
    if (up) S.push(P.tempo[String(Math.min(12, up))]);
    const envoi = c.seance === "C" || semaineDe(c.semaine).every(x => x.id === c.id || isDone(x.id));
    S.push(...(pr.fin_suite || []), envoi ? P.envoie : P.envoie_plus_tard);
    return S.filter(Boolean);
  }

  function finish(c) {
    const s = cs(c.id);
    seancePause(c.id);
    const ms = seanceMs(s);
    if (s.duree == null && ms >= 60000) s.duree = Math.round(ms / 60000);
    s.finishedAt = new Date().toISOString();
    flush();
    renderTabs(); renderCours(); updateSeance();
    const g = Sons.musiqueCours(c.num, c.blocs.map(b => b.exercices.length));
    const musique = g ? ` Ta musique du cours, en ${g.nom}.` : "";
    // un bilan par semaine : il part quand la semaine est finie, ou à la séance C
    const envoi = c.seance === "C" || semaineDe(c.semaine).every(x => isDone(x.id));
    if (envoi) { showRecap(c); if (musique) toast(musique.trim()); }
    else toast(`Cours ${c.num} terminé !${musique} Ton bilan partira à la fin de la semaine, après le cours ${c.semaine * 3}.`);
    // le prof parle quand la musique est finie
    if (profOn()) setTimeout(() => { if (!envoi || recapSheet.open) Sons.dire(finSegs(c), { force: true }); }, Math.max(1600, (g?.duree || 0) * 1000));
  }

  // ---------- Minuteur de séance : de « Démarrer » à « Terminer le cours » ----------
  const seanceMs = s => (s?.seance ? s.seance.acc + (s.seance.start ? Date.now() - s.seance.start : 0) : 0);
  const fmt = ms => {
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
  };
  let seanceUI = {}, seanceTick = null;
  const seanceChip = $("#seanceChip");
  function seancePause(id) {
    const s = state.cours[id];
    if (s?.seance?.start) { s.seance.acc += Date.now() - s.seance.start; s.seance.start = null; }
  }
  function seanceStart(c) {
    Object.keys(state.cours).forEach(id => { if (id !== c.id) seancePause(id); });
    const s = cs(c.id);
    if (!s.seance && profOn() && Reglages.get("introAuto")) setTimeout(() => parle(introSegs(c)), 700); // première fois : le prof présente le cours
    s.seance ||= { acc: 0, start: null };
    s.seance.start ||= Date.now();
    touch(c); flush(); updateSeance();
    Sons.unlock(); Sons.cling();
  }
  function seanceReset(c) {
    if (!confirm(`Remettre le minuteur de séance du cours ${c.num} à zéro ?`)) return;
    delete cs(c.id).seance; flush(); updateSeance();
    toast("Minuteur de séance remis à zéro.");
  }
  function seanceToggle(c) {
    const s = cs(c.id);
    if (s.seance?.start) { seancePause(c.id); flush(); updateSeance(); toast("Séance en pause."); }
    else { const again = !!s.seance?.acc; seanceStart(c); toast(again ? "C'est reparti !" : "Séance lancée. Bonne pratique !"); }
  }
  // La séance affichée en haut : celle qui tourne, sinon celle en pause du cours ouvert.
  function seanceShown() {
    if (!DATA) return null;
    const run = DATA.cours.find(c => state.cours[c.id]?.seance?.start);
    if (run) return run;
    const cur = byId(state.current);
    return cur && !isDone(cur.id) && state.cours[cur.id]?.seance?.acc ? cur : null;
  }
  function updateSeance() {
    const c = seanceShown(), s = c && state.cours[c.id], running = !!s?.seance?.start;
    seanceChip.hidden = !c;
    if (c) {
      seanceChip.querySelector("b").textContent = fmt(seanceMs(s));
      seanceChip.classList.toggle("paused", !running);
      seanceChip.title = `Séance du cours ${c.num} : touche pour la mettre en pause, la reprendre ou la remettre à zéro`;
    }
    for (const id in state.cours) {
      const sc = state.cours[id];
      if (sc?.seance?.start && !sc.seance.pausa && seanceMs(sc) >= 50 * 60000) { sc.seance.pausa = true; save(); toast("Mi-séance, après le bloc 3 : fais une pause de 2 minutes, lâche tes mains."); }
    }
    const u = seanceUI;
    if (u.card && u.c) {
      const us = state.cours[u.c.id], on = !!us?.seance?.start, has = !!us?.seance;
      u.card.dataset.state = on ? "on" : has ? "pause" : "off";
      u.time.textContent = has ? fmt(seanceMs(us)) : "0:00";
      u.label.textContent = on ? "Séance en cours" : has ? "Séance en pause" : "Minuteur de séance";
      u.btn.textContent = on ? "Pause" : has ? "Reprendre" : "▶ Démarrer";
      u.btn.className = "btn " + (on ? "" : "primary");
      u.reset.hidden = !has;
      if (u.duree && has) u.duree.placeholder = String(Math.max(1, Math.round(seanceMs(us) / 60000)));
    }
    updateTimers();
    const any = DATA?.cours.some(x => state.cours[x.id]?.seance?.start);
    if (any && !seanceTick) seanceTick = setInterval(updateSeance, 1000);
    if (!any && seanceTick) { clearInterval(seanceTick); seanceTick = null; }
    ecran();
  }
  seanceChip.addEventListener("click", () => openTimers());
  function renderSeance(c) {
    const time = el("b", { class: "seance-time" }), label = el("span", { class: "eyebrow" });
    const btn = el("button", { type: "button", onclick: () => seanceToggle(c) });
    const reset = el("button", { class: "icon-btn", type: "button", title: "Remettre à zéro", "aria-label": "Remettre le minuteur de séance à zéro", text: "↺", hidden: true, onclick: () => seanceReset(c) });
    const card = el("section", { class: "card seance-card" },
      withIcon(el("div", { class: "seance-ic" }), ICON_TIMER),
      el("div", { class: "seance-txt" }, label, time, el("span", { class: "muted small", text: "Il s'arrête quand tu touches « Terminer le cours »." })),
      el("div", { class: "seance-btns" }, reset, btn),
      c.prof ? el("div", { class: "seance-intro" }, speakBtn(() => introSegs(c), "Intro du prof", "Le prof présente le cours : le palier, les objectifs, le programme")) : null);
    seanceUI = { c, card, time, label, btn, reset, duree: null };
    requestAnimationFrame(updateSeance);
    return card;
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) updateSeance(); });

  // ---------- Bilan envoyé au prof ----------
  const FEEL = { facile: "facile", correct: "correct", galere: "GALÈRE" };
  // Un bilan par semaine : les 3 séances regroupées, exercice par exercice (elles reprennent les mêmes exercices).
  const semaineDe = w => DATA.cours.filter(x => x.semaine === w);
  function recapSemaine(w) {
    const wk = semaineDe(w), c0 = wk[0], faits = wk.filter(x => isDone(x.id));
    const last = faits.map(x => state.cours[x.id].finishedAt).sort().at(-1);
    const L = [];
    L.push(`Bilan de la semaine ${w} (cours ${wk.map(x => x.num).join(", ").replace(/, (\d+)$/, " et $1")}, palier ${c0.palier}) — ${(last ? new Date(last) : new Date()).toLocaleDateString("fr-FR")}`);
    const durees = faits.map(x => state.cours[x.id].duree).filter(Boolean);
    const pas = wk.filter(x => !isDone(x.id));
    L.push(`Cours terminés : ${faits.length ? faits.map(x => x.num).join(", ") : "aucun"}` + (pas.length ? ` · pas terminé${pas.length > 1 ? "s" : ""} : ${pas.map(x => x.num).join(", ")}` : "")
      + (durees.length ? ` · durée ${durees.reduce((a, b) => a + b, 0)} min (${durees.join(" + ")})` : ""));
    const tot = wk.reduce((n, x) => { const q = progressOf(x); n[0] += q.done; n[1] += q.total; return n; }, [0, 0]);
    L.push(`Fait : ${tot[0]}/${tot[1]} exercices`);
    const swap = morceau(state.semaineMorceau?.[w]);
    if (swap) L.push(`Morceau de la semaine : ${swap.titre} (à la place de ${missionDe(c0)?.titre})`);
    const sem = semaineAtteinte(c0), nom = x => x.titre + (x.perso && x.artiste ? ` (${x.artiste})` : "") + (x.perso ? ", ajouté par moi" : "");
    const aussi = tousMorceaux().filter(x => !x.mission && statutDe(x, sem) === "travail").map(nom);
    if (aussi.length) L.push("Je travaille aussi : " + aussi.join(", "));
    const aAnalyser = tousMorceaux().filter(x => x.perso && !x.analyse);
    if (aAnalyser.length) L.push("Morceaux ajoutés, à analyser : " + aAnalyser.map(x => x.titre + (x.artiste ? ` (${x.artiste})` : "") + (x.ecouter ? ` ${x.ecouter}` : "")).join(" ; "));
    c0.blocs.forEach((b, bi) => {
      L.push(""); L.push(b.titre);
      const groups = new Map(); // un exercice, et ce que tu en as dit à chaque séance
      for (const x of wk) for (const e of x.blocs[bi]?.exercices || []) {
        if (!groups.has(e.label)) groups.set(e.label, { e, occ: [] });
        groups.get(e.label).occ.push({ c: x, v: state.cours[x.id]?.ex[exKey(x.blocs[bi], e)] || {} });
      }
      for (const { e, occ } of groups.values()) {
        const n = occ.filter(o => o.v.done).length, bits = [];
        const fe = {}; occ.forEach(o => { if (o.v.feel) fe[o.v.feel] = (fe[o.v.feel] || 0) + 1; });
        for (const k of ["facile", "correct", "galere"]) if (fe[k]) bits.push(FEEL[k] + (fe[k] > 1 ? ` ×${fe[k]}` : ""));
        const tp = Math.max(0, ...occ.map(o => o.v.tempo || 0));
        if (tp) bits.push(`${tp} bpm` + (e.tempo ? ` (objectif ${e.tempo})` : ""));
        L.push(`[${n}/${occ.length}] ${e.label}` + (bits.length ? " — " + bits.join(", ") : ""));
        for (const o of occ) {
          if (o.v.note) L.push(`    « cours ${o.c.num} : ${o.v.note.trim().replace(/\s*\n\s*/g, " / ")} »`);
          for (const r of Object.values(o.v.jeux || {})) L.push(`    Jeu, cours ${o.c.num} : ${window.Jeux ? Jeux.resume(r) : r.label}`);
        }
      }
    });
    // les jeux à niveaux joués cette semaine : par jeu et par niveau, le meilleur score, les essais, les notes, et ce qui coince le plus
    const NOMS_JEUX = { manche: "Notes du manche", gammes: "Gammes", penta: "Pentatonique", accords: "Accords", revision: "Révision du jour" };
    const parties = (state.niveaux?.log || []).filter(r => r.w === w);
    if (parties.length) {
      const groupes = new Map(), fautes = new Map();
      for (const r of parties) {
        const k = r.f + "|" + r.n, g = groupes.get(k) || { r, n: 0, q: 0, notes: 0, x: 0, e: 0, dt: 0, cours: new Set() };
        g.n++; g.q += r.t || 0; g.notes += r.no || 0; g.x += r.x || 0; g.e += r.e || 0; g.dt += r.dt || 0;
        if (r.s > g.r.s) g.r = r;
        if (r.src?.startsWith("cours:")) g.cours.add(r.src.slice(6));
        groupes.set(k, g);
        for (const [lab, n] of r.r || []) fautes.set(lab, (fautes.get(lab) || 0) + n);
      }
      L.push(""); L.push("Jeux à niveaux");
      for (const g of groupes.values()) {
        const r = g.r, bits = [`${g.n} partie${g.n > 1 ? "s" : ""}`];
        if (g.notes) bits.push(`${g.notes} notes demandées`);
        if (g.x) bits.push(`${g.x} essais, dont ${g.e} faute${g.e > 1 ? "s" : ""}`);
        if (g.dt >= 60) bits.push(`${Math.round(g.dt / 60)} min`);
        if (g.cours.size) bits.push(`joué pendant le cours ${[...g.cours].join(", ")}`);
        L.push(`${NOMS_JEUX[r.f] || r.f}${r.n ? `, niveau ${r.n}` : ""} : ${r.n === 10 ? `meilleure série ${r.s}` : `meilleur score ${r.s}/${r.t}`} (${bits.join(", ")})`);
      }
      const top = [...fautes].sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (top.length) L.push("Ce qui coince le plus : " + top.map(([lab, n]) => `${lab}${n > 1 ? ` ×${n}` : ""}`).join(" · "));
    }
    for (const x of wk) if (x.bilan) {
      const s = cs(x.id);
      L.push(""); L.push(x.bilan.titre);
      for (const t of x.bilan.tests) {
        const r = s.tests[t.id] || {};
        L.push(`${r.res === "ok" ? "[réussi]" : r.res === "ko" ? "[pas encore]" : "[non fait]"} ${t.label} (objectif : ${t.objectif})` + (r.note ? ` — ${r.note.trim()}` : ""));
      }
    }
    const add = (lab, k) => {
      const v = wk.filter(x => state.cours[x.id]?.[k]?.trim()).map(x => `(cours ${x.num}) ${state.cours[x.id][k].trim().replace(/\s*\n\s*/g, " / ")}`);
      if (v.length) { L.push(""); L.push(lab + " : " + v.join(" · ")); }
    };
    add("Là où j'ai galéré", "galere");
    add("Ce qui a bien marché", "bien");
    add("Pour mon prof", "autre");
    L.push("");
    L.push("Fais-moi la synthèse, un petit récap, et adapte la semaine suivante dans l'app.");
    return L.join("\n");
  }

  const recapSheet = $("#recapSheet");
  let recapCurrent = "";
  function showRecap(c) {
    recapCurrent = recapSemaine(c.semaine);
    $("#recapTitle").textContent = `Ton bilan de la semaine ${c.semaine}`;
    $("#recapVoix").replaceChildren(speakBtn(() => finSegs(c), "Écouter le bilan du prof", "Le prof te fait le compte-rendu du cours"));
    $("#recapText").textContent = recapCurrent;
    $("#recapStatus").textContent = "";
    $("#recapShare").hidden = !navigator.share;
    openSheet(recapSheet);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = el("textarea", { style: "position:fixed;opacity:0" }); ta.value = text; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {} ta.remove(); return ok;
    }
  }
  recapSheet.addEventListener("close", () => Sons.tais());
  $("#recapCopy").addEventListener("click", async () => {
    $("#recapStatus").textContent = (await copy(recapCurrent))
      ? "Copié. Ouvre ton projet Guitare sur Claude et colle-le dans la conversation."
      : "La copie n'a pas marché : sélectionne le texte au-dessus et copie-le.";
  });
  $("#recapShare").addEventListener("click", async () => {
    await copy(recapCurrent);
    try {
      await navigator.share({ title: "Bilan de guitare", text: recapCurrent });
      $("#recapStatus").textContent = "Envoyé. Si tu l'as partagé vers l'app Claude, pense à le mettre dans ton projet Guitare.";
    } catch (err) {
      if (err?.name !== "AbortError") $("#recapStatus").textContent = "Le partage n'a pas marché. Le texte est copié : colle-le dans ton projet Guitare sur Claude.";
    }
  });
  $("#recapOpen").href = PROJECT_URL;

  // ---------- Mon bilan ----------
  function renderBilan() {
    const body = $("#bilanBody");
    body.replaceChildren();
    const done = DATA.cours.filter(c => isDone(c.id));
    const totalMin = done.reduce((n, c) => n + (state.cours[c.id].duree || 70), 0);
    const nxt = nextCours();
    body.append(el("div", { class: "cours-head" },
      el("span", { class: "eyebrow", text: "Mon bilan" }),
      el("h1", { text: done.length ? `${done.length} cours terminé${done.length > 1 ? "s" : ""}` : "Tout commence ici" }),
      el("p", { class: "sub", text: done.length ? `Prochain : Cours ${nxt.num} (${nxt.titre}).` : "Termine ton premier cours pour voir tes progrès." })));

    body.append(el("div", { class: "stats" },
      el("div", { class: "stat" }, el("b", { text: String(done.length) }), el("span", { text: `cours sur ${DATA.cours.length}` })),
      el("div", { class: "stat" }, el("b", { text: String(Math.floor(totalMin / 60)) + " h" + (totalMin % 60 ? " " + String(totalMin % 60).padStart(2, "0") : "") }), el("span", { text: "de pratique" })),
      el("div", { class: "stat" }, el("b", { text: "Palier " + nxt.palier }), el("span", { text: palierOf(nxt).nom })),
    ));
    body.append(renderProgression());
    body.append(renderConstruction());

    // Les retours du prof
    if (RETOURS.length) {
      const recap = r => {
        const box = el("div", { class: "card prof-card", style: "margin-top:10px" }, el("span", { class: "eyebrow", text: (r.date ? new Date(r.date).toLocaleDateString("fr-FR") + " · " : "") + (r.titre || "Récap") }));
        String(r.texte).split(/\n+/).forEach(t => box.append(el("p", { text: t })));
        return box;
      };
      // le dernier récap en entier, les précédents repliés
      const [dernier, ...avant] = [...RETOURS].reverse();
      const card = el("section", { class: "card" }, el("h2", { text: "Les récaps du prof" }), recap(dernier));
      if (avant.length) {
        const d = el("details", { class: "mini" }, el("summary", { text: avant.length > 1 ? `Les ${avant.length} récaps précédents` : "Le récap précédent" }));
        d.addEventListener("toggle", () => { if (d.open && d.children.length === 1) d.append(...avant.map(recap)); });
        card.append(d);
      }
      body.append(card);
    }

    // Ce qui coince le plus (dernières galères)
    const galeres = [];
    for (const c of DATA.cours) {
      const s = state.cours[c.id]; if (!s) continue;
      for (const { b, e, key } of allEx(c)) {
        const x = s.ex[key]; if (x?.feel === "galere") galeres.push({ c, e, x });
      }
    }
    if (galeres.length) {
      const g = el("div", { class: "galeres" });
      galeres.slice(-8).reverse().forEach(({ c, e, x }) => g.append(el("div", { class: "g" },
        el("span", {}, e.label, x.note ? el("small", { class: "muted", style: "display:block", text: x.note }) : null),
        el("span", { class: "pill galere", text: "Cours " + c.num }))));
      body.append(el("section", { class: "card" }, el("h2", { text: "Là où ça coince" }), el("p", { class: "muted small", style: "margin:4px 0 8px", text: "Tes derniers exercices marqués « Galère »." }), g));
    }

    // Historique
    if (done.length) {
      // une ligne par semaine : son bilan regroupe ses 3 séances
      const ul = el("ul", { class: "list" });
      [...new Set(done.map(c => c.semaine))].reverse().forEach(w => {
        const wk = semaineDe(w), f = wk.filter(c => isDone(c.id));
        const last = f.map(c => state.cours[c.id].finishedAt).sort().at(-1);
        ul.append(el("li", {},
          el("span", { class: "t" }, "Semaine " + w, el("small", { text: `${f.length} cours sur ${wk.length} terminé${f.length > 1 ? "s" : ""} (${f.map(c => c.num).join(", ").replace(/, (\d+)$/, " et $1")}) · ${new Date(last).toLocaleDateString("fr-FR")}` })),
          el("button", { class: "btn small", type: "button", onclick: () => showRecap(f.at(-1)) }, "Bilan")));
      });
      body.append(el("section", { class: "card" }, el("h2", { text: "Mes semaines" }), el("div", { style: "height:8px" }), ul));
    }

    body.append(pliSons(), pliReglages(), pliDonnees());
  }

  // un interrupteur (Sons et voix, Réglages)
  function interrupteur(get, set) {
    const b = el("button", { class: "switch", type: "button", role: "switch", "aria-checked": String(!!get()) });
    b.addEventListener("click", () => { set(!get()); b.setAttribute("aria-checked", String(!!get())); });
    return b;
  }
  // Mon bilan › Sons et voix
  function pliSons() {
    // Choix de la voix : la liste vient de voix/voix.json (une voix « prete » a toutes ses phrases enregistrées)
    function choixVoix() {
      const list = el("div", { class: "voix-list", role: "radiogroup", "aria-label": "Voix du prof" });
      const wrap = el("div", { class: "voix-choix" }, el("strong", { text: "La voix du prof" }),
        el("span", { class: "muted small", text: "Touche ▶ pour écouter une voix, puis touche son nom pour la choisir." }), list);
      fetch("voix/voix.json").then(r => r.json()).then(({ exemple, voix }) => {
        const sync = () => list.querySelectorAll(".voix-opt").forEach(o => o.setAttribute("aria-checked", String(o.dataset.id === Sons.voixNom)));
        voix.forEach(v => {
          const opt = el("button", { class: "voix-opt", type: "button", role: "radio", "data-id": v.id, disabled: !v.prete },
            el("span", { class: "voix-nom" }, el("b", { text: v.nom }), el("span", { class: "muted small", text: " · " + v.genre })),
            el("span", { class: "muted small", text: v.prete ? v.desc : "Pas encore enregistrée." }));
          opt.addEventListener("click", () => { Sons.voixNom = v.id; sync(); Sons.dire(exemple, { force: true }); });
          const play = el("button", { class: "icon-btn voix-play", type: "button", "aria-label": "Écouter " + v.nom, disabled: !v.prete }, "▶");
          play.addEventListener("click", () => Sons.dire(exemple, { force: true, nom: v.id }));
          list.append(el("div", { class: "voix-row" }, opt, play));
        });
        if (!voix.some(v => v.id === Sons.voixNom && v.prete)) Sons.voixNom = "siwis";
        sync();
      }).catch(() => wrap.remove());
      return wrap;
    }

    // Sons et voix
    const toggle = (label, hint, get, set) =>
      el("div", { class: "setting" }, el("div", {}, el("strong", { text: label }), el("span", { class: "muted small", text: hint })), interrupteur(get, set));
    const reglages = el("div", { class: "pli-pile" },
      toggle("Petits sons", "Chaque exercice coché joue la note suivante de la gamme du cours, une double note finit chaque bloc, et une petite musique finit le cours.", () => Sons.sfx, v => { Sons.sfx = v; if (v) Sons.cling(); }));
    reglages.append(toggle("Voix dans les jeux", "Une voix naturelle lit les questions et les réponses des jeux.", () => Sons.voix, v => { Sons.voix = v; if (v) Sons.dire("D'accord, je lis les consignes des jeux."); }));
    reglages.append(toggle("Le prof te parle", "Il présente le cours quand tu lances la séance, et fait le bilan quand tu le termines.", profOn, v => { try { localStorage.setItem("maguitare:prof", v ? "1" : "0"); } catch {} if (!v) Sons.tais(); }));
    reglages.append(choixVoix());
    reglages.append(el("p", { class: "muted small", text: "Dans chaque bloc, les boutons « Écouter » lisent la consigne, le « pourquoi » et l'explication. Les phrases sont enregistrées d'avance : une phrase toute neuve (après une adaptation du cours) est lue par la voix de ton appareil, le temps que je l'enregistre." }));
    return pli("sons", "Sons et voix", el("span", { class: "muted small", text: "Les petits sons, la voix des jeux, et la voix du prof." }), () => reglages);
  }
  // Mon bilan › Réglages
  function pliReglages() {
    // Réglages : volumes, voix du prof, affichage, rappel de séance (reglages.js les garde et les applique partout)
    const R = window.Reglages;
    const ligne = (label, hint, ctrl) => el("div", { class: "reglage" }, el("div", {}, el("strong", { text: label }), hint ? el("span", { class: "muted small", text: hint }) : null), ctrl);
    const curseur = (k, min, max, step, txt, apres) => {
      const out = el("span", { class: "reglage-val", text: txt(R.get(k)) });
      const r = el("input", { type: "range", min, max, step, value: R.get(k), "aria-label": txt(R.get(k)) });
      r.addEventListener("input", () => { const v = +r.value; R.set(k, v); out.textContent = txt(v); r.setAttribute("aria-label", txt(v)); });
      if (apres) r.addEventListener("change", () => apres(+r.value));
      return el("div", { class: "reglage-curseur" }, r, out);
    };
    const choix = (k, opts, apres) => {
      const g = el("div", { class: "seg", role: "group" });
      const sync = () => g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === String(R.get(k)))));
      opts.forEach(([v, t]) => g.append(el("button", { type: "button", "data-v": String(v), text: t, onclick: () => { R.set(k, v); sync(); apres?.(v); } })));
      sync(); return g;
    };
    const oui = (k, apres) => interrupteur(() => R.get(k), v => { R.set(k, v); apres?.(R.get(k)); });
    const pct = v => Math.round(v) + " %";
    const titreR = t => el("p", { class: "eyebrow reglage-titre", text: t });
    const JOURS = [["MO", "Lun"], ["TU", "Mar"], ["WE", "Mer"], ["TH", "Jeu"], ["FR", "Ven"], ["SA", "Sam"], ["SU", "Dim"]];
    function blocRappel() {
      const rp = R.get("rappel"), jours = new Set(rp.jours);
      const g = el("div", { class: "seg jours", role: "group", "aria-label": "Jours de séance" });
      JOURS.forEach(([v, t]) => {
        const b = el("button", { type: "button", "data-v": v, text: t, "aria-pressed": String(jours.has(v)) });
        b.addEventListener("click", () => { jours.has(v) ? jours.delete(v) : jours.add(v); b.setAttribute("aria-pressed", String(jours.has(v))); R.set("rappel", { ...R.get("rappel"), jours: JOURS.map(j => j[0]).filter(j => jours.has(j)) }); });
        g.append(b);
      });
      const h = el("input", { type: "time", value: rp.heure, "aria-label": "Heure de la séance" });
      h.addEventListener("change", () => { if (h.value) R.set("rappel", { ...R.get("rappel"), heure: h.value }); });
      const go = el("button", { class: "btn primary", type: "button", text: "Ajouter à mon calendrier", onclick: () => {
        const r = R.get("rappel"); if (!r.jours.length) { toast("Choisis au moins un jour."); return; }
        calendrier(r);
      } });
      return el("div", { class: "pli-pile" }, g, el("div", { class: "row-tools" }, h, go),
        el("p", { class: "muted small", text: "L'app prépare un rappel qui revient chaque semaine. Ouvre le fichier : ton Calendrier (Mac ou iPhone) l'ajoute et te prévient à l'heure de la séance." }));
    }
    const panneau = () => el("div", { class: "pli-pile reglages" },
      titreR("Sons"),
      ligne("Volume des sons", "La guitare, les petits sons, les jeux et Mon manche.", curseur("volSons", 0, 100, 5, pct, () => Sons.cling())),
      ligne("Volume du métronome", null, curseur("volMetro", 0, 100, 5, pct, () => { const c = Sons.ctx(); Sons.unlock(); click(c.currentTime + 0.05, true); })),
      titreR("Voix du prof"),
      ligne("Vitesse de la voix", "Elle garde sa hauteur, plus lente ou plus rapide.", curseur("vitesseVoix", 0.8, 1.3, 0.05, v => "× " + (+v).toFixed(2).replace(/0$/, "").replace(".", ","), () => { Sons.unlock(); fetch("voix/voix.json").then(r => r.json()).then(v => Sons.dire(v.exemple, { force: true })).catch(() => {}); })),
      ligne("Présentation du cours", "Le prof présente le cours dès que tu le lances. Le bouton « Écouter » reste là.", oui("introAuto")),
      titreR("Affichage"),
      ligne("Animation pendant la voix", "La partie annoncée grossit et l'écran la suit.", oui("animation", v => { if (!v) montre(null); })),
      ligne("Noms des notes", "Dans les jeux et Mon manche. La voix et les textes du cours restent en Do Ré Mi.", choix("notation", [["fr", "Do Ré Mi"], ["en", "C D E"]])),
      ligne("Manche pour gaucher", "Les manches des jeux et de Mon manche sont dessinés à l'envers.", oui("gaucher")),
      ligne("Thème", null, choix("theme", [["auto", "Auto"], ["light", "Clair"], ["dark", "Sombre"]])),
      ligne("Taille du texte", null, choix("texte", [[0.9, "Petit"], [1, "Normal"], [1.15, "Grand"], [1.3, "Très grand"]])),
      titreR("Rappel de séance"),
      blocRappel());
    return pli("reglages", "Réglages", el("span", { class: "muted small", text: "Volumes, vitesse de la voix, affichage, rappel de séance." }), panneau);
  }
  // Mon bilan › Mes données
  function pliDonnees() {
    // Sauvegarde
    const fileIn = el("input", { type: "file", accept: "application/json,.json", hidden: true });
    fileIn.addEventListener("change", async () => {
      const f = fileIn.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || typeof data.cours !== "object") throw new Error();
        restaure(data, "Sauvegarde restaurée.");
      } catch { toast("Ce fichier n'est pas une sauvegarde de Ma gratte."); }
    });
    return pli("donnees", "Mes données", el("span", { class: "muted small", text: "Sauvegarder, restaurer, chercher une mise à jour du cours." }), () => el("div", { class: "pli-pile" },
      el("p", { class: "muted small", text: "Tes cases, tempos, commentaires et morceaux restent dans ce navigateur. L'app installée sur ton Mac, Safari, Chrome et ton téléphone ont chacun les leurs : pour les retrouver ailleurs, copie le lien ci-dessous et ouvre-le là-bas." }),
      el("div", { class: "row-tools" },
        el("button", { class: "btn primary", type: "button", onclick: lienTransfert }, "Copier le lien de mes données")),
      el("p", { class: "muted small", text: "Fais aussi une sauvegarde de temps en temps (les photos et PDF de tablatures n'y sont pas)." }),
      el("div", { class: "row-tools" },
        el("button", { class: "btn", type: "button", onclick: exportData }, "Sauvegarder"),
        el("button", { class: "btn", type: "button", onclick: () => fileIn.click() }, "Restaurer"),
        el("button", { class: "btn", type: "button", onclick: checkUpdate }, "Chercher une mise à jour du cours")),
      fileIn,
      el("p", { class: "muted small", text: `Cours mis à jour le ${new Date(DATA.maj).toLocaleDateString("fr-FR")}.` })));
  }

  // ---------- Jeux à niveaux (niveaux.js) ----------
  // Le niveau proposé par chaque bloc, semaine par semaine (1 à 12), en lien avec ce que le bloc enseigne.
  const JEU_BLOC = {
    1: { f: "gammes", sem: [1, 2, 3, 3, 4, 5, 6, 7, 8, 8, 9, 10] },  // gamme : Do majeur, Sol majeur, La majeur, La mineur
    2: { f: "penta", sem: [1, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 9] },    // pentatonique : positions 1 à 5, et seulement elle
    3: { f: "manche", sem: [3, 3, 4, 4, 5, 5, 5, 5, 6, 7, 8, 9] },   // notes du manche : la corde du moment
    4: { f: "accords", sem: [5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10] }, // barrés : forme Mi, forme La, partout, à l'oreille
  };
  const NIV = () => window.Jeux?.niveaux;
  if (window.Jeux) {
    Jeux.memoire = () => (state.niveaux ||= {});
    Jeux.sauve = save;
    Jeux.semaine = () => nextCours().semaine;
    // le cours ouvre d'office les niveaux de sa semaine
    Jeux.niveauCours = f => Math.max(1, ...Object.values(JEU_BLOC).filter(x => x.f === f).map(x => x.sem[Math.min(11, nextCours().semaine - 1)]));
  }
  const dernierEssai = (f, n) => (state.niveaux?.log || []).filter(x => x.f === f && x.n === n).at(-1);

  // Dans un bloc : son jeu au niveau de la semaine, avec − et + pour descendre ou monter
  function jeuBloc(c, bi) {
    const J = JEU_BLOC[bi], N = NIV(); if (!J || !N) return null;
    const F = N.FAMILLES[J.f];
    let n = J.sem[Math.min(11, c.semaine - 1)];
    const titre = el("strong"), desc = el("span", { class: "muted small" }), last = el("p", { class: "jeu-last" });
    const moins = el("button", { class: "icon-btn niv-step", type: "button", "aria-label": "Niveau plus facile", text: "−" });
    const plus = el("button", { class: "icon-btn niv-step", type: "button", "aria-label": "Niveau plus dur", text: "+" });
    const sync = () => {
      const max = N.debloque(J.f);
      titre.textContent = `${F.titre} · niveau ${n}`; desc.textContent = F.niveaux[n - 1].txt;
      moins.disabled = n <= 1; plus.disabled = n >= Math.min(10, max);
      const r = dernierEssai(J.f, n), best = N.etat(J.f).best[n];
      last.textContent = r ? `Dernier essai : ${n === 10 ? "série de " + r.s : r.s + "/" + r.t}` + (best != null ? ` · record ${n === 10 ? best : best + "/10"}` : "") : "";
      last.hidden = !r;
    };
    moins.addEventListener("click", () => { n--; sync(); });
    plus.addEventListener("click", () => { n++; sync(); });
    const jouer = el("button", { class: "btn small jeu-btn", type: "button", onclick: () => N.ouvrir(J.f, n, { onDone: sync, source: `cours:${c.num}` }) }, "▶ Jouer");
    sync();
    return el("div", { class: "niv-bloc" },
      el("span", { class: "eyebrow", text: "Le jeu du bloc" }), titre, desc,
      el("div", { class: "niv-bloc-row" }, moins, plus, jouer), last);
  }

  // Les jeux libres du manche (sans niveaux), sur les cordes de ton choix
  function jeuxLibres() {
    const sel = new Set(state.jeuxCordes || [6, 5]);
    const chips = el("div", { class: "row-tools" });
    [6, 5, 4, 3, 2, 1].forEach(n => {
      const b = el("button", { class: "btn small corde-chip", type: "button", "aria-pressed": String(sel.has(n)), text: Jeux.NOM_CORDE[n] });
      b.addEventListener("click", () => {
        if (sel.has(n) && sel.size > 1) sel.delete(n); else sel.add(n);
        b.setAttribute("aria-pressed", String(sel.has(n))); state.jeuxCordes = [...sel]; save();
      });
      chips.append(b);
    });
    const cfg = mode => ({ mode, cordes: [...sel].sort((a, b) => b - a), label: Jeux.MODES[mode].titre });
    const d = el("details", { class: "mini" }, el("summary", { text: "Jeux libres, sur les cordes de ton choix (avec le micro)" }));
    d.append(el("div", { class: "pli-pile", style: "margin-top:8px" },
      el("p", { class: "muted small", text: "Sans niveaux, pour t'entraîner quand tu veux. Le mode écoute reconnaît les notes jouées sur ta guitare. Choisis tes cordes :" }),
      chips,
      el("div", { class: "row-tools" },
        el("button", { class: "btn small jeu-btn", type: "button", onclick: () => Jeux.open(cfg("trouve")) }, "▶ Trouve les notes"),
        el("button", { class: "btn small jeu-btn", type: "button", onclick: () => Jeux.open(cfg("nomme")) }, "▶ Quelle note ?"),
        el("button", { class: "btn small jeu-btn", type: "button", onclick: () => Jeux.open(cfg("octave")) }, "▶ Octaves"),
        el("button", { class: "btn small jeu-btn", type: "button", onclick: () => Jeux.open({ mode: "quiz", label: "Quiz du manche" }) }, "▶ Quiz 6 cordes"))));
    return d;
  }

  function renderJeux() {
    const body = $("#jeuxBody"), N = NIV();
    body.replaceChildren(el("div", { class: "cours-head" },
      el("span", { class: "eyebrow", text: "Jeux" }),
      el("h1", { text: "Apprendre en jouant" }),
      el("p", { class: "sub", text: "10 niveaux par jeu. 8 bonnes réponses sur 10 ouvrent le niveau suivant, et ce que tu rates revient plus souvent." })));
    if (!N) return;
    const refresh = () => renderJeux();
    // Révision du jour
    const nb = N.aReviser().length;
    body.append(el("section", { class: "card niv-rev" },
      el("div", {}, el("h2", { text: "Révision du jour" }),
        el("p", { class: "muted small", text: nb ? `${nb} question${nb > 1 ? "s ratées" : " ratée"} à revoir, les 4 jeux mélangés.` : "Rien de raté à revoir : je mélange des questions de tes niveaux." })),
      el("button", { class: "btn primary", type: "button", onclick: () => N.revision({ onDone: refresh }) }, "▶ Réviser")));
    const sem = Math.min(12, nextCours().semaine);
    for (const [f, F] of Object.entries(N.FAMILLES)) {
      const { max, best } = N.etat(f);
      const auCours = [...new Set(Object.values(JEU_BLOC).filter(x => x.f === f).map(x => x.sem[sem - 1]))];
      state.jeuxNiv ||= {};
      let n = Math.min(state.jeuxNiv[f] || max, max);
      const pips = el("div", { class: "niv-pips", role: "radiogroup", "aria-label": "Choisir un niveau" });
      const desc = el("p", { class: "niv-desc" }), rec = el("p", { class: "muted small niv-rec" });
      const jouer = el("button", { class: "btn primary", type: "button" });
      const sync = () => {
        pips.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-checked", String(i + 1 === n)));
        desc.replaceChildren(el("strong", { text: `Niveau ${n} : ` }), F.niveaux[n - 1].txt);
        const b = best[n];
        rec.textContent = (b != null ? (n === 10 ? `Record : série de ${b}` : `Record : ${b}/10`) : "Pas encore joué") + (auCours.includes(n) ? " · c'est le niveau du cours cette semaine" : "");
        jouer.textContent = `▶ Jouer le niveau ${n}`;
      };
      for (let i = 1; i <= 10; i++) {
        const passe = i === 10 ? best[10] > 0 : best[i] >= 8;
        const b = el("button", { type: "button", role: "radio", class: "niv-pip" + (passe ? " passe" : "") + (auCours.includes(i) ? " cours" : ""), disabled: i > max, "aria-label": `Niveau ${i}`, text: String(i) });
        b.addEventListener("click", () => { n = i; state.jeuxNiv[f] = i; save(); sync(); });
        pips.append(b);
      }
      jouer.addEventListener("click", () => N.ouvrir(f, n, { onDone: refresh }));
      sync();
      const card = el("section", { class: "card niv-fam" },
        el("div", { class: "niv-fam-head" }, el("h2", { text: F.titre }), el("span", { class: "muted small", text: `${max} niveau${max > 1 ? "x" : ""} ouvert${max > 1 ? "s" : ""} sur 10` })),
        pips, desc, rec, el("div", { class: "row-tools" }, jouer));
      if (f === "manche" && window.Jeux) card.append(jeuxLibres());
      body.append(card);
    }
    body.append(el("p", { class: "muted small niv-note", text: "Le niveau 10 est sans fin : 3 vies, et ton record est gardé. Il sert à rester solide. Dans le cours, chaque bloc te propose son jeu au niveau de la semaine." }));
  }

  // Une carte du bilan qui se déplie : son titre et l'essentiel, le reste au toucher (construit à la première ouverture).
  function pli(key, titre, resume, build, { ouvert = false, cls = "" } = {}) {
    const k = "bilan/" + key, d = el("details", { class: ("card pli " + cls).trim(), open: state.open[k] ?? ouvert });
    const corps = el("div", { class: "pli-corps" });
    const remplir = () => { if (!corps.childElementCount) corps.append(...[build()].flat()); };
    if (d.open) remplir();
    d.addEventListener("toggle", () => { if (d.open) remplir(); if (state.open[k] !== d.open) { state.open[k] = d.open; save(); } });
    d.append(el("summary", {}, el("div", { class: "pli-head" }, el("h2", { text: titre }), el("span", { class: "pli-chev", "aria-hidden": "true" })), resume), corps);
    return d;
  }

  // Barres de progression : tout le parcours, puis chaque thème (exercices cochés sur les 36 cours).
  const BLOC_THEME = ["technique", "gammes", "penta", "manche", "barres", "morceaux"];
  function renderProgression() {
    const all = DATA.cours.flatMap(c => c.blocs.flatMap((b, bi) => b.exercices.map(e => ({ c, b, bi, e, theme: e.theme || BLOC_THEME[bi] || "morceaux", x: state.cours[c.id]?.ex[exKey(b, e)] }))));
    const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
    const bar = (n, t, cls = "") => el("div", { class: "progress " + cls, "aria-hidden": "true" }, el("i", { style: `width:${t ? (n / t) * 100 : 0}%` }));
    const nbDone = DATA.cours.filter(c => isDone(c.id)).length;
    const exDone = all.filter(a => a.x?.done).length;
    const resume = el("div", { class: "prog-main" },
      el("div", { class: "prog-top" }, el("span", { class: "muted small", text: `${nbDone} cours sur ${DATA.cours.length} · ${exDone} exercices sur ${all.length}` }), el("span", { class: "prog-pct", text: pct(nbDone, DATA.cours.length) + " %" })),
      bar(nbDone, DATA.cours.length, "big"));
    return pli("progression", "Ma progression", resume, () => {
      const list = el("div", { class: "prog-list" });
      for (const t of DATA.themes || []) {
        const mine = all.filter(a => a.theme === t.id);
        if (!mine.length) continue;
        const d = mine.filter(a => a.x?.done).length;
        const fac = mine.filter(a => a.x?.feel === "facile").length, gal = mine.filter(a => a.x?.feel === "galere").length;
        const bits = [`${d} exercices faits sur ${mine.length}`];
        if (fac) bits.push(`${fac} facile${fac > 1 ? "s" : ""}`);
        if (gal) bits.push(`${gal} galère${gal > 1 ? "s" : ""}`);
        // une ligne par thème : son nom, sa barre, son pourcentage ; le détail au toucher
        const row = el("details", { class: "prog-row" }, el("summary", {},
          el("span", { class: "prog-nom", text: t.label }), bar(d, mine.length, "theme"), el("span", { class: "prog-pct", text: pct(d, mine.length) + " %" })));
        row.addEventListener("toggle", () => { if (row.open && !row.dataset.built) { row.dataset.built = "1"; row.append(el("p", { class: "muted small prog-bits", text: bits.join(" · ") }), themeDetail(mine)); } });
        list.append(row);
      }
      return list;
    }, { cls: "progression" });
  }

  // Les exercices d'un thème, regroupés : leur palier, quand ils arrivent, où tu en es.
  const plage = nums => {
    const out = []; let i = 0;
    while (i < nums.length) {
      let j = i; while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
      if (j - i >= 2) out.push(`${nums[i]} à ${nums[j]}`); else for (let k = i; k <= j; k++) out.push(String(nums[k]));
      i = j + 1;
    }
    return out.length > 1 ? out.slice(0, -1).join(", ") + " et " + out.at(-1) : out[0];
  };
  function themeDetail(mine) {
    const groups = new Map();
    for (const a of mine) {
      const k = a.c.palier + "|" + a.bi + "|" + a.e.label;
      if (!groups.has(k)) groups.set(k, { label: a.e.label, palier: a.c.palier, bi: a.bi, items: [] });
      groups.get(k).items.push(a);
    }
    const now = nextCours().num;
    const ul = el("ul", { class: "theme-ex" });
    let pal = 0;
    for (const g of groups.values()) {
      if (g.palier !== pal) { pal = g.palier; ul.append(el("li", { class: "theme-pal", text: `Palier ${pal} · ${DATA.paliers.find(p => p.num === pal)?.nom || ""}` })); }
      const nums = g.items.map(a => a.c.num), weeks = [...new Set(g.items.map(a => a.c.semaine))];
      const n = g.items.length, done = g.items.filter(a => a.x?.done).length;
      const fac = g.items.filter(a => a.x?.feel === "facile").length, gal = g.items.filter(a => a.x?.feel === "galere").length;
      const [st, cls] = done === n ? ["Fait", "ok"] : nums.includes(now) ? ["C'est maintenant", "now"] : nums[0] > now ? ["À venir", "next"] : done ? ["Pas fini", "mid"] : ["Pas fait", "todo"];
      const quand = `${weeks.length > 1 ? "Semaines " + plage(weeks) : "Semaine " + weeks[0]} · cours ${plage(nums)}`;
      const bits = [`Fait ${done} fois sur ${n}`];
      if (fac) bits.push(`${fac} facile${fac > 1 ? "s" : ""}`);
      if (gal) bits.push(`${gal} galère${gal > 1 ? "s" : ""}`);
      ul.append(el("li", { class: "theme-item" },
        el("div", { class: "ti-top" }, el("strong", { text: g.label }), el("span", { class: "pill " + cls, text: st })),
        el("span", { class: "muted small", text: `${quand} · bloc ${g.bi + 1}` }),
        el("span", { class: "small", text: bits.join(" · ") })));
    }
    return ul;
  }

  // Comment le cours est construit, tiré du cours lui-même
  const BLOCS_NOMS = ["Échauffement", "Gamme", "Pentatonique", "Notes du manche", "Barrés et rythme", "Morceau"];
  function renderConstruction() {
    const nbSem = new Set(DATA.cours.map(c => c.semaine)).size;
    const resume = el("span", { class: "muted small", text: `${nbSem} semaines · ${DATA.paliers.length} paliers · 3 séances d'1 h 30 par semaine` });
    return pli("construction", "Comment est construit ton cours", resume, () => {
      const out = [];
      out.push(el("div", { class: "constr-seance" }, el("span", { class: "eyebrow", text: "Chaque séance : 6 blocs, toujours dans cet ordre" }),
        el("ol", { class: "constr-chips" }, BLOCS_NOMS.map(n => el("li", { text: n })))));
      // trois principes : une ligne chacun, l'explication au toucher
      const mini = (titre, texte) => el("details", { class: "mini" }, el("summary", { text: titre }), el("p", { class: "small", text: texte }));
      out.push(mini("Une nouveauté par bloc toutes les 2 semaines",
        "Chaque bloc apporte une nouveauté en semaine 1 et en semaine 3 de chaque palier. Pendant ces 2 semaines, tes 6 séances reprennent les mêmes exercices, et seul le bloc Morceau change un peu selon la séance. C'est voulu : un geste s'installe quand on le répète plusieurs jours de suite."));
      out.push(mini("Un bilan de tests à la fin de chaque palier",
        `Les cours ${DATA.cours.filter(c => c.bilan).map(c => c.num).join(", ").replace(/, (\d+)$/, " et $1")} finissent chaque palier par un bilan de tests. Avec tous les tests réussis sauf un au plus, tu passes au palier suivant. Sinon, on ajoute une semaine sur ce qui manque.`));
      out.push(mini("Ton bilan de la semaine adapte la suite",
        "Après le 3e cours de la semaine, tu m'envoies ton bilan : il regroupe tes 3 cours, et je m'en sers pour adapter la semaine suivante."));
      const ici = nextCours().palier;
      for (const p of DATA.paliers) {
        const pc = DATA.cours.filter(c => c.palier === p.num);
        const faits = pc.filter(c => isDone(c.id)).length;
        const d = el("details", { class: "constr-pal" + (p.num === ici ? " ici" : "") }, el("summary", {},
          el("span", { class: "constr-pal-top" }, el("strong", { text: `Palier ${p.num} · ${p.nom}` }), p.num === ici ? el("span", { class: "pill now", text: "Tu es ici" }) : null),
          el("span", { class: "muted small", text: `${p.titre} · semaines ${pc[0].semaine} à ${pc.at(-1).semaine} · ${faits} cours sur ${pc.length} faits` }),
          el("div", { class: "progress theme", "aria-hidden": "true" }, el("i", { style: `width:${(faits / pc.length) * 100}%` }))));
        d.addEventListener("toggle", () => {
          if (!d.open || d.dataset.built) return;
          d.dataset.built = "1";
          d.append(el("p", { class: "small" }, el("strong", { text: "Le but : " }), p.but, " ", el("strong", { text: "Ta mission : " }), p.mission));
          const weeks = [...new Set(pc.map(c => c.semaine))];
          for (let h = 0; h < weeks.length; h += 2) {
            const six = pc.filter(c => c.semaine === weeks[h] || c.semaine === weeks[h + 1]);
            d.append(el("h4", { text: `Semaines ${weeks[h]} et ${weeks[h + 1]} · cours ${six[0].num} à ${six.at(-1).num}` }));
            d.append(el("ol", { class: "constr-blocs" }, six[0].blocs.map((b, bi) => {
              const labels = [...new Set(six.flatMap(c => c.blocs[bi].exercices.map(e => e.label)))];
              return el("li", {}, el("strong", { text: b.titre.replace(/^\d+\.\s*/, "") }), el("span", { class: "muted", text: labels.join(" · ") }));
            })));
          }
          const bil = pc.find(c => c.bilan);
          if (bil) d.append(el("p", { class: "small constr-bilan" }, el("strong", { text: `Cours ${bil.num} · ${bil.bilan.titre} (${bil.bilan.tests.length} tests) : ` }), bil.bilan.tests.map(t => t.label).join(" · ") + "."));
        });
        out.push(d);
      }
      return out;
    }, { cls: "construction" });
  }

  // Un rappel qui revient chaque semaine, en fichier .ics : le Calendrier du Mac ou de l'iPhone l'ajoute et prévient à l'heure.
  function calendrier({ jours, heure }) {
    const [h, m] = heure.split(":").map(Number), N = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    const d = new Date(); d.setHours(h, m, 0, 0);
    for (let i = 0; i < 8 && !(jours.some(j => N[j] === d.getDay()) && d > new Date()); i++) d.setDate(d.getDate() + 1);
    const p2 = n => String(n).padStart(2, "0");
    const loc = x => `${x.getFullYear()}${p2(x.getMonth() + 1)}${p2(x.getDate())}T${p2(x.getHours())}${p2(x.getMinutes())}00`;
    const fin = new Date(d.getTime() + 90 * 60000), now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const app = location.origin + location.pathname;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ma gratte//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:seance-" + now.getTime() + "@ma-gratte", "DTSTAMP:" + stamp, "DTSTART:" + loc(d), "DTEND:" + loc(fin),
      "RRULE:FREQ=WEEKLY;BYDAY=" + jours.join(","), "SUMMARY:Séance de guitare 🎸", "DESCRIPTION:Assieds-toi avec ta guitare et ouvre Ma gratte : " + app, "URL:" + app,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Séance de guitare", "TRIGGER:PT0M", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = el("a", { href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })), download: "seance-guitare.ics" });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast("Rappel prêt : ouvre le fichier pour l'ajouter à ton Calendrier.");
  }

  async function exportData() {
    flush();
    const json = JSON.stringify(state, null, 1);
    const name = `ma-gratte-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Sauvegarde Ma gratte" }); return; } catch (e) { if (e?.name === "AbortError") return; }
    }
    const a = el("a", { href: URL.createObjectURL(file), download: name }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Chaque navigateur (et l'app installée) garde ses propres données : un lien les emporte vers un autre.
  // Les données voyagent dans l'ancre du lien (#donnees=…), compressées ; elles ne passent par aucun serveur.
  const b64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const zip = async (txt, sens) => {
    const S = sens ? window.CompressionStream : window.DecompressionStream;
    const flux = new Blob([txt]).stream().pipeThrough(new S("gzip"));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  };
  async function lienTransfert() {
    flush();
    const json = JSON.stringify(state);
    const fait = (async () => {
      const code = window.CompressionStream ? "z" + b64(await zip(json, true)) : "j" + b64(new TextEncoder().encode(json));
      return location.origin + location.pathname + "#donnees=" + code;
    })();
    const copie = () => toast("Lien copié : colle-le dans l'autre navigateur, ou envoie-le-toi.");
    // Safari n'autorise la copie que pendant le geste : on la lance tout de suite, avec le lien « à venir »
    try {
      if (!window.ClipboardItem) throw new Error();
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": fait.then(u => new Blob([u], { type: "text/plain" })) })]);
      return copie();
    } catch {}
    const url = await fait;
    try { await navigator.clipboard.writeText(url); copie(); }
    catch { prompt("Copie ce lien, puis ouvre-le dans l'autre navigateur :", url); }
  }
  // les mêmes étapes pour une sauvegarde (fichier) et pour un lien de données
  function restaure(data, msg, rendu = true) {
    state = Object.assign(blank(), data); flush();
    setBpm(state.bpm || 60); setBeats(state.beats || 4);
    toast(msg);
    if (rendu) {
      if (!state.current || !byId(state.current)) state.current = nextCours().id;
      renderTabs(); renderCours(); updateSeance(); renderBilan();
    }
  }
  async function recoitTransfert(rendu) {
    const m = location.hash.match(/^#donnees=([zj])([\w-]+)$/); if (!m) return;
    history.replaceState(null, "", location.pathname + location.search);
    try {
      const octets = unb64(m[2]);
      const data = JSON.parse(m[1] === "z" ? new TextDecoder().decode(await zip(octets, false)) : new TextDecoder().decode(octets));
      if (!data || typeof data.cours !== "object") throw new Error();
      if (!confirm("Remplacer les données de ce navigateur par celles du lien (cases, tempos, morceaux, jeux) ?")) return;
      restaure(data, "Tes données sont arrivées.", rendu);
    } catch { toast("Ce lien de données est abîmé : refais-le depuis l'autre navigateur."); }
  }

  async function checkUpdate() {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
      const fresh = await loadJSON("data/cours.json");
      const retours = await loadJSON("data/retours.json").catch(() => ({ retours: [] }));
      const changed = fresh.maj !== DATA.maj || (retours.retours || []).length !== RETOURS.length;
      DATA = fresh; RETOURS = retours.retours || [];
      SCHEMAS = await loadJSON("data/schemas.json").catch(() => SCHEMAS);
      renderTabs(); renderCours(); renderBilan();
      toast(changed ? "Cours mis à jour." : "Ton cours est déjà à jour.");
    } catch { toast("Pas de connexion : réessaie plus tard."); }
  }

  // ---------- Minuteur de bloc ----------
  const mini = $("#miniTimer");
  let blocT = null; // { label, min, end (0 = en pause), left, id }
  const blocLeft = () => (!blocT ? 0 : blocT.end ? Math.max(0, blocT.end - Date.now()) : blocT.left);
  function blocTick() {
    if (!blocT) return;
    const left = blocLeft();
    mini.querySelector("b").textContent = fmt(left + 999);
    mini.classList.toggle("paused", !blocT.end);
    if (blocT.end && left <= 0) {
      const label = blocT.label;
      stopTimer(); Sons.alarme();
      toast(`Fin du bloc « ${label} ». Pause d'une minute !`); navigator.vibrate?.([200, 100, 200]);
    }
    updateTimers();
  }
  function startTimer(min, label) {
    stopTimer();
    blocT = { label, min, end: Date.now() + min * 60000, left: 0, id: setInterval(blocTick, 250) };
    mini.hidden = false; mini.title = `Minuteur « ${label} » : touche pour le mettre en pause, le recommencer ou l'arrêter`;
    blocTick(); unlockAudio(); ecran();
    toast(`Minuteur lancé : ${min} min.`);
  }
  const pauseTimer = () => { if (blocT?.end) { blocT.left = blocLeft(); blocT.end = 0; blocTick(); } };
  const resumeTimer = () => { if (blocT && !blocT.end) { blocT.end = Date.now() + blocT.left; blocTick(); } };
  function stopTimer() { if (blocT) clearInterval(blocT.id); blocT = null; mini.hidden = true; updateTimers(); ecran(); }
  mini.addEventListener("click", () => openTimers());

  // ---------- Les minuteurs : la feuille ouverte depuis le haut de l'écran ----------
  let tm = null;
  function openTimers() {
    if (!tm) {
      const part = (title, btns) => {
        const label = el("span", { class: "eyebrow", text: title }), name = el("strong", { class: "tm-name" }), time = el("b", { class: "tm-time" }), note = el("p", { class: "muted small" });
        return { label, name, time, note, box: el("section", { class: "tm" }, label, name, time, note, el("div", { class: "row-tools" }, btns)) };
      };
      const sToggle = el("button", { class: "btn", type: "button", onclick: () => { const c = seanceTarget(); if (c) seanceToggle(c); } });
      const sReset = el("button", { class: "btn", type: "button", text: "↺ Remettre à zéro", onclick: () => { const c = seanceTarget(); if (c) seanceReset(c); } });
      const bToggle = el("button", { class: "btn", type: "button", onclick: () => (blocT?.end ? pauseTimer() : resumeTimer()) });
      const bRestart = el("button", { class: "btn", type: "button", text: "↺ Recommencer", onclick: () => blocT && startTimer(blocT.min, blocT.label) });
      const bStop = el("button", { class: "btn", type: "button", text: "Arrêter", onclick: () => { stopTimer(); toast("Minuteur arrêté."); } });
      const S = part("Minuteur de séance", [sToggle, sReset]), B = part("Minuteur de bloc", [bToggle, bRestart, bStop]);
      const d = el("dialog", { class: "sheet", "aria-labelledby": "tmTitle" }, el("div", { class: "sheet-in" },
        el("div", { class: "sheet-head" }, el("h2", { id: "tmTitle", text: "Minuteurs" }), el("button", { class: "icon-btn", type: "button", "data-close": true, "aria-label": "Fermer", text: "✕" })),
        S.box, B.box));
      d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
      document.body.append(d);
      tm = { d, S, B, sToggle, sReset, bToggle, bRestart, bStop };
    }
    openSheet(tm.d); updateTimers();
  }
  // la séance qui tourne, sinon celle du cours ouvert
  const seanceTarget = () => seanceShown() || (DATA && byId(state.current) && !isDone(state.current) ? byId(state.current) : null);
  function updateTimers() {
    if (!tm?.d.open) return;
    const c = seanceTarget(), s = c && state.cours[c.id], on = !!s?.seance?.start, has = !!s?.seance;
    tm.S.name.textContent = c ? `Cours ${c.num}` : "";
    tm.S.time.textContent = fmt(seanceMs(s));
    tm.S.note.textContent = !c ? "Ouvre un cours pour lancer sa séance." : on ? "Il tourne. Il s'arrête tout seul quand tu touches « Terminer le cours »." : has ? "En pause." : "Pas encore lancé.";
    tm.sToggle.hidden = !c; tm.sToggle.textContent = on ? "Pause" : has ? "Reprendre" : "▶ Démarrer";
    tm.sToggle.className = "btn " + (on ? "" : "primary");
    tm.sReset.hidden = !has;
    tm.B.name.textContent = blocT ? blocT.label : "";
    tm.B.time.textContent = blocT ? fmt(blocLeft() + 999) : "–";
    tm.B.note.textContent = !blocT ? "Lance-le depuis un bloc, avec le bouton « Minuteur »." : blocT.end ? `${blocT.min} min, en cours.` : "En pause.";
    tm.bToggle.textContent = blocT?.end ? "Pause" : "Reprendre";
    tm.bToggle.className = "btn " + (blocT?.end ? "" : "primary");
    tm.bToggle.hidden = tm.bRestart.hidden = tm.bStop.hidden = !blocT;
  }

  // ---------- Métronome ----------
  const getCtx = () => Sons.ctx();
  const unlockAudio = () => Sons.unlock();
  function click(time, accent) {
    const ctx = getCtx(), o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = accent ? 1760 : 1100;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    o.connect(g).connect(Sons.sortie("metro")); o.start(time); o.stop(time + 0.06);
  }
  const metro = { bpm: state.bpm || 60, beats: state.beats || 4, on: false, next: 0, beat: 0, id: null };
  const out = $("#metroOut"), range = $("#metroRange"), dots = $("#metroDots"), badge = $("#metroBadge");
  function setBpm(v) {
    metro.bpm = Math.max(30, Math.min(200, Math.round(v)));
    out.textContent = metro.bpm; range.value = metro.bpm; state.bpm = metro.bpm; save();
    badge.textContent = metro.bpm;
  }
  function setBeats(n) {
    metro.beats = n; state.beats = n; save();
    document.querySelectorAll("#metroBeats button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.beats === n)));
    dots.replaceChildren(...Array.from({ length: Math.max(1, n) }, () => el("i")));
  }
  function schedule() {
    const ctx = getCtx();
    if (metro.ctx !== ctx) { metro.ctx = ctx; metro.next = ctx.currentTime + 0.06; } // contexte audio recréé
    while (metro.next < ctx.currentTime + 0.12) {
      const accent = metro.beats > 1 && metro.beat % metro.beats === 0;
      click(metro.next, accent);
      const idx = metro.beat % Math.max(1, metro.beats), at = metro.next;
      setTimeout(() => {
        dots.querySelectorAll("i").forEach((d, i) => { d.classList.toggle("on", i === idx); d.classList.toggle("accent", i === idx && accent); });
      }, Math.max(0, (at - ctx.currentTime) * 1000));
      metro.next += 60 / metro.bpm; metro.beat++;
    }
  }
  function startMetro() {
    unlockAudio();
    metro.on = true; metro.beat = 0; metro.ctx = getCtx(); metro.next = metro.ctx.currentTime + 0.06;
    metro.id = setInterval(schedule, 25); schedule();
    $("#metroToggle").textContent = "Arrêter"; badge.hidden = false; ecran();
  }
  function stopMetro() {
    metro.on = false; clearInterval(metro.id);
    $("#metroToggle").textContent = "Démarrer"; badge.hidden = true;
    dots.querySelectorAll("i").forEach(d => d.classList.remove("on", "accent"));
    ecran();
  }
  function openMetro(bpm) { if (bpm) setBpm(bpm); openSheet($("#metroSheet")); }
  $("#metroBtn").addEventListener("click", () => openMetro());
  $("#metroToggle").addEventListener("click", () => (metro.on ? stopMetro() : startMetro()));
  document.querySelectorAll("[data-bpm]").forEach(b => b.addEventListener("click", () => setBpm(metro.bpm + +b.dataset.bpm)));
  range.addEventListener("input", () => setBpm(+range.value));
  document.querySelectorAll("#metroBeats button").forEach(b => b.addEventListener("click", () => setBeats(+b.dataset.beats)));
  setBpm(metro.bpm); setBeats(metro.beats);

  // ---------- Écran allumé ----------
  // Pendant la séance, le métronome, un minuteur ou un jeu, l'écran ne s'éteint pas : un iPhone verrouillé arrête tout.
  let veille = null, veillePrise = false;
  const besoinEcran = () => !document.hidden && !!(seanceTick || blocT || metro.on || document.querySelector("dialog.jeu-sheet[open]"));
  async function ecran() {
    if (!navigator.wakeLock) return;
    if (besoinEcran() && !veille && !veillePrise) {
      veillePrise = true;
      try { veille = await navigator.wakeLock.request("screen"); veille.addEventListener("release", () => { veille = null; }); } catch { veille = null; }
      veillePrise = false;
    }
    if (!besoinEcran() && veille) { const v = veille; veille = null; v.release().catch(() => {}); }
  }
  document.addEventListener("visibilitychange", ecran);
  new MutationObserver(ecran).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

  // ---------- Feuilles et messages ----------
  function openSheet(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  document.querySelectorAll("dialog.sheet").forEach(d => {
    d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });
  let toastT = null;
  // la zone reste toujours là (VoiceOver lit ce qui y change) : seuls son texte et sa visibilité changent
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove("on"); t.textContent = ""; }, 3200);
  }

  // ---------- Démarrage ----------
  async function boot() {
    // les trois fichiers en même temps : l'app s'ouvre plus vite
    const [cours, retours, schemas] = await Promise.all([
      loadJSON("data/cours.json").catch(() => null),
      loadJSON("data/retours.json").catch(() => ({})),
      loadJSON("data/schemas.json").catch(() => ({})),
    ]);
    if (!cours) {
      $("#coursBody").replaceChildren(el("p", { class: "empty", text: "Impossible de charger le cours. Vérifie ta connexion puis rouvre l'app." }));
      return;
    }
    DATA = cours; RETOURS = retours.retours || []; SCHEMAS = schemas;
    await recoitTransfert(false);
    // lien de données ouvert dans un onglet où l'app est déjà là : seule l'ancre change
    window.addEventListener("hashchange", () => recoitTransfert(true));
    // anciens choix « Je le choisis » (par palier) : ils deviennent « Je le travaille »
    if (state.repertoire) { for (const ids of Object.values(state.repertoire)) for (const id of ids) (state.morceaux ||= {})[id] ||= "travail"; delete state.repertoire; save(); }
    if (!state.current || !byId(state.current)) state.current = nextCours().id;
    renderTabs(); renderCours(); updateSeance();
    go(["bilan", "morceaux", "jeux"].includes(state.view) ? state.view : "cours");
  }
  boot();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    let reloaded = false;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded || !hadController) return;
      reloaded = true; toast("L'app a été mise à jour.");
    });
  }
})();
