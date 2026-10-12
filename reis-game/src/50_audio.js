
/* ───────── audio: Hicaz strings + darbuka, SFX, ElevenLabs voices with lip-sync ───────── */
let AC = null, master, musicG, sfxG, voiceG, eng, siren, musicOn = true, combatK = 0;
function initAudio() {
  if (AC) { AC.resume?.(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.8; master.connect(AC.destination);
  musicG = AC.createGain(); musicG.gain.value = 0.26; musicG.connect(master);
  sfxG = AC.createGain(); sfxG.gain.value = 0.9; sfxG.connect(master);
  voiceG = AC.createGain(); voiceG.gain.value = 1.25; voiceG.connect(master);
  for (const f of [73.42, 110]) {
    const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 260; g.gain.value = 0.04;
    o.connect(lp).connect(g).connect(musicG); o.start();
  }
  eng = { o: AC.createOscillator(), o2: AC.createOscillator(), lp: AC.createBiquadFilter(), g: AC.createGain() };
  eng.o.type = 'sawtooth'; eng.o2.type = 'square'; eng.lp.type = 'lowpass'; eng.lp.frequency.value = 520; eng.g.gain.value = 0;
  eng.o.connect(eng.lp); eng.o2.connect(eng.lp); eng.lp.connect(eng.g).connect(sfxG); eng.o.start(); eng.o2.start();
  siren = { o: AC.createOscillator(), g: AC.createGain() }; siren.o.type = 'triangle'; siren.g.gain.value = 0;
  siren.o.connect(siren.g).connect(sfxG); siren.o.start();
  nextNote = AC.currentTime + 0.1;
  setInterval(scheduler, 50);
  loadVoices();
}
const HICAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16];
let nextNote = 0, step = 0, deg = 2;
const MAQSUM = ['D', 'T', 0, 'T', 'D', 0, 'T', 0];
const FIGHT = ['D', 'T', 'T', 'D', 'D', 'T', 'T', 'T'];
function scheduler() {
  if (!AC) return;
  const beat = 60 / lerp(88, 132, combatK) / 2;
  while (nextNote < AC.currentTime + 0.2) {
    if (musicOn) {
      const hit = (combatK > 0.5 ? FIGHT : MAQSUM)[step % 8];
      if (hit) drum(hit, nextNote);
      if (Math.random() < 0.62 && step % 16 < 13) {
        deg = clamp(deg + pick([-1, -1, 1, 1, 0, 2, -2]), 0, HICAZ.length - 1);
        pluck(146.83 * Math.pow(2, HICAZ[deg] / 12), nextNote, step % 8 === 0 ? 0.1 : 0.065);
      }
      if (combatK > 0.5 && step % 4 === 0) pluck(73.42, nextNote, 0.12);
    }
    step++; nextNote += beat;
  }
}
function pluck(f, t, v, dest) {
  const o = AC.createOscillator(), o2 = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.setValueAtTime(f * 1.012, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o2.frequency.value = f * 2;
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(lp); o2.connect(lp); lp.connect(g).connect(dest || musicG); o.start(t); o2.start(t); o.stop(t + 0.75); o2.stop(t + 0.75);
}
let noiseBuf = null;
function noise() { if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = AC.createBufferSource(); s.buffer = noiseBuf; return s; }
function drum(k, t) {
  if (k === 'D') {
    const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g).connect(musicG); o.start(t); o.stop(t + 0.4);
  } else {
    const n = noise(), bp = AC.createBiquadFilter(), g = AC.createGain(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.4;
    g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); n.connect(bp).connect(g).connect(musicG); n.start(t); n.stop(t + 0.1);
  }
}
const listener = new T.Vector3();
function distVol(pos, range = 60) { if (!pos) return 1; return clamp(1 - listener.distanceTo(pos) / range, 0, 1); }
function sfx(kind, pos) {
  if (!AC) return; const t = AC.currentTime, v = distVol(pos, kind === 'gun' ? 160 : 60);
  if (v <= 0.01) return;
  const out = AC.createGain(); out.gain.value = v; out.connect(sfxG);
  const burst = (freq, len, vol, q = 0.7, type = 'lowpass') => { const n = noise(), f = AC.createBiquadFilter(), g = AC.createGain(); f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); n.connect(f).connect(g).connect(out); n.start(t); n.stop(t + len + 0.05); };
  const thump = (f0, f1, len, vol) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(g).connect(out); o.start(t); o.stop(t + len + 0.05); };
  if (kind === 'coin') { pluck(880, t, 0.15, out); pluck(1320, t + 0.08, 0.15, out); }
  if (kind === 'punch') { thump(140, 60, 0.15, 0.7); burst(1800, 0.06, 0.35); }
  if (kind === 'whoosh') burst(900, 0.18, 0.12, 0.5, 'bandpass');
  if (kind === 'gun') { burst(5000, 0.08, 0.9); burst(700, 0.35, 0.7); thump(160, 40, 0.25, 0.8); }
  if (kind === 'empty') { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = 1800; g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03); o.connect(g).connect(out); o.start(t); o.stop(t + 0.05); }
  if (kind === 'reload') { for (const d of [0, 0.35, 0.6]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = 900 + d * 600; g.gain.setValueAtTime(0.07, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.05); o.connect(g).connect(out); o.start(t + d); o.stop(t + d + 0.08); } }
  if (kind === 'whiz') burst(2500, 0.12, 0.15, 3, 'bandpass');
  if (kind === 'crash') { burst(900, 0.5, 0.6); thump(90, 40, 0.3, 0.6); }
  if (kind === 'thud' || kind === 'door' || kind === 'fall') { burst(300, 0.18, 0.4); thump(80, 40, 0.2, 0.4); }
  if (kind === 'ring') for (const d of [0, 0.5, 1.2, 1.7]) for (const f of [1320, 1660]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.02); g.gain.setValueAtTime(0.05, t + d + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.4); o.connect(g).connect(out); o.start(t + d); o.stop(t + d + 0.45); }
  if (kind === 'eat') { burst(2000, 0.08, 0.2, 2, 'bandpass'); }
  if (kind === 'win' || kind === 'fail') (kind === 'win' ? [0, 4, 7, 12] : [0, 1, -4]).forEach((s, i) => pluck(146.83 * Math.pow(2, s / 12), t + i * 0.12, 0.16, out));
}
function honk(pos) {
  if (!AC) return; const v = distVol(pos, 70); if (v < 0.02) return; const t = AC.currentTime;
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.02); g.gain.setValueAtTime(0.12 * v, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  for (const f of [370, 466]) { const o = AC.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 0.5); }
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; g.connect(lp).connect(sfxG);
}

/* voices: decoded once, played through an analyser so the speaker's jaw follows the words */
const VOICE_IDS = ['k1', 'r1', 'k2', 'r2', 'k3', 'z1', 'z2', 'r3', 'z3', 'r4', 'h1', 'r5', 'h2', 'r6', 't0', 't1', 'r7', 't2', 'r8', 't3', 'b1', 'b2', 'b3', 'rb1', 'rb2', 'pol', 'ped', 'm_e1', 'm_b1', 'm_e2', 'm_e3', 'm_e4', 'm_s1', 'm_b2', 'm_b3', 'm_d1', 'm_b4', 'm_b5', 'm_d2', 'm_d3', 'm_e5', 'm_b6'];
const voices = {};
let voicesReady = false;
async function loadVoices() {
  await Promise.all(VOICE_IDS.map(async id => {
    try { const r = await fetch(`voice/${id}.mp3`); const buf = await r.arrayBuffer(); voices[id] = await AC.decodeAudioData(buf); } catch (e) { /* missing voice → subtitles only */ }
  }));
  voicesReady = true;
}
const speaking = [];
function say(id, human, pos, opts = {}) {
  if (!AC || !voices[id]) return 0;
  const src = AC.createBufferSource(); src.buffer = voices[id];
  const an = AC.createAnalyser(); an.fftSize = 256;
  const g = AC.createGain(); g.gain.value = (opts.vol ?? 1) * (pos ? distVol(pos, 45) : 1);
  src.connect(an);
  if (opts.phone) { const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; an.connect(hp).connect(lp).connect(g); g.gain.value *= 1.25; }
  else an.connect(g);
  g.connect(voiceG);
  if (combatK > 0.3 && musicG) musicG.gain.setTargetAtTime(0.12, AC.currentTime, 0.1);
  const entry = { src, an, human, data: new Uint8Array(an.fftSize), done: false };
  src.onended = () => { entry.done = true; if (human) human.talk = 0; };
  src.start(); speaking.push(entry);
  return voices[id].duration;
}
function stopVoices() { for (const s of speaking) { try { s.src.stop(); } catch (e) {} if (s.human) s.human.talk = 0; } speaking.length = 0; }
function updateLipSync() {
  for (let i = speaking.length - 1; i >= 0; i--) {
    const s = speaking[i];
    if (s.done) { speaking.splice(i, 1); continue; }
    if (!s.human) continue;
    s.an.getByteTimeDomainData(s.data);
    let sum = 0; for (let k = 0; k < s.data.length; k++) { const v = (s.data[k] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / s.data.length);
    s.human.talk = lerp(s.human.talk, clamp(rms * 7, 0, 1), 0.5);
  }
}
let lastBark = 0;
function bark(ids, human, pos) { const now = performance.now(); if (now - lastBark < 2500) return; lastBark = now; say(pick(ids), human, pos); }
