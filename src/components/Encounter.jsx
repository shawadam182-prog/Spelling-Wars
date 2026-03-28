import { useState, useEffect, useMemo, useRef } from "react";
import { PLANET_NARRATIVE } from "../data/narratives.js";
import { sfx, say } from "../utils/audio.js";
import { getSaber, sent, calcScore } from "../utils/helpers.js";
import { logSpellingAttempt } from "../services/supabase.js";
import ForceParticles from "./ForceParticles";
import WordTiles from "./WordTiles";
import Keyboard from "./Keyboard";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

const Encounter = ({ word, planet, pi, profile, combo = 0, force = 5, onResult, onForceUse }) => {
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [sk, setSk] = useState(0);
  const [showSlash, setShowSlash] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealed, setRevealed] = useState(new Set());
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

  // Build display chars: revealed positions from correct word, rest from typed
  const displayChars = useMemo(() => {
    const arr = new Array(word.length).fill("");
    for (const i of revealed) arr[i] = word[i].toLowerCase();
    let ti = 0;
    for (let i = 0; i < arr.length; i++) {
      if (!revealed.has(i) && ti < typed.length) {
        arr[i] = typed[ti];
        ti++;
      }
    }
    return arr;
  }, [word, revealed, typed]);

  const maxTypeable = word.length - revealed.size;

  useEffect(() => {
    setTyped("");
    setResult(null);
    setShowSlash(false);
    setPlayerAnim("idle");
    setEnemyAnim("idle");
    setHintsUsed(0);
    setRevealed(new Set());
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

  const useHint = () => {
    if (result) return;
    if (hintsUsed === 0) {
      // Hint 1: reveal first letter (costs 1 Force)
      if (force < 1) return;
      onForceUse?.(1);
      setRevealed(new Set([0]));
      setHintsUsed(1);
      sfx("pip");
    } else if (hintsUsed === 1) {
      // Hint 2: reveal all vowels (costs 1 Force)
      if (force < 1) return;
      onForceUse?.(1);
      const newRev = new Set(revealed);
      for (let i = 0; i < word.length; i++) {
        if (VOWELS.has(word[i].toLowerCase())) newRev.add(i);
      }
      setRevealed(newRev);
      setHintsUsed(2);
      sfx("pip");
    }
  };

  const submit = () => {
    const attempt = displayChars.join("");
    if (!attempt.trim() || result) return;
    const hinted = hintsUsed > 0;
    if (attempt === word.toLowerCase()) {
      setResult("ok"); sfx("ok"); setShowSlash(true);
      setPlayerAnim("attack");
      after(() => { setEnemyAnim("recoil"); triggerSparks(12); setFlash("green"); }, 200);
      after(() => setFlash(null), 600);
      after(() => { setPlayerAnim("idle"); setEnemyAnim("idle"); }, 800);
      logSpellingAttempt(profile.username, word, true, { level: profile.level, hinted });
      timerRef.current = after(() => onResult(true, hinted), 1400);
    } else {
      setResult("no"); sfx("no"); setSk((k) => k + 1);
      setEnemyAnim("lunge");
      after(() => { setShake(true); setFlash("red"); setPlayerAnim("hit"); }, 200);
      after(() => { setShake(false); setFlash(null); }, 700);
      after(() => { setEnemyAnim("idle"); setPlayerAnim("idle"); }, 800);
      logSpellingAttempt(profile.username, word, false, { level: profile.level, hinted });
      timerRef.current = after(() => onResult(false, hinted), 1800);
    }
  };

  const handleKey = (k) => {
    if (result) return;
    if (typed.length < maxTypeable) setTyped((t) => t + k);
    inp.current?.focus();
  };

  const handleDel = () => {
    if (result) return;
    setTyped((t) => t.slice(0, -1));
  };

  const handleInput = (e) => {
    if (result) return;
    const v = e.target.value.toLowerCase();
    // Only allow up to maxTypeable characters
    setTyped(v.slice(0, maxTypeable));
  };

  // Spark elements
  const sparkEls = sparks.map((s) => {
    const rad = (s.angle * Math.PI) / 180;
    return <div key={s.id} style={{ position: "absolute", left: `calc(50% + ${Math.cos(rad) * s.dist}px)`, top: `calc(18% + ${Math.sin(rad) * s.dist}px)`, width: s.size, height: s.size, borderRadius: "50%", background: saber.c, boxShadow: `0 0 ${s.size * 2}px ${saber.c}`, animation: `sparkBurst ${s.dur}s ease-out forwards`, pointerEvents: "none", zIndex: 115 }} />;
  });

  const playerStyle = playerAnim === "attack"
    ? { transform: "translateX(20px) scaleX(-1)", transition: "transform .2s" }
    : playerAnim === "hit"
    ? { transform: "translateX(-10px) scaleX(-1)", filter: "brightness(2)", transition: "transform .15s" }
    : { transform: "scaleX(-1)", transition: "transform .3s" };

  const enemyStyle = enemyAnim === "recoil"
    ? { animation: "bossRecoil .6s ease-out" }
    : enemyAnim === "lunge"
    ? { animation: "bossLunge .7s ease-out" }
    : {};

  // Hint button label
  const hintLabel = hintsUsed === 0 ? "💡 FIRST LETTER (-1⚡)" : hintsUsed === 1 ? "💡 VOWELS (-1⚡)" : null;
  const canHint = !result && hintsUsed < 2 && force >= 1;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 40%, #0a0a2a, #05050FEE)",
      zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: shake ? "screenShake .4s ease-out" : "encounterAppear .4s ease-out",
      overflow: "hidden",
    }}>
      <ForceParticles count={combo >= 3 ? 16 : 6} color={saber.c + (combo >= 3 ? "88" : "44")} />

      {/* Combo indicator */}
      {combo >= 2 && <div style={{ position: "absolute", top: 12, right: 14, zIndex: 115, fontSize: 14, fontWeight: 800, color: "#FFE066", animation: "planetPulse 1s infinite" }}>🔥 {combo}x COMBO</div>}

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
        <div style={{ textAlign: "center", ...playerStyle }}>
          <div style={{ fontSize: 48, filter: `drop-shadow(0 0 8px ${saber.c})` }}>🥷</div>
        </div>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${saber.c}, transparent)`, boxShadow: `0 0 10px ${saber.g}`, opacity: result === "ok" ? 1 : 0.3, transition: "opacity .3s" }} />
        <div style={{ fontSize: 12, fontWeight: 900, color: "#EE666666", letterSpacing: 2 }}>VS</div>
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

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button onClick={() => say(word)} style={{ padding: "5px 14px", fontSize: 11, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
        {hintLabel && (
          <button onClick={useHint} disabled={!canHint} style={{ padding: "5px 14px", fontSize: 11, background: canHint ? "#FFE06615" : "#111", border: `1px solid ${canHint ? "#FFE06644" : "#222"}`, borderRadius: 6, color: canHint ? "#FFE066" : "#444", cursor: canHint ? "pointer" : "default" }}>{hintLabel}</button>
        )}
      </div>
      {hintsUsed > 0 && !result && <div style={{ fontSize: 9, color: "#8888AA", marginBottom: 4 }}>Hints: {hintsUsed}/2 — score halved</div>}

      {/* Wordle-style letter tiles */}
      <div key={sk} style={{ marginBottom: 6, animation: result === "no" ? "headShake .5s" : "none" }}>
        <WordTiles typed={displayChars.join("")} word={word} result={result} saber={saber} revealed={revealed} />
      </div>

      {result === "ok" && (() => {
        const sc = calcScore(word, combo);
        const pts = hintsUsed > 0 ? Math.floor(sc.total / 2) : sc.total;
        return (
          <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeSlideUp .3s" }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#44CC44" }}>✦ CORRECT! +{pts}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
              {sc.base} base + {sc.lengthBonus} length{sc.comboBonus > 0 ? ` + ${sc.comboBonus} combo` : ""}{hintsUsed > 0 ? " (×0.5 hint)" : ""}
            </div>
            {sc.newCombo >= 2 && <div style={{ fontSize: 14, fontWeight: 800, color: "#FFE066", marginTop: 4, animation: "planetPulse 1s infinite" }}>🔥 {sc.newCombo}x COMBO!</div>}
            {sc.newCombo >= 5 && <div style={{ fontSize: 10, color: "#44CC44", marginTop: 2 }}>+1 Force restored!</div>}
          </div>
        );
      })()}
      {result === "no" && (
        <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeSlideUp .3s" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#EE4444" }}>✗ WRONG!</div>
          <div style={{ fontSize: 11, color: "#AA666688", marginTop: 2 }}>-1 Force</div>
          {combo > 0 && <div style={{ fontSize: 10, color: "#AA6666", marginTop: 2 }}>Combo lost!</div>}
        </div>
      )}

      <input ref={inp} type="text" value={typed} onChange={handleInput} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
      <Keyboard onKey={handleKey} onDel={handleDel} onSubmit={submit} typed={displayChars.join("").trim()} result={result} saber={saber} />
    </div>
  );
};

export default Encounter;
