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
    }
  } catch {}
};

export const say = (w) => {
  if (_muted) return;
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(w);
  u.rate = 0.85;
  speechSynthesis.speak(u);
};
