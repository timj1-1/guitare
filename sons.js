/* Sons et voix de l'app : un seul contexte audio, petits sons de réussite, voix française de l'appareil. */
(() => {
  "use strict";

  const read = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === "1"; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch {} };
  let sfxOn = read("maguitare:sfx", true);
  let voixOn = read("maguitare:voix", true);

  // ---------- Contexte audio partagé (métronome, jeux, petits sons) ----------
  let actx = null;
  const ctx = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());
  function unlock() {
    const c = ctx();
    if (c.state === "suspended") c.resume();
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
    // sur iPhone : jouer même quand le bouton silencieux est activé
    try { if (navigator.audioSession && navigator.audioSession.type !== "play-and-record") navigator.audioSession.type = "playback"; } catch {}
  }

  // Une note de clochette : fondamentale + partiels inharmoniques, attaque nette, longue chute.
  function bell(freq, at, { gain = 0.35, decay = 0.9 } = {}) {
    const c = ctx(), out = c.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(gain, at + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    out.connect(c.destination);
    [[1, 1], [2.76, 0.32], [5.4, 0.12]].forEach(([r, g]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = "sine"; o.frequency.value = freq * r; og.gain.value = g;
      o.connect(og).connect(out); o.start(at); o.stop(at + decay + 0.05);
    });
  }
  const play = notes => {
    if (!sfxOn) return;
    try { unlock(); const t = ctx().currentTime + 0.02; notes.forEach(([f, dt, o]) => bell(f, t + dt, o)); } catch {}
  };
  const cling = () => play([[1568, 0, { gain: 0.28, decay: 0.55 }], [2349.3, 0.07, { gain: 0.2, decay: 0.7 }]]);
  const bloc = () => play([[1046.5, 0, {}], [1318.5, 0.11, {}], [1568, 0.22, {}], [2093, 0.33, { decay: 1.3 }]]);
  const fanfare = () => play([[784, 0, {}], [1046.5, 0.14, {}], [1318.5, 0.28, {}], [1568, 0.42, {}], [2093, 0.6, { gain: 0.4, decay: 1.8 }], [1568, 0.6, { gain: 0.2, decay: 1.8 }]]);
  const oups = () => play([[392, 0, { gain: 0.18, decay: 0.35 }]]);

  // ---------- Voix (gratuite : celle de l'iPhone ou du Mac) ----------
  const synth = window.speechSynthesis;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const fr = synth.getVoices().filter(v => /^fr/i.test(v.lang));
    const frFR = fr.filter(v => /fr[-_]FR/i.test(v.lang));
    voice = frFR.find(v => /Amélie|Audrey|Aurélie|Marie|Thomas|Google/i.test(v.name) && !/Compact/i.test(v.name))
      || frFR.find(v => v.localService) || frFR[0] || fr[0] || null;
  }
  if (synth) { pickVoice(); synth.addEventListener?.("voiceschanged", pickVoice); }
  const propre = t => String(t)
    .replace(/♯|#/g, " dièse").replace(/\bSib\b/g, "Si bémol").replace(/♭/g, " bémol")
    .replace(/→/g, ", ").replace(/\bp-i-m-a\b/gi, "p, i, m, a").replace(/\bi-m\b/g, "i, m")
    .replace(/\s+/g, " ").trim();
  let parleJusqua = 0;
  function dire(text, { force = false } = {}) {
    if (!synth || !text || (!voixOn && !force)) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(propre(text));
      u.lang = "fr-FR"; if (voice) u.voice = voice; u.rate = 1.02;
      u.onend = u.onerror = () => { parleJusqua = performance.now() + 350; };
      parleJusqua = Infinity;
      synth.speak(u);
    } catch {}
  }
  const tais = () => { try { synth?.cancel(); } catch {} parleJusqua = performance.now() + 200; };
  // vrai pendant que la voix parle (et un court instant après) : le micro du mode écoute l'ignore
  const parle = () => !!synth && (synth.speaking || performance.now() < parleJusqua);

  window.Sons = {
    ctx, unlock, cling, bloc, fanfare, oups, dire, tais, parle,
    get sfx() { return sfxOn; }, set sfx(v) { sfxOn = !!v; write("maguitare:sfx", sfxOn); },
    get voix() { return voixOn; }, set voix(v) { voixOn = !!v; write("maguitare:voix", voixOn); if (!voixOn) tais(); },
    voixDispo: !!synth,
  };
})();
