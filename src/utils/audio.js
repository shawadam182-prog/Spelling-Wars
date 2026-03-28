// ─── AUDIO CONTEXT ──────────────────────────────────────────────────────────

let _audioCtx = null;
const getAudioCtx = () => {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
};

// Persistent mute system
let _muted = false;
try { _muted = localStorage.getItem("jedi_muted") === "true"; } catch {}
export const isMuted = () => _muted;
export const setMutedGlobal = (v) => {
  _muted = v;
  try { localStorage.setItem("jedi_muted", v ? "true" : "false"); } catch {}
};

export const sfx = (t) => {
  if (_muted) return;
  try {
    const c = getAudioCtx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    if (t === "ok") {
      o.frequency.setValueAtTime(523, c.currentTime);
      o.frequency.setValueAtTime(659, c.currentTime + 0.1);
      o.frequency.setValueAtTime(784, c.currentTime + 0.2);
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
      o.start(); o.stop(c.currentTime + 0.4);
    } else if (t === "no") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, c.currentTime);
      o.frequency.setValueAtTime(100, c.currentTime + 0.15);
      g.gain.setValueAtTime(0.1, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3);
      o.start(); o.stop(c.currentTime + 0.3);
    } else if (t === "pip") {
      o.frequency.setValueAtTime(880, c.currentTime);
      o.frequency.setValueAtTime(1100, c.currentTime + 0.08);
      g.gain.setValueAtTime(0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
      o.start(); o.stop(c.currentTime + 0.2);
    } else if (t === "step") {
      o.frequency.setValueAtTime(300 + Math.random() * 80, c.currentTime);
      g.gain.setValueAtTime(0.03, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
      o.start(); o.stop(c.currentTime + 0.06);
    } else if (t === "boss") {
      o.type = "square";
      o.frequency.setValueAtTime(100, c.currentTime);
      o.frequency.setValueAtTime(60, c.currentTime + 0.5);
      g.gain.setValueAtTime(0.1, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.8);
      o.start(); o.stop(c.currentTime + 0.8);
    } else if (t === "win") {
      o.frequency.setValueAtTime(523, c.currentTime);
      o.frequency.setValueAtTime(659, c.currentTime + 0.15);
      o.frequency.setValueAtTime(784, c.currentTime + 0.3);
      o.frequency.setValueAtTime(1047, c.currentTime + 0.45);
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.7);
      o.start(); o.stop(c.currentTime + 0.7);
    } else if (t === "saber") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, c.currentTime);
      o.frequency.setValueAtTime(220, c.currentTime + 0.1);
      o.frequency.setValueAtTime(200, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
      o.start(); o.stop(c.currentTime + 0.4);
    } else if (t === "attack") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(120, c.currentTime);
      o.frequency.setValueAtTime(60, c.currentTime + 0.2);
      g.gain.setValueAtTime(0.18, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);
      o.start(); o.stop(c.currentTime + 0.5);
    } else if (t === "lightning") {
      o.type = "square";
      o.frequency.setValueAtTime(900, c.currentTime);
      o.frequency.setValueAtTime(200, c.currentTime + 0.04);
      o.frequency.setValueAtTime(700, c.currentTime + 0.08);
      o.frequency.setValueAtTime(150, c.currentTime + 0.12);
      g.gain.setValueAtTime(0.1, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
      o.start(); o.stop(c.currentTime + 0.2);
    } else if (t === "explode") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, c.currentTime);
      o.frequency.setValueAtTime(50, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.6);
      o.start(); o.stop(c.currentTime + 0.6);
    } else if (t === "key") {
      o.frequency.setValueAtTime(600 + Math.random() * 100, c.currentTime);
      g.gain.setValueAtTime(0.02, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
      o.start(); o.stop(c.currentTime + 0.04);
    }
  } catch {}
};

// ─── AMBIENT DRONE ─────────────────────────────────────────────────────────
// Very quiet continuous tone per planet, creates atmosphere

const AMBIENT_CONFIGS = [
  { freq: 110, type: "sine", gain: 0.025 },     // Tatooine — warm desert hum
  { freq: 280, type: "sine", gain: 0.015 },     // Hoth — icy wind
  { freq: 130, type: "sine", gain: 0.025 },     // Dagobah — swamp ambiance
  { freq: 60, type: "sawtooth", gain: 0.015 },  // Mustafar — volcanic rumble
  { freq: 150, type: "sine", gain: 0.02 },      // Endor — forest hum
  { freq: 90, type: "triangle", gain: 0.02 },   // Kashyyyk — deep forest
  { freq: 200, type: "sine", gain: 0.02 },      // Naboo — gentle breeze
  { freq: 120, type: "square", gain: 0.015 },   // Death Star — mechanical
  { freq: 70, type: "sawtooth", gain: 0.02 },   // Coruscant — city rumble
  { freq: 100, type: "triangle", gain: 0.02 },  // Jakku — desert wind
];

let _ambientOsc = null;
let _ambientGain = null;

export const startAmbient = (planetIndex) => {
  stopAmbient();
  if (_muted) return;
  try {
    const c = getAudioCtx();
    if (!c) return;
    const cfg = AMBIENT_CONFIGS[planetIndex] || AMBIENT_CONFIGS[0];
    _ambientOsc = c.createOscillator();
    _ambientGain = c.createGain();
    _ambientOsc.type = cfg.type;
    _ambientOsc.frequency.setValueAtTime(cfg.freq, c.currentTime);
    _ambientGain.gain.setValueAtTime(cfg.gain, c.currentTime);
    _ambientOsc.connect(_ambientGain);
    _ambientGain.connect(c.destination);
    _ambientOsc.start();
  } catch {}
};

export const stopAmbient = () => {
  try {
    if (_ambientOsc) { _ambientOsc.stop(); _ambientOsc.disconnect(); }
    if (_ambientGain) _ambientGain.disconnect();
  } catch {}
  _ambientOsc = null;
  _ambientGain = null;
};

// ─── LOW FORCE HEARTBEAT ───────────────────────────────────────────────────
// Rhythmic pulse when Force is critically low

let _heartbeatTimer = null;

export const startHeartbeat = () => {
  if (_heartbeatTimer) return;
  const pulse = () => {
    if (_muted) return;
    try {
      const c = getAudioCtx();
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(55, c.currentTime);
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      o.start(); o.stop(c.currentTime + 0.25);
    } catch {}
  };
  pulse();
  _heartbeatTimer = setInterval(pulse, 1200);
};

export const stopHeartbeat = () => {
  if (_heartbeatTimer) { clearInterval(_heartbeatTimer); _heartbeatTimer = null; }
};

// ─── COMBO-AWARE CORRECT SOUND ─────────────────────────────────────────────

export const sfxComboOk = (combo = 0) => {
  if (_muted) return;
  try {
    const c = getAudioCtx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    // Base pitch rises with combo
    const pitch = Math.min(combo, 6) * 40;
    o.frequency.setValueAtTime(523 + pitch, c.currentTime);
    o.frequency.setValueAtTime(659 + pitch, c.currentTime + 0.1);
    o.frequency.setValueAtTime(784 + pitch, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.12 + Math.min(combo, 5) * 0.01, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
    o.start(); o.stop(c.currentTime + 0.4);
  } catch {}
};

export const say = (w) => {
  if (_muted) return;
  if (typeof speechSynthesis === "undefined") return;
  try {
    speechSynthesis.cancel();
    // Small delay after cancel to avoid Chrome killing the new utterance
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(w);
      u.lang = "en-GB";
      u.rate = 0.85;
      // Pick a voice if available (prefer UK English for Arthur)
      const voices = speechSynthesis.getVoices();
      const gbVoice = voices.find((v) => v.lang === "en-GB") || voices.find((v) => v.lang.startsWith("en"));
      if (gbVoice) u.voice = gbVoice;
      speechSynthesis.speak(u);
    }, 50);
  } catch {}
};
