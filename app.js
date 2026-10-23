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
  let DATA = null, RETOURS = [];
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
  function go(view, opts = {}) {
    if (!VIEWS.includes(view)) view = "cours";
    if (state.view === "cours" && view !== "cours") coursScroll = window.scrollY;
    state.view = view; save();
    for (const v of VIEWS) $("#view-" + v).hidden = v !== view;
    document.querySelectorAll(".tabbar button").forEach(b => { if (b.dataset.go === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (view === "manche") openManche(opts.pos); else $("#backToCours").hidden = true;
    if (view === "bilan") renderBilan();
    if (opts.keepScroll && view === "cours") window.scrollTo({ top: coursScroll });
    else if (!opts.keepScroll) window.scrollTo({ top: 0 });
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
  $("#backToCours").addEventListener("click", () => go("cours", { keepScroll: true }));

  // ---------- Onglets des cours ----------
  function renderTabs() {
    const nav = $("#coursTabs");
    nav.replaceChildren();
    let week = 0;
    for (const c of DATA.cours) {
      if (c.semaine !== week) { week = c.semaine; nav.append(el("span", { class: "tab-week", text: "S" + week })); }
      const cls = ["ctab", isDone(c.id) ? "done" : isStarted(c.id) ? "started" : ""].join(" ");
      nav.append(el("button", {
        type: "button", class: cls, "aria-current": c.id === state.current ? "true" : "false",
        "data-id": c.id, title: c.titre, onclick: () => selectCours(c.id),
      }, el("span", { class: "dot", "aria-hidden": "true" }), "Cours " + c.num));
    }
    const cur = nav.querySelector('[aria-current="true"]');
    if (cur) requestAnimationFrame(() => cur.scrollIntoView({ inline: "center", block: "nearest" }));
  }
  function selectCours(id) {
    state.current = id; save();
    renderTabs(); renderCours();
    window.scrollTo({ top: 0 });
  }

  // ---------- Un cours ----------
  const ICON_POS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="2.5" width="8" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.8" r="1.6" fill="currentColor"/></svg>';
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

    const pr = progressOf(c);
    const bar = el("i", { style: `width:${pr.total ? (pr.done / pr.total) * 100 : 0}%` });
    const prLabel = el("span", { class: "progress-label", text: `${pr.done} / ${pr.total} exercices faits` });
    body.append(el("div", { class: "cours-head" },
      el("span", { class: "eyebrow", text: `Palier ${p.num} · ${p.titre}` }),
      el("h1", { text: "Cours " + c.num }),
      el("p", { class: "sub", text: c.titre }),
      el("div", { class: "progress", "aria-hidden": "true" }, bar),
      prLabel,
    ));
    const updateProgress = () => {
      const q = progressOf(c);
      bar.style.width = (q.total ? (q.done / q.total) * 100 : 0) + "%";
      prLabel.textContent = `${q.done} / ${q.total} exercices faits`;
      const tab = document.querySelector(`.ctab[data-id="${c.id}"]`);
      if (tab && !isDone(c.id)) tab.classList.toggle("started", isStarted(c.id));
    };

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
    inner.append(el("p", { class: "faire" }, el("strong", { text: "À faire : " }), b.faire));

    const tools = el("div", { class: "row-tools" });
    tools.append(el("button", { class: "btn small", type: "button", onclick: () => startTimer(b.duree, b.titre.replace(/^\d+\.\s*/, "")) }, `Minuteur ${b.duree} min`));
    (b.positions || []).forEach(pz => {
      const btn = el("button", { class: "btn small pos-btn", type: "button", title: "Voir sur le manche", onclick: () => go("manche", { pos: pz.code }) });
      btn.innerHTML = ICON_POS; btn.append(pz.label);
      tools.append(btn);
    });
    inner.append(tools);

    const ul = el("ul", { class: "exos" });
    b.exercices.forEach(e => ul.append(renderExo(c, b, e, () => { card.classList.toggle("complete", complete()); updateProgress(); })));
    inner.append(ul);

    const more = el("details", { class: "more" }, el("summary", { text: "Explication et vidéos" }));
    const mi = el("div", { class: "more-in" });
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
    if (b.explication.some(t => typeof t === "object")) more.open = true;
    if (b.videos?.length) {
      const vl = el("ul", { class: "videos" });
      b.videos.forEach(v => vl.append(el("li", {}, el("a", { href: v.u, target: "_blank", rel: "noopener" }, el("span", { class: "play", "aria-hidden": "true" }), v.t))));
      mi.append(vl);
    }
    more.append(mi);
    inner.append(more);
    return card;
  }

  function renderExo(c, b, e, onChange) {
    const key = exKey(b, e);
    const x = exState(c.id, key);
    const id = "x-" + c.id + "-" + key.replace(/\W/g, "-");
    const li = el("li", { class: "exo" + (x.done ? " is-done" : "") });
    const box = el("input", { type: "checkbox", class: "check", id, checked: !!x.done, "aria-label": e.label });
    box.addEventListener("change", () => { x.done = box.checked; li.classList.toggle("is-done", x.done); touch(c); save(); onChange(); });
    const label = el("label", { class: "exo-label", for: id }, e.label, e.aide ? el("span", { class: "aide", text: e.aide }) : null);
    const main = el("div", { class: "exo-main" }, box, label);
    if (e.tempo) main.append(el("button", { class: "tempo-chip", type: "button", title: "Régler le métronome", onclick: () => openMetro(x.tempo || e.tempo) }, `${e.tempo} bpm`));
    li.append(main);

    const moreRow = el("div", { class: "exo-more" });
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
    li.append(moreRow, noteWrap);
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
          if (!x.done && res.score / res.total >= 0.8) { x.done = true; box.checked = true; li.classList.add("is-done"); }
          touch(c); save(); showLast(); onChange();
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
        el("p", { text: `Terminé le ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}.` }),
        el("button", { class: "btn primary", type: "button", onclick: () => showRecap(c) }, "Revoir et renvoyer mon bilan"),
        el("button", { class: "btn ghost", type: "button", onclick: () => { delete s.finishedAt; save(); renderTabs(); renderCours(); } }, "Rouvrir ce cours"));
    }
    const field = (k, label, hint) => {
      const ta = el("textarea", { rows: "2", placeholder: hint });
      ta.value = s[k] || "";
      ta.addEventListener("input", () => { s[k] = ta.value.trim() ? ta.value : undefined; save(); });
      return el("label", {}, label, ta);
    };
    const duree = el("input", { type: "number", inputmode: "numeric", min: "0", max: "300", placeholder: "70", value: s.duree ?? "", "aria-label": "Durée en minutes" });
    duree.addEventListener("input", () => { const v = parseInt(duree.value, 10); s.duree = Number.isFinite(v) ? v : undefined; save(); });
    return el("section", { class: "card fin" },
      el("span", { class: "eyebrow", text: "Fin du cours" }),
      el("h2", { text: "Comment ça s'est passé ?" }),
      field("galere", "Là où j'ai galéré", "Un geste, un passage, une main qui fatigue…"),
      field("bien", "Ce qui a bien marché", "Ce qui est devenu plus facile, une petite victoire…"),
      field("autre", "Pour mon prof", "Une envie, une question, du temps en plus ou en moins…"),
      el("label", { class: "tempo-in", style: "flex-direction:row;font-weight:600;color:var(--ink)" }, "Durée de la séance", duree, "min"),
      el("button", { class: "btn ok big", type: "button", onclick: () => finish(c) }, "Terminer le cours"),
    );
  }

  function finish(c) {
    const s = cs(c.id);
    s.finishedAt = new Date().toISOString();
    flush();
    renderTabs(); renderCours();
    showRecap(c);
  }

  // ---------- Bilan envoyé au prof ----------
  const FEEL = { facile: "facile", correct: "correct", galere: "GALÈRE" };
  function recapText(c) {
    const s = cs(c.id);
    const d = s.finishedAt ? new Date(s.finishedAt) : new Date();
    const pr = progressOf(c);
    const L = [];
    L.push(`Bilan du cours ${c.num} (${c.titre}, palier ${c.palier}) — ${d.toLocaleDateString("fr-FR")}`);
    L.push(`Fait : ${pr.done}/${pr.total} exercices` + (s.duree ? ` · durée ${s.duree} min` : ""));
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
      el("div", { class: "stat" }, el("b", { text: "Palier " + nxt.palier }), el("span", { text: palierOf(nxt).titre })),
    ));

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
      renderTabs(); renderCours(); renderBilan();
      toast(changed ? "Cours mis à jour." : "Ton cours est déjà à jour.");
    } catch { toast("Pas de connexion : réessaie plus tard."); }
  }

  // ---------- Minuteur de bloc ----------
  let timer = null;
  const mini = $("#miniTimer");
  function startTimer(min, label) {
    stopTimer();
    const end = Date.now() + min * 60000;
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      const m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000);
      mini.textContent = `${m}:${String(sec).padStart(2, "0")}`;
      if (left <= 0) { stopTimer(); ding(); toast(`Fin du bloc « ${label} ». Pause d'une minute !`); navigator.vibrate?.([200, 100, 200]); }
    };
    mini.hidden = false; mini.title = label + " (touche pour arrêter)";
    timer = setInterval(tick, 250); tick();
    unlockAudio();
    toast(`Minuteur lancé : ${min} min.`);
  }
  function stopTimer() { clearInterval(timer); timer = null; mini.hidden = true; }
  mini.addEventListener("click", () => { stopTimer(); toast("Minuteur arrêté."); });

  // ---------- Métronome ----------
  let actx = null;
  const getCtx = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());
  function unlockAudio() {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
  }
  function click(time, accent) {
    const ctx = getCtx(), o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = accent ? 1760 : 1100;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.55, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    o.connect(g).connect(ctx.destination); o.start(time); o.stop(time + 0.06);
  }
  function ding() {
    try {
      const ctx = getCtx(), t = ctx.currentTime;
      [880, 1318.5].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.25); g.gain.exponentialRampToValueAtTime(0.6, t + i * 0.25 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 0.6);
        o.connect(g).connect(ctx.destination); o.start(t + i * 0.25); o.stop(t + i * 0.25 + 0.65);
      });
    } catch {}
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
    metro.on = true; metro.beat = 0; metro.next = getCtx().currentTime + 0.06;
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
    if (!state.current || !byId(state.current)) state.current = nextCours().id;
    renderTabs(); renderCours();
    go(state.view === "bilan" ? "bilan" : "cours", { keepScroll: true });
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
