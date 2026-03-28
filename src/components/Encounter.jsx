import { useState, useEffect, useMemo, useRef } from "react";
import { PLANET_NARRATIVE } from "../data/narratives.js";
import { sfx, say } from "../utils/audio.js";
import { getSaber, sent } from "../utils/helpers.js";
import { logSpellingAttempt } from "../services/supabase.js";
import ForceParticles from "./ForceParticles";
import Keyboard from "./Keyboard";

const Encounter = ({ word, planet, pi, profile, onResult }) => {
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [sk, setSk] = useState(0);
  const [showSlash, setShowSlash] = useState(false);
  // Duel visual states
  const [playerAnim, setPlayerAnim] = useState("idle");
  const [enemyAnim, setEnemyAnim] = useState("idle");
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null);
  const [sparks, setSparks] = useState([]);

  const sn = useMemo(() => sent(word), [word]);
  const saber = getSaber(profile.lightsaberColor);
  const inp = useRef(null);
  const enIdx = useRef(Math.floor(Math.random() * planet.en.length));
  const enRef = useRef(planet.en[enIdx.current]);
  const enEmoji = useRef(planet.ee[enIdx.current]);
  const narrativeIntro = PLANET_NARRATIVE[pi]?.encounterIntros[enIdx.current] || "";
  const timerRef = useRef(null);
  const timers = useRef([]);

  const after = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };

  useEffect(() => {
    setTyped("");
    setResult(null);
    setShowSlash(false);
    setPlayerAnim("idle");
    setEnemyAnim("idle");
    const t = setTimeout(() => { say(word); inp.current?.focus(); }, 300);
    return () => clearTimeout(t);
  }, [word]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const triggerSparks = (count = 10) => {
    const s = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, angle: (i / count) * 360 + Math.random() * 30,
      dist: 20 + Math.random() * 40, size: 3 + Math.random() * 4, dur: 0.3 + Math.random() * 0.3,
    }));
    setSparks(s);
    after(() => setSparks([]), 800);
  };

  const submit = () => {
    if (!typed.trim() || result) return;
    if (typed.trim().toLowerCase() === word.toLowerCase()) {
      // ── CORRECT HIT ──
      setResult("ok"); sfx("ok"); setShowSlash(true);
      setPlayerAnim("attack");
      after(() => { setEnemyAnim("recoil"); triggerSparks(12); setFlash("green"); }, 200);
      after(() => setFlash(null), 600);
      after(() => { setPlayerAnim("idle"); setEnemyAnim("idle"); }, 800);
      logSpellingAttempt(profile.username, word, true, { level: profile.level });
      timerRef.current = after(() => onResult(true), 1400);
    } else {
      // ── WRONG ��� ENEMY ATTACKS ──
      setResult("no"); sfx("no"); setSk((k) => k + 1);
      setEnemyAnim("lunge");
      after(() => { setShake(true); setFlash("red"); setPlayerAnim("hit"); }, 200);
      after(() => { setShake(false); setFlash(null); }, 700);
      after(() => { setEnemyAnim("idle"); setPlayerAnim("idle"); }, 800);
      logSpellingAttempt(profile.username, word, false, { level: profile.level });
      timerRef.current = after(() => onResult(false), 1800);
    }
  };

  // Spark elements
  const sparkEls = sparks.map((s) => {
    const rad = (s.angle * Math.PI) / 180;
    return <div key={s.id} style={{ position: "absolute", left: `calc(50% + ${Math.cos(rad) * s.dist}px)`, top: `calc(18% + ${Math.sin(rad) * s.dist}px)`, width: s.size, height: s.size, borderRadius: "50%", background: saber.c, boxShadow: `0 0 ${s.size * 2}px ${saber.c}`, animation: `sparkBurst ${s.dur}s ease-out forwards`, pointerEvents: "none", zIndex: 115 }} />;
  });

  // Player animation styles
  const playerStyle = playerAnim === "attack"
    ? { transform: "translateX(20px) scaleX(-1)", transition: "transform .2s" }
    : playerAnim === "hit"
    ? { transform: "translateX(-10px) scaleX(-1)", filter: "brightness(2)", transition: "transform .15s" }
    : { transform: "scaleX(-1)", transition: "transform .3s" };

  // Enemy animation styles
  const enemyStyle = enemyAnim === "recoil"
    ? { animation: "bossRecoil .6s ease-out" }
    : enemyAnim === "lunge"
    ? { animation: "bossLunge .7s ease-out" }
    : {};

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 40%, #0a0a2a, #05050FEE)",
      zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: shake ? "screenShake .4s ease-out" : "encounterAppear .4s ease-out",
      overflow: "hidden",
    }}>
      <ForceParticles count={6} color={saber.c + "44"} />

      {/* Screen flash overlay */}
      {flash && <div style={{ position: "absolute", inset: 0, zIndex: 120, pointerEvents: "none", background: flash === "red" ? "#EE0000" : "#00EE00", animation: "flashOverlay .5s forwards" }} />}

      {/* Saber slash effect */}
      {showSlash && (
        <div style={{ position: "absolute", top: "16%", left: "50%", transform: "translateX(-50%)", width: 220, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${saber.c}, ${saber.c}, transparent)`, boxShadow: `0 0 25px ${saber.c}, 0 0 50px ${saber.g}`, animation: "saberSlash .5s forwards", zIndex: 116, pointerEvents: "none" }} />
      )}

      {/* Spark particles */}
      {sparkEls}

      {/* ── DUEL SCENE ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10, position: "relative" }}>
        {/* Player */}
        <div style={{ textAlign: "center", ...playerStyle }}>
          <div style={{ fontSize: 48, filter: `drop-shadow(0 0 8px ${saber.c})` }}>🥷</div>
        </div>
        {/* Saber beam between them */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${saber.c}, transparent)`, boxShadow: `0 0 10px ${saber.g}`, opacity: result === "ok" ? 1 : 0.3, transition: "opacity .3s" }} />
        {/* VS indicator */}
        <div style={{ fontSize: 12, fontWeight: 900, color: "#EE666666", letterSpacing: 2 }}>VS</div>
        {/* Enemy */}
        <div style={{ textAlign: "center", ...enemyStyle }}>
          <div style={{ fontSize: 52, filter: `drop-shadow(0 0 8px ${planet.c})` }}>{enEmoji.current}</div>
        </div>
      </div>

      {/* Enemy name + narrative */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#EE666688", letterSpacing: 2 }}>ENCOUNTER</div>
        <div style={{ fontSize: 14, color: planet.c, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>{enRef.current}</div>
        {narrativeIntro && <div style={{ fontSize: 11, color: "#8888AA", fontStyle: "italic", marginTop: 4, maxWidth: 340, lineHeight: 1.5 }}>{narrativeIntro}</div>}
      </div>

      {/* Sentence */}
      <div style={{ fontSize: 14, color: "#AABB", textAlign: "center", maxWidth: 400, padding: "0 20px", lineHeight: 1.6, marginBottom: 10 }}>{result === "ok" ? sn.full : sn.masked}</div>

      <button onClick={() => say(word)} style={{ marginBottom: 8, padding: "5px 14px", fontSize: 11, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>

      {/* Typed word display */}
      <div key={sk} style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, textAlign: "center", color: result === "ok" ? "#44CC44" : result === "no" ? "#EE4444" : "#FFE066", fontFamily: "monospace", minHeight: 40, marginBottom: 6, animation: result === "no" ? "headShake .5s" : "none" }}>
        {typed || <span style={{ color: "#333", fontSize: 12, letterSpacing: 2 }}>TYPE THE WORD...</span>}
      </div>

      {result && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 8, color: result === "ok" ? "#44CC44" : "#EE4444", animation: "fadeSlideUp .3s" }}>{result === "ok" ? "✦ CORRECT! +100" : `✗ THE WORD WAS: ${word.toUpperCase()}`}</div>}
      {result === "no" && <div style={{ fontSize: 11, color: "#AA666688", marginBottom: 6 }}>-1 Force</div>}

      <input ref={inp} type="text" value={typed} onChange={(e) => { if (!result) setTyped(e.target.value.toLowerCase()); }} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
      <Keyboard onKey={(k) => { if (!result) { setTyped((t) => t + k); inp.current?.focus(); } }} onDel={() => { if (!result) setTyped((t) => t.slice(0, -1)); }} onSubmit={submit} typed={typed.trim()} result={result} saber={saber} />
    </div>
  );
};

export default Encounter;
