/* Ma guitare : mon cours, mon manche, mon bilan */
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
  let saveTimer = null;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, 250);
  };
  const flush = () => { clearTimeout(saveTimer); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
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
  const VIEWS = ["cours", "manche", "bilan"];
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
    if (view !== "cours") window.scrollTo({ top: 0 });
    else if (from !== "cours" || opts.restore) window.scrollTo({ top: coursScroll });
  }
  let coursScroll = 0;
  document.querySelectorAll(".tabbar button").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));

  // Balayer de droite à gauche : section suivante ; de gauche à droite : section précédente.
  function swipe(target, { edgeOnly = false } = {}) {
    let x0 = 0, y0 = 0, t0 = 0, ok = false;
    target.addEventListener("touchstart", e => {
      const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
      const tag = e.target.closest?.("input, textarea, select, .cours-tabs, .recap, [data-noswipe]");
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
    const hash = pos ? "#pos-" + pos : "";
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
    state.current = id; save(); navWeek = null;
    renderTabs(); renderCours(); updateSeance();
    window.scrollTo({ top: 0 });
  }

  // ---------- Un cours ----------
  const ICON_POS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="2.5" width="8" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.8" r="1.6" fill="currentColor"/></svg>';
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
    for (const m of mots) {
      const card = el("div", { class: "card prof-card" }, el("span", { class: "eyebrow", text: m.titre || "Le mot du prof" }));
      String(m.texte).split(/\n+/).forEach(t => card.append(el("p", { text: t })));
      body.append(card);
    }
    if (c.num === 1 && !mots.length) {
      body.append(el("div", { class: "card prof-card" },
        el("span", { class: "eyebrow", text: "Comment ça marche" }),
        el("p", { text: "Coche chaque exercice fait, dis si c'était facile, correct ou une galère, note ton tempo et un commentaire si besoin." }),
        el("p", { text: "À la fin, touche « Terminer le cours » et envoie-moi ton bilan : j'adapte le cours suivant." }),
      ));
    }
    if (p.num && c.num === (p.num - 1) * 12 + 1) {
      body.append(el("div", { class: "card" },
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
    card.append(head, inner);

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
    tools.append(speakBtn(b.voix?.consigne || [`${b.titre.replace(/^\d+\.\s*/, "")}.`, b.sert, `À faire : ${b.faire}`], "Écouter", "Écouter la consigne"));
    (b.positions || []).forEach(pz => {
      const btn = el("button", { class: "btn small pos-btn", type: "button", title: "Voir sur le manche", onclick: () => go("manche", { pos: pz.code }) });
      btn.innerHTML = ICON_POS; btn.append(pz.label);
      tools.append(btn);
    });
    inner.append(tools);

    if (c.num > 1 && [1, 3, 4].includes(bi)) { const rv = revisionCard(c, bi); if (rv) inner.append(rv); }
    if (bi === 5) { const rp = repertoireCard(c); if (rp) inner.append(rp); }
    const ul = el("ul", { class: "exos" });
    let wasComplete = complete();
    b.exercices.forEach(e => ul.append(renderExo(c, b, e, checked => {
      const now = complete();
      card.classList.toggle("complete", now);
      if (now && !wasComplete) { Sons.bloc(); toast(`Bloc ${bi + 1} terminé, bravo !`); }
      else if (checked) Sons.cling();
      wasComplete = now; updateProgress();
    })));
    inner.append(ul);

    const more = el("details", { class: "more" }, el("summary", { text: "Explication et vidéos" }));
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
    if (b.videos?.length) {
      const vl = el("ul", { class: "videos" });
      b.videos.forEach(v => vl.append(el("li", {}, el("a", { href: v.u, target: "_blank", rel: "noopener" }, el("span", { class: "play", "aria-hidden": "true" }), v.t))));
      mi.append(vl);
    }
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
      try { await Sons.dire(typeof segs === "function" ? segs() : segs, { force: true }); } finally { b.classList.remove("speaking"); txt.textContent = label; }
    });
    return b;
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

  // Révision : un exercice déjà vu dans un cours précédent, tiré au sort (le même pour un cours donné)
  // Morceaux au choix du palier : écouter, puis « Je le choisis » (gardé sur l'appareil, envoyé dans le bilan)
  const choixDe = pal => (state.repertoire ||= {})[pal] ||= [];
  function pieceRow(pz, pal) {
    const pick = el("button", { class: "btn small pick-btn", type: "button" });
    const li = el("li", { class: "piece" });
    const sync = () => {
      const on = choixDe(pal).includes(pz.id);
      li.classList.toggle("chosen", on);
      pick.setAttribute("aria-pressed", String(on));
      pick.textContent = on ? "✓ Choisi" : "Je le choisis";
    };
    pick.addEventListener("click", () => {
      const L = choixDe(pal), i = L.indexOf(pz.id);
      if (i >= 0) L.splice(i, 1); else { L.push(pz.id); Sons.cling(); }
      save(); sync(); li.closest(".repertoire")?.dispatchEvent(new Event("choix"));
    });
    li.append(
      el("div", { class: "piece-head" }, el("span", { class: "chip", text: pz.style }), el("strong", { text: pz.titre }), el("span", { class: "muted small", text: pz.artiste })),
      el("p", { class: "small", text: pz.travaille + " " + pz.pourquoi }),
      el("div", { class: "row-tools" },
        el("a", { class: "btn small", href: pz.ecouter, target: "_blank", rel: "noopener" }, "▶ Écouter"),
        pz.tuto ? el("a", { class: "btn small ghost", href: pz.tuto, target: "_blank", rel: "noopener" }, "Tuto") : null,
        pick));
    sync();
    return li;
  }
  function repertoireCard(c) {
    const p = palierOf(c), list = p?.repertoire || [];
    if (!list.length) return null;
    const card = el("details", { class: "repertoire" });
    const sum = el("summary");
    const syncSum = () => {
      const ch = list.filter(x => choixDe(p.num).includes(x.id)).map(x => x.titre);
      sum.replaceChildren(el("span", { class: "eyebrow", text: `Tes morceaux au choix · palier ${p.num}` }),
        el("span", { class: "small", text: ch.length ? "Choisi : " + ch.join(", ") : `${list.length} propositions de styles différents, à écouter avant de choisir` }));
    };
    card.addEventListener("choix", syncSum);
    syncSum();
    const ul = el("ul", { class: "pieces" }, list.map(pz => pieceRow(pz, p.num)));
    card.append(sum, el("p", { class: "muted small", text: "En plus de ta mission, choisis 1 ou 2 morceaux qui te plaisent. Tu peux changer d'avis quand tu veux : ton choix part dans ton bilan, et j'ajoute la tablature et les passages difficiles au cours." }), ul);
    if (p.num === 3 && DATA.bossa?.length) {
      card.append(el("p", { class: "eyebrow", text: "Et après : la bossa nova (palier 4 proposé)" }),
        el("ul", { class: "pieces" }, DATA.bossa.map(pz => pieceRow(pz, 4))));
    }
    return card;
  }

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

  function renderExo(c, b, e, onChange) {
    const key = exKey(b, e);
    const x = exState(c.id, key);
    const id = "x-" + c.id + "-" + key.replace(/\W/g, "-");
    const li = el("li", { class: "exo" + (x.done ? " is-done" : "") });
    const box = el("input", { type: "checkbox", class: "check", id, checked: !!x.done, "aria-label": e.label });
    box.addEventListener("change", () => { x.done = box.checked; li.classList.toggle("is-done", x.done); touch(c); save(); onChange(x.done); });
    const label = el("label", { class: "exo-label", for: id }, e.label, e.aide ? el("span", { class: "aide", text: e.aide }) : null);
    const main = el("div", { class: "exo-main" }, box, label);
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
        el("button", { class: "btn primary", type: "button", onclick: () => showRecap(c) }, "Revoir et renvoyer mon bilan"),
        el("button", { class: "btn ghost", type: "button", onclick: () => { delete s.finishedAt; save(); renderTabs(); renderCours(); } }, "Rouvrir ce cours"));
    }
    const field = (k, label, hint) => {
      const ta = el("textarea", { rows: "2", placeholder: hint });
      ta.value = s[k] || "";
      ta.addEventListener("input", () => { s[k] = ta.value.trim() ? ta.value : undefined; save(); });
      return el("label", {}, label, ta);
    };
    const duree = el("input", { type: "number", inputmode: "numeric", min: "0", max: "300", placeholder: s.seance ? String(Math.max(1, Math.round(seanceMs(s) / 60000))) : "70", value: s.duree ?? "", "aria-label": "Durée en minutes" });
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
    const P = DATA.prof, pr = c.prof || {}, S = [...(pr.intro || [])];
    if (c.mot) S.push(...lignes(c.mot));
    RETOURS.filter(r => r.pour === c.id).forEach(r => S.push(...lignes(r.texte)));
    const prev = DATA.cours[DATA.cours.indexOf(c) - 1];
    const dur = prev ? exNotes(prev).filter(a => a.x.feel === "galere").slice(0, 2) : [];
    if (dur.length) S.push(P.intro_galere, ...dur.map(a => a.e.label), P.intro_galere_fin);
    return [...S, ...(pr.intro_suite || [])];
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
    S.push(...(pr.fin_suite || []), P.envoie);
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
    Sons.fanfare();
    showRecap(c);
    if (profOn()) setTimeout(() => { if (recapSheet.open) Sons.dire(finSegs(c), { force: true }); }, 1600);
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
    if (!s.seance && profOn()) setTimeout(() => Sons.dire(introSegs(c), { force: true }), 700); // première fois : le prof présente le cours
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
      if (sc?.seance?.start && !sc.seance.pausa && seanceMs(sc) >= 35 * 60000) { sc.seance.pausa = true; save(); toast("35 minutes : fais une pause de 2 minutes, lâche tes mains."); }
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
  function recapText(c) {
    const s = cs(c.id);
    const d = s.finishedAt ? new Date(s.finishedAt) : new Date();
    const pr = progressOf(c);
    const L = [];
    L.push(`Bilan du cours ${c.num} (${c.titre}, palier ${c.palier}) — ${d.toLocaleDateString("fr-FR")}`);
    L.push(`Fait : ${pr.done}/${pr.total} exercices` + (s.duree ? ` · durée ${s.duree} min` : ""));
    const pal = palierOf(c), pool = [...(pal?.repertoire || []), ...(DATA.bossa || [])];
    const ch = [...(state.repertoire?.[c.palier] || []), ...(c.palier === 3 ? state.repertoire?.[4] || [] : [])].map(id => pool.find(x => x.id === id)?.titre).filter(Boolean);
    if (ch.length) L.push("Morceaux choisis : " + ch.join(", "));
    for (const b of c.blocs) {
      L.push("");
      L.push(b.titre);
      for (const e of b.exercices) {
        const x = s.ex[exKey(b, e)] || {};
        let line = `${x.done ? "[x]" : "[ ]"} ${e.label}`;
        const bits = [];
        if (x.feel) bits.push(FEEL[x.feel]);
        if (x.tempo) bits.push(`${x.tempo} bpm` + (e.tempo ? ` (objectif ${e.tempo})` : ""));
        if (bits.length) line += " — " + bits.join(", ");
        L.push(line);
        if (x.note) L.push(`    « ${x.note.trim().replace(/\s*\n\s*/g, " / ")} »`);
        for (const r of Object.values(x.jeux || {})) L.push(`    Jeu ${window.Jeux ? Jeux.resume(r) : r.label}`);
      }
    }
    if (c.bilan) {
      L.push(""); L.push(c.bilan.titre);
      for (const t of c.bilan.tests) {
        const r = s.tests[t.id] || {};
        L.push(`${r.res === "ok" ? "[réussi]" : r.res === "ko" ? "[pas encore]" : "[non fait]"} ${t.label} (objectif : ${t.objectif})` + (r.note ? ` — ${r.note.trim()}` : ""));
      }
    }
    const add = (lab, v) => { if (v) { L.push(""); L.push(lab + " : " + v.trim()); } };
    add("Là où j'ai galéré", s.galere);
    add("Ce qui a bien marché", s.bien);
    add("Pour mon prof", s.autre);
    L.push("");
    L.push("Fais-moi la synthèse, un petit récap, et adapte le cours suivant dans l'app.");
    return L.join("\n");
  }

  const recapSheet = $("#recapSheet");
  let recapCurrent = "";
  function showRecap(c) {
    recapCurrent = recapText(c);
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
      const card = el("section", { class: "card" }, el("h2", { text: "Les récaps du prof" }));
      [...RETOURS].reverse().forEach(r => {
        const box = el("div", { class: "card prof-card", style: "margin-top:10px" }, el("span", { class: "eyebrow", text: (r.date ? new Date(r.date).toLocaleDateString("fr-FR") + " · " : "") + (r.titre || "Récap") }));
        String(r.texte).split(/\n+/).forEach(t => box.append(el("p", { text: t })));
        card.append(box);
      });
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
      const ul = el("ul", { class: "list" });
      [...done].reverse().forEach(c => {
        const s = state.cours[c.id];
        ul.append(el("li", {},
          el("span", { class: "t" }, "Cours " + c.num, el("small", { text: `${c.titre} · ${new Date(s.finishedAt).toLocaleDateString("fr-FR")}` })),
          el("button", { class: "btn small", type: "button", onclick: () => showRecap(c) }, "Bilan")));
      });
      body.append(el("section", { class: "card" }, el("h2", { text: "Mes cours terminés" }), el("div", { style: "height:8px" }), ul));
    }

    // Jeux du manche, en libre
    if (window.Jeux) {
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
      body.append(el("section", { class: "card", style: "display:flex;flex-direction:column;gap:10px" },
        el("h2", { text: "Jeux du manche" }),
        el("p", { class: "muted small", text: "En dehors des cours, pour t'entraîner quand tu veux. Choisis tes cordes :" }),
        chips,
        el("div", { class: "row-tools" },
          el("button", { class: "btn jeu-btn", type: "button", onclick: () => Jeux.open(cfg("trouve")) }, "▶ Trouve les notes"),
          el("button", { class: "btn jeu-btn", type: "button", onclick: () => Jeux.open(cfg("nomme")) }, "▶ Quelle note ?"),
          el("button", { class: "btn jeu-btn", type: "button", onclick: () => Jeux.open(cfg("octave")) }, "▶ Octaves"),
          el("button", { class: "btn jeu-btn", type: "button", onclick: () => Jeux.open({ mode: "quiz", label: "Quiz du manche" }) }, "▶ Quiz 6 cordes"))));
    }

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
    const toggle = (label, hint, get, set) => {
      const b = el("button", { class: "switch", type: "button", role: "switch", "aria-checked": String(get()) });
      b.addEventListener("click", () => { set(!get()); b.setAttribute("aria-checked", String(get())); });
      return el("div", { class: "setting" }, el("div", {}, el("strong", { text: label }), el("span", { class: "muted small", text: hint })), b);
    };
    const reglages = el("section", { class: "card", style: "display:flex;flex-direction:column;gap:12px" },
      el("h2", { text: "Sons et voix" }),
      toggle("Petits sons", "Un « cling » quand tu coches un exercice, une mélodie quand un bloc ou un cours est fini.", () => Sons.sfx, v => { Sons.sfx = v; if (v) Sons.cling(); }));
    if (Sons.voixDispo) {
      reglages.append(toggle("Voix dans les jeux", "Une voix naturelle lit les questions et les réponses des jeux.", () => Sons.voix, v => { Sons.voix = v; if (v) Sons.dire("D'accord, je lis les consignes des jeux."); }));
      reglages.append(toggle("Le prof te parle", "Il présente le cours quand tu lances la séance, et fait le bilan quand tu le termines.", profOn, v => { try { localStorage.setItem("maguitare:prof", v ? "1" : "0"); } catch {} if (!v) Sons.tais(); }));
      reglages.append(choixVoix());
      reglages.append(el("p", { class: "muted small", text: "Dans chaque bloc, les boutons « Écouter » lisent la consigne, le « pourquoi » et l'explication. Les phrases sont enregistrées d'avance : une phrase toute neuve (après une adaptation du cours) est lue par la voix de ton appareil, le temps que je l'enregistre." }));
    }
    body.append(reglages);

    // Sauvegarde
    const fileIn = el("input", { type: "file", accept: "application/json,.json", hidden: true });
    fileIn.addEventListener("change", async () => {
      const f = fileIn.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || typeof data.cours !== "object") throw new Error();
        state = Object.assign(blank(), data); flush();
        toast("Sauvegarde restaurée."); renderTabs(); renderCours(); renderBilan();
      } catch { toast("Ce fichier n'est pas une sauvegarde de Ma guitare."); }
    });
    body.append(el("section", { class: "card", style: "display:flex;flex-direction:column;gap:10px" },
      el("h2", { text: "Mes données" }),
      el("p", { class: "muted small", text: "Tes cases, tempos et commentaires restent sur cet appareil. Fais une sauvegarde de temps en temps, ou pour passer du téléphone à l'ordi." }),
      el("div", { class: "row-tools" },
        el("button", { class: "btn", type: "button", onclick: exportData }, "Sauvegarder"),
        el("button", { class: "btn", type: "button", onclick: () => fileIn.click() }, "Restaurer"),
        el("button", { class: "btn", type: "button", onclick: checkUpdate }, "Chercher une mise à jour du cours")),
      fileIn,
      el("p", { class: "muted small", text: `Cours mis à jour le ${new Date(DATA.maj).toLocaleDateString("fr-FR")}.` }),
    ));
  }

  // Barres de progression : tout le parcours, puis chaque thème (exercices cochés sur les 36 cours).
  const BLOC_THEME = ["technique", "gammes", "penta", "manche", "barres", "morceaux"];
  function renderProgression() {
    const all = DATA.cours.flatMap(c => c.blocs.flatMap((b, bi) => b.exercices.map(e => ({ c, b, bi, e, theme: e.theme || BLOC_THEME[bi] || "morceaux", x: state.cours[c.id]?.ex[exKey(b, e)] }))));
    const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
    const bar = (n, t, cls = "") => el("div", { class: "progress " + cls, "aria-hidden": "true" }, el("i", { style: `width:${t ? (n / t) * 100 : 0}%` }));
    const nbDone = DATA.cours.filter(c => isDone(c.id)).length;
    const exDone = all.filter(a => a.x?.done).length;
    const card = el("section", { class: "card progression" },
      el("h2", { text: "Ma progression" }),
      el("div", { class: "prog-main" },
        el("div", { class: "prog-top" }, el("strong", { text: "Le parcours" }), el("span", { class: "prog-pct", text: pct(nbDone, DATA.cours.length) + " %" })),
        bar(nbDone, DATA.cours.length, "big"),
        el("span", { class: "muted small", text: `${nbDone} cours terminé${nbDone > 1 ? "s" : ""} sur ${DATA.cours.length} · ${exDone} exercices faits sur ${all.length}` })));
    const list = el("div", { class: "prog-list" });
    for (const t of DATA.themes || []) {
      const mine = all.filter(a => a.theme === t.id);
      if (!mine.length) continue;
      const d = mine.filter(a => a.x?.done).length;
      const fac = mine.filter(a => a.x?.feel === "facile").length, gal = mine.filter(a => a.x?.feel === "galere").length;
      const bits = [`${d} / ${mine.length} exercices`];
      if (fac) bits.push(`${fac} facile${fac > 1 ? "s" : ""}`);
      if (gal) bits.push(`${gal} galère${gal > 1 ? "s" : ""}`);
      const row = el("details", { class: "prog-row" });
      const sum = el("summary", {},
        el("div", { class: "prog-top" }, el("span", { text: t.label }), el("span", { class: "prog-pct", text: pct(d, mine.length) + " %" })),
        bar(d, mine.length, "theme"),
        el("span", { class: "muted small" }, bits.join(" · "), el("span", { class: "prog-voir", text: "Voir les exercices" })));
      row.append(sum);
      row.addEventListener("toggle", () => { if (row.open && !row.dataset.built) { row.dataset.built = "1"; row.append(themeDetail(mine)); } });
      list.append(row);
    }
    card.append(list);
    return card;
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
  function renderConstruction() {
    const card = el("section", { class: "card construction" }, el("h2", { text: "Comment est construit ton cours" }));
    const P = t => card.append(el("p", { text: t }));
    P(`${DATA.cours.length} cours : 12 semaines de 3 séances (A, B et C), en 3 paliers de 4 semaines. Chaque séance dure environ 1 h 10 et suit toujours les mêmes 6 blocs, dans le même ordre : échauffement, gamme, pentatonique, notes du manche, barrés et rythme, morceau.`);
    P("Le contenu change toutes les 2 semaines : chaque bloc apporte une nouveauté en semaine 1 et en semaine 3 de chaque palier. Pendant ces 2 semaines, tes 6 séances reprennent les mêmes exercices, et seul le bloc Morceau change un peu selon la séance. C'est voulu : un geste s'installe quand on le répète plusieurs jours de suite.");
    P("Les cours 12, 24 et 36 finissent chaque palier par un bilan de tests. Avec 5 tests réussis, tu passes au palier suivant. Sinon, on ajoute une semaine sur ce qui manque. Et chaque bilan que tu m'envoies me sert à adapter les cours suivants.");
    for (const p of DATA.paliers) {
      const pc = DATA.cours.filter(c => c.palier === p.num);
      const d = el("details", { class: "constr-pal" }, el("summary", {},
        el("strong", { text: `Palier ${p.num} · ${p.nom} : ${p.titre.toLowerCase()}` }),
        el("span", { class: "muted small", text: `Semaines ${pc[0].semaine} à ${pc.at(-1).semaine} · cours ${pc[0].num} à ${pc.at(-1).num}` })));
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
      card.append(d);
    }
    return card;
  }

  async function exportData() {
    flush();
    const json = JSON.stringify(state, null, 1);
    const name = `ma-guitare-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Sauvegarde Ma guitare" }); return; } catch (e) { if (e?.name === "AbortError") return; }
    }
    const a = el("a", { href: URL.createObjectURL(file), download: name }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
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
    blocTick(); unlockAudio();
    toast(`Minuteur lancé : ${min} min.`);
  }
  const pauseTimer = () => { if (blocT?.end) { blocT.left = blocLeft(); blocT.end = 0; blocTick(); } };
  const resumeTimer = () => { if (blocT && !blocT.end) { blocT.end = Date.now() + blocT.left; blocTick(); } };
  function stopTimer() { if (blocT) clearInterval(blocT.id); blocT = null; mini.hidden = true; updateTimers(); }
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
    o.connect(g).connect(ctx.destination); o.start(time); o.stop(time + 0.06);
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
    $("#metroToggle").textContent = "Arrêter"; badge.hidden = false;
  }
  function stopMetro() {
    metro.on = false; clearInterval(metro.id);
    $("#metroToggle").textContent = "Démarrer"; badge.hidden = true;
    dots.querySelectorAll("i").forEach(d => d.classList.remove("on", "accent"));
  }
  function openMetro(bpm) { if (bpm) setBpm(bpm); openSheet($("#metroSheet")); }
  $("#metroBtn").addEventListener("click", () => openMetro());
  $("#metroToggle").addEventListener("click", () => (metro.on ? stopMetro() : startMetro()));
  document.querySelectorAll("[data-bpm]").forEach(b => b.addEventListener("click", () => setBpm(metro.bpm + +b.dataset.bpm)));
  range.addEventListener("input", () => setBpm(+range.value));
  document.querySelectorAll("#metroBeats button").forEach(b => b.addEventListener("click", () => setBeats(+b.dataset.beats)));
  setBpm(metro.bpm); setBeats(metro.beats);

  // ---------- Feuilles et messages ----------
  function openSheet(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  document.querySelectorAll("dialog.sheet").forEach(d => {
    d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });
  let toastT = null;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200);
  }

  // ---------- Démarrage ----------
  async function boot() {
    try {
      DATA = await loadJSON("data/cours.json");
    } catch {
      $("#coursBody").replaceChildren(el("p", { class: "empty", text: "Impossible de charger le cours. Vérifie ta connexion puis rouvre l'app." }));
      return;
    }
    try { RETOURS = (await loadJSON("data/retours.json")).retours || []; } catch { RETOURS = []; }
    try { SCHEMAS = await loadJSON("data/schemas.json"); } catch { SCHEMAS = {}; }
    if (!state.current || !byId(state.current)) state.current = nextCours().id;
    renderTabs(); renderCours(); updateSeance();
    go(state.view === "bilan" ? "bilan" : "cours");
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
