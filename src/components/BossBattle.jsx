import { useState, useEffect, useMemo, useRef } from "react";
import { BOSS_DIALOGUE } from "../data/dialogue.js";
import { sfx, say } from "../utils/audio.js";
import { getSaber, sent } from "../utils/helpers.js";
import { logSpellingAttempt } from "../services/supabase.js";
import Stars from "./Stars";
import Nebula from "./Nebula";
import ForceParticles from "./ForceParticles";
import ForceMeter from "./ForceMeter";
import WordTiles from "./WordTiles";
import Keyboard from "./Keyboard";

const BossBattle = ({ boss, pi, words, planet, profile, onWin, onLose }) => {
  const [round, setRound] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [hp, setHp] = useState(boss.hp);
  const [force, setForce] = useState(5);
  const [sk, setSk] = useState(0);
  const [phase, setPhase] = useState("intro");
  // Visual FX states
  const [bossAnim, setBossAnim] = useState("idle"); // idle | recoil | lunge | defeat
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null); // null | "red" | "green"
  const [sparks, setSparks] = useState([]);
  const [rings, setRings] = useState([]);
  const [taunt, setTaunt] = useState(null);
  const [showSlash, setShowSlash] = useState(false);

  const saber = getSaber(profile.lightsaberColor);
  const inp = useRef(null);
  const timerRef = useRef(null);
  const timers = useRef([]);
  const bw = useMemo(() => [...words].sort(() => Math.random() - 0.5).slice(0, boss.hp), [words, boss.hp]);
  const cw = bw[round];
  const sn = useMemo(() => (cw ? sent(cw) : { masked: "", full: "" }), [cw]);

  // Rage: 0 (full hp) → 1 (dead)
  const rage = 1 - hp / boss.hp;
  const bossSize = 60 + rage * 28;
  const bgRed = Math.round(rage * 40);

  const after = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  useEffect(() => () => { timers.current.forEach(clearTimeout); if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const triggerSparks = (count = 14, color = saber.c) => {
    const s = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, angle: (i / count) * 360 + Math.random() * 30,
      dist: 25 + Math.random() * 55, size: 3 + Math.random() * 5, dur: 0.3 + Math.random() * 0.3, color,
    }));
    setSparks(s);
    after(() => setSparks([]), 800);
  };

  const triggerRings = (count = 3, color = saber.c) => {
    const r = Array.from({ length: count }, (_, i) => ({ id: Date.now() + i, delay: i * 0.12, color }));
    setRings(r);
    after(() => setRings([]), 1500);
  };

  const doFlash = (color, ms = 500) => { setFlash(color); after(() => setFlash(null), ms); };
  const doShake = (ms = 400) => { setShake(true); after(() => setShake(false), ms); };
  const bd = BOSS_DIALOGUE[pi] || BOSS_DIALOGUE[0];
  const doTaunt = () => { const t = bd.taunts[Math.floor(Math.random() * bd.taunts.length)]; setTaunt(t); after(() => setTaunt(null), 2200); };
  const doHitReact = () => { const t = bd.hitReactions[Math.floor(Math.random() * bd.hitReactions.length)]; setTaunt(t); after(() => setTaunt(null), 2000); };

  // Phase: intro
  useEffect(() => {
    if (phase === "intro") {
      sfx("boss"); sfx("lightning");
      timerRef.current = after(() => setPhase("fight"), 3000);
    }
  }, [phase]);

  // Phase: fight — say word
  useEffect(() => {
    if (phase === "fight" && cw) {
      timerRef.current = after(() => { say(cw); inp.current?.focus(); }, 400);
    }
  }, [round, phase, cw]);

  const submit = () => {
    if (!typed.trim() || result || phase !== "fight") return;
    if (typed.trim().toLowerCase() === cw.toLowerCase()) {
      // ── CORRECT HIT ──
      setResult("ok"); sfx("ok"); setShowSlash(true);
      setBossAnim("recoil"); doFlash("green"); triggerSparks(16); triggerRings(3); doHitReact();
      const nh = hp - 1; setHp(nh);
      logSpellingAttempt(profile.username, cw, true, { level: profile.level, isBossBattle: true });
      after(() => { setBossAnim("idle"); setShowSlash(false); }, 600);
      timerRef.current = after(() => {
        if (nh <= 0) {
          sfx("explode"); sfx("win");
          setBossAnim("defeat"); triggerSparks(24, "#FFE066"); triggerRings(4, "#FFE066"); doFlash("white", 800);
          after(() => setPhase("win"), 1500);
        } else {
          setRound((r) => r + 1); setTyped(""); setResult(null);
        }
      }, 1200);
    } else {
      // ── MISS — BOSS ATTACKS ──
      setResult("no"); sfx("attack"); setSk((k) => k + 1);
      setBossAnim("lunge"); doShake(500); doFlash("red", 600); doTaunt();
      const nf = force - 1; setForce(nf);
      logSpellingAttempt(profile.username, cw, false, { level: profile.level, isBossBattle: true });
      after(() => setBossAnim("idle"), 700);
      if (nf <= 0) timerRef.current = after(() => setPhase("lose"), 1200);
      else timerRef.current = after(() => { setTyped(""); setResult(null); inp.current?.focus(); }, 1800);
    }
  };

  // ── Spark + Ring renderers ──
  const sparkEls = sparks.map((s) => {
    const rad = (s.angle * Math.PI) / 180;
    return <div key={s.id} style={{ position: "absolute", left: `calc(50% + ${Math.cos(rad) * s.dist}px)`, top: `calc(28% + ${Math.sin(rad) * s.dist}px)`, width: s.size, height: s.size, borderRadius: "50%", background: s.color, boxShadow: `0 0 ${s.size * 2}px ${s.color}`, animation: `sparkBurst ${s.dur}s ease-out forwards`, pointerEvents: "none", zIndex: 115 }} />;
  });
  const ringEls = rings.map((r) => (
    <div key={r.id} style={{ position: "absolute", left: "50%", top: "28%", transform: "translate(-50%,-50%)", width: 60, height: 60, borderRadius: "50%", border: `3px solid ${r.color}`, boxShadow: `0 0 15px ${r.color}`, animation: `explosionRing .7s ${r.delay}s ease-out forwards`, opacity: 0, pointerEvents: "none", zIndex: 114 }} />
  ));

  // ── Boss animation style ──
  const bossAnimStyle = bossAnim === "recoil"
    ? { animation: "bossRecoil .6s ease-out" }
    : bossAnim === "lunge"
    ? { animation: "bossLunge .7s ease-out" }
    : bossAnim === "defeat"
    ? { animation: "bossDefeatSpin 1.2s ease-in forwards" }
    : { animation: `bossPulse ${2 - rage}s ease-in-out infinite` };

  // ── INTRO ──
  if (phase === "intro") return (
    <div style={{ position: "fixed", inset: 0, background: "#05050F", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Stars n={40} />
      <Nebula color="#EE4444" opacity={0.1} />
      {/* Lightning bolts */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${15 + Math.random() * 70}%`, top: 0, width: 2, height: `${30 + Math.random() * 40}%`, background: "linear-gradient(to bottom, #8888FF, #FFFFFF, #8888FF, transparent)", opacity: 0, animation: `lightningFlicker ${0.8 + Math.random() * 1.2}s ${Math.random() * 2}s infinite`, filter: "blur(1px)", zIndex: 5 }} />
      ))}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", animation: "bossEntrance 1.2s" }}>
        <div style={{ fontSize: 90, marginBottom: 16, filter: `drop-shadow(0 0 30px ${planet.c}) drop-shadow(0 0 60px #EE444444)` }}>{boss.icon}</div>
        <div style={{ fontSize: 10, color: "#EE666688", letterSpacing: 4 }}>SITH LORD</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#EE4444", letterSpacing: 4, margin: "8px 0", textShadow: "0 0 30px #EE444466, 0 0 60px #EE444422" }}>{boss.name.toUpperCase()}</h1>
        <p style={{ fontSize: 15, color: "#EE666688", fontStyle: "italic", maxWidth: 320, margin: "0 auto" }}>"{boss.q}"</p>
        <div style={{ marginTop: 24, fontSize: 13, color: "#AAA", letterSpacing: 1 }}>Spell <b style={{ color: "#FFE066" }}>{boss.hp}</b> words to defeat them!</div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>You have <b style={{ color: saber.c }}>5 Force</b> — each miss drains one!</div>
      </div>
    </div>
  );

  // ── WIN ──
  if (phase === "win") return (
    <div style={{ position: "fixed", inset: 0, background: "#05050F", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Stars n={100} />
      <Nebula color="#FFE066" opacity={0.08} />
      <ForceParticles count={30} color="#FFE066" />
      {/* Explosion rings */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "35%", transform: "translate(-50%,-50%)", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${saber.c}`, animation: `explosionRing 1s ${i * 0.2}s ease-out forwards`, opacity: 0, pointerEvents: "none" }} />
      ))}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: "planetFloat 2s infinite", filter: "drop-shadow(0 0 20px #FFE066)" }}>✦</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#FFE066", letterSpacing: 4, textShadow: "0 0 30px #FFE06644, 0 0 60px #FFE06622" }}>{boss.name.toUpperCase()}</h1>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#44CC44", letterSpacing: 3, margin: "4px 0", textShadow: "0 0 20px #44CC4444" }}>DEFEATED!</h2>
        <p style={{ fontSize: 13, color: "#EE666688", fontStyle: "italic", marginTop: 10, maxWidth: 320 }}>"{bd.defeatQuote}"</p>
        <p style={{ fontSize: 16, color: planet.c, marginTop: 12 }}>{planet.name} is free!</p>
        <button onClick={onWin} style={{ marginTop: 28, padding: "14px 36px", fontSize: 15, fontWeight: 700, letterSpacing: 3, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ CONTINUE</button>
      </div>
    </div>
  );

  // ── LOSE ──
  if (phase === "lose") return (
    <div style={{ position: "fixed", inset: 0, background: "#05050F", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Stars n={30} />
      <Nebula color="#EE4444" opacity={0.15} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 16, filter: "drop-shadow(0 0 30px #EE444466)", animation: "bossPulse 1.5s infinite" }}>{boss.icon}</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#EE4444", letterSpacing: 4, textShadow: "0 0 30px #EE444444, 0 0 60px #EE444422" }}>THE DARK SIDE PREVAILS</h1>
        <p style={{ fontSize: 14, color: "#AA6666", marginTop: 10 }}>"{boss.q}"</p>
        <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>Boss HP remaining: {hp}/{boss.hp}</p>
        <button onClick={onLose} style={{ marginTop: 24, padding: "12px 32px", fontSize: 14, fontWeight: 700, letterSpacing: 2, background: "#EE444422", border: "1px solid #EE444466", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>RETURN TO GALAXY MAP</button>
      </div>
    </div>
  );

  // ── FIGHT ──
  const dangerLow = force <= 2;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden",
      background: `radial-gradient(ellipse at 50% 30%, #${(bgRed).toString(16).padStart(2,"0")}0808 0%, #05050F 70%)`,
      animation: shake ? "screenShake .4s ease-out" : "none",
      border: dangerLow ? "2px solid #EE444444" : "none",
    }}>
      <Stars n={30} />
      <Nebula color={rage > 0.5 ? "#EE4444" : planet.c} opacity={0.05 + rage * 0.08} />
      {rage > 0.6 && <ForceParticles count={10} color="#EE444488" />}

      {/* Screen flash overlay */}
      {flash && <div style={{ position: "absolute", inset: 0, zIndex: 120, pointerEvents: "none", background: flash === "red" ? "#EE0000" : flash === "green" ? "#00EE00" : "#FFFFFF", animation: "flashOverlay .5s forwards" }} />}

      {/* Saber slash */}
      {showSlash && <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 220, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${saber.c}, ${saber.c}, transparent)`, boxShadow: `0 0 25px ${saber.c}, 0 0 50px ${saber.g}`, animation: "saberSlash .5s forwards", zIndex: 116, pointerEvents: "none" }} />}

      {/* Sparks + Rings */}
      {sparkEls}
      {ringEls}

      {/* Boss taunt */}
      {taunt && <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", zIndex: 115, background: "#1a0a0aEE", border: "1px solid #EE444466", borderRadius: 10, padding: "8px 18px", maxWidth: 300, textAlign: "center", animation: "tauntAppear 2s forwards", pointerEvents: "none" }}><div style={{ fontSize: 12, color: "#EE6666", fontWeight: 700, fontStyle: "italic" }}>"{taunt}"</div></div>}

      {/* HUD */}
      <div style={{ position: "relative", zIndex: 10, padding: "12px 16px", borderBottom: "1px solid #2a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: "#EE6666", fontWeight: 700, letterSpacing: 1 }}>{boss.icon} {boss.name.toUpperCase()}</div>
          <div style={{ fontSize: 12, color: "#888" }}>Round {round + 1}/{boss.hp}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#EE6666", fontFamily: "monospace" }}>BOSS</span>
          <div style={{ flex: 1, height: 14, background: "#1a1a1a", borderRadius: 7, border: "1px solid #441111", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(hp / boss.hp) * 100}%`, borderRadius: 6, background: `linear-gradient(90deg,#EE444488,#EE4444)`, boxShadow: `0 0 ${8 + rage * 12}px #EE444466`, transition: "width .5s" }} />
          </div>
          <span style={{ fontSize: 11, color: "#AA6666", fontFamily: "monospace" }}>{hp}/{boss.hp}</span>
        </div>
        <ForceMeter cur={force} max={5} saberIdx={profile.lightsaberColor} />
        {dangerLow && <div style={{ fontSize: 10, color: "#EE4444", letterSpacing: 1, marginTop: 4, animation: "planetPulse 1s infinite", textAlign: "center" }}>⚠ FORCE CRITICALLY LOW ⚠</div>}
      </div>

      {/* Arena */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 20px", position: "relative", zIndex: 10 }}>
        {/* Boss with dynamic sizing + animation */}
        <div style={{ fontSize: bossSize, marginBottom: 12, filter: `drop-shadow(0 0 ${10 + rage * 20}px #EE4444${Math.round(50 + rage * 100).toString(16).padStart(2,"0")})`, transition: "font-size .3s, filter .3s", ...bossAnimStyle }}>{boss.icon}</div>

        <div style={{ fontSize: 15, color: "#AABB", textAlign: "center", maxWidth: 400, lineHeight: 1.6, marginBottom: 12 }}>{result === "ok" ? sn.full : sn.masked}</div>
        <button onClick={() => say(cw)} style={{ marginBottom: 10, padding: "5px 14px", fontSize: 12, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
        <div key={sk} style={{ marginBottom: 8, animation: result === "no" ? "headShake .5s" : "none" }}>
          <WordTiles typed={typed} word={cw} result={result} saber={saber} />
        </div>
        {result && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 8, color: result === "ok" ? "#44CC44" : "#EE4444", animation: "fadeSlideUp .3s" }}>{result === "ok" ? "✦ DIRECT HIT!" : "MISS!"}</div>}
        <input ref={inp} type="text" value={typed} onChange={(e) => { if (!result) setTyped(e.target.value.toLowerCase()); }} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
        <Keyboard onKey={(k) => { if (!result) { setTyped((t) => t + k); inp.current?.focus(); } }} onDel={() => { if (!result) setTyped((t) => t.slice(0, -1)); }} onSubmit={submit} typed={typed.trim()} result={result} saber={saber} />
      </div>
    </div>
  );
};

export default BossBattle;
