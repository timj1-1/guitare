/* Les réglages de l'app (Mon bilan › Réglages), lus partout : l'app, les jeux et Mon manche.
   Chargé dans <head>, avant l'affichage, pour que le thème et la taille du texte s'appliquent tout de suite. */
(() => {
  "use strict";
  // clé dans le stockage, valeur par défaut ; le nom des notes est celui de Mon manche (même clé)
  const DEF = {
    volSons:     ["maguitare:volSons", 100],   // guitare, petits sons, jeux, Mon manche (0 à 100)
    volMetro:    ["maguitare:volMetro", 100],  // métronome (0 à 100)
    vitesseVoix: ["maguitare:vitesseVoix", 1], // voix du prof et des jeux (0.8 à 1.3)
    introAuto:   ["maguitare:introAuto", true],// le prof présente le cours dès qu'on le lance
    animation:   ["maguitare:anim", true],     // la partie annoncée grossit et l'écran la suit
    notation:    ["manche:naming", "fr"],      // "fr" (Do Ré Mi) ou "en" (C D E)
    gaucher:     ["maguitare:gaucher", false], // manches dessinés pour un gaucher
    theme:       ["maguitare:theme", "auto"],  // "auto", "light" ou "dark"
    texte:       ["maguitare:texte", 1],       // taille du texte (0.9 à 1.3)
    rappel:      ["maguitare:rappel", { jours: ["MO", "WE", "FR"], heure: "18:30" }],
  };
  const get = k => {
    const [cle, d] = DEF[k];
    try { const v = localStorage.getItem(cle); if (v == null) return d; const x = JSON.parse(v); return typeof x === typeof d ? x : d; } catch { return d; }
  };
  const ecoute = new Set();
  const sombre = window.matchMedia?.("(prefers-color-scheme: dark)");
  sombre?.addEventListener?.("change", () => applique());
  function applique() {
    const r = document.documentElement;
    // « auto » : le thème du téléphone ; le style n'a ainsi qu'une seule liste de couleurs sombres
    const t = get("theme");
    r.setAttribute("data-theme", t === "light" || t === "dark" ? t : sombre?.matches ? "dark" : "light");
    r.style.setProperty("--txt", String(Math.min(1.3, Math.max(0.85, +get("texte") || 1))));
    r.classList.toggle("gaucher", !!get("gaucher"));
    r.classList.toggle("sans-anim", !get("animation"));
  }
  function set(k, v) {
    try { localStorage.setItem(DEF[k][0], JSON.stringify(v)); } catch {}
    applique();
    ecoute.forEach(fn => { try { fn(k, v); } catch {} });
  }
  // un réglage changé dans un autre onglet ou dans le cadre de Mon manche
  window.addEventListener("storage", e => {
    const k = Object.keys(DEF).find(x => DEF[x][0] === e.key); if (!k) return;
    applique(); ecoute.forEach(fn => { try { fn(k, get(k)); } catch {} });
  });
  applique();
  window.Reglages = { get, set, on: fn => ecoute.add(fn), DEF };
})();
