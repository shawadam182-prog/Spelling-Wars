import { useState, useEffect, useMemo, useRef } from "react";
import { PLANET_NARRATIVE } from "../data/narratives.js";
import { sfx, say, sfxComboOk } from "../utils/audio.js";
import { getSaber, sent, calcScore, saberBonus } from "../utils/helpers.js";
import { logSpellingAttempt } from "../services/supabase.js";
import ForceParticles from "./ForceParticles";
import WordTiles from "./WordTiles";
import Keyboard from "./Keyboard";
import HoloPanel from "./HoloPanel";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// Shuffle helper (Fisher-Yates)
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const Encounter = ({ word, planet, pi, profile, combo = 0, force = 5, enemyHp = 1, onResult, onForceUse }) => {
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [sk, setSk] = useState(0);
  const [showSlash, setShowSlash] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealed, setRevealed] = useState(new Set());
  // Encounter mode: classic (50%), scramble (25%), audio (25%)
  const [mode, setMode] = useState("classic");
  // Scramble mode state
  const [scrambled, setScrambled] = useState([]); // [{char, id}]
  const [selected, setSelected] = useState([]); // indices into scrambled
  // Duel visual states
  const [playerAnim, setPlayerAnim] = useState("idle");
  const [enemyAnim, setEnemyAnim] = useState("idle");
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null);
  const [sparks, setSparks] = useState([]);
  const [inputFocused, setInputFocused] = useState(true);
  const [saberFlash, setSaberFlash] = useState(null);
  // Attempt tracking: max 3 per word
  const [attempt, setAttempt] = useState(1);
  const [hp, setHp] = useState(enemyHp);
  // Timer for speed bonus
  const startTime = useRef(Date.now());
  const [elapsedTime, setElapsedTime] = useState(null);

  const sn = useMemo(() => sent(word), [word]);
  const saber = getSaber(profile.lightsaberColor);
  const bonus = saberBonus(profile.lightsaberColor);
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
    setAttempt(1);
    setHp(enemyHp);
    startTime.current = Date.now();
    // Pick encounter mode: 50% classic, 25% scramble, 25% audio
    const r = Math.random();
    const m = r < 0.5 ? "classic" : r < 0.75 ? "scramble" : "audio";
    setMode(m);
    // Set up scramble tiles
    if (m === "scramble") {
      const tiles = word.toLowerCase().split("").map((ch, i) => ({ char: ch, id: i }));
      setScrambled(shuffle(tiles));
      setSelected([]);
    }
    const t = setTimeout(() => { say(word); if (m !== "scramble") refocusInput(); }, 300);
    return () => clearTimeout(t);
  }, [word]);

  // Aggressive focus management: refocus on every state change
  const refocusInput = () => { setTimeout(() => inp.current?.focus(), 10); };
  useEffect(() => { if (mode !== "scramble" && !result) refocusInput(); }, [result, mode]);
  // Refocus when window regains focus
  useEffect(() => {
    const onFocus = () => { if (mode !== "scramble") refocusInput(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [mode]);

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
    const hintCost = bonus.hintDiscount ? 0 : 1; // Purple saber: hints free
    if (hintsUsed === 0) {
      if (force < hintCost) return;
      if (hintCost > 0) onForceUse?.(hintCost);
      setRevealed(new Set([0]));
      setHintsUsed(1);
      sfx("pip");
      if (bonus.hintDiscount) { setSaberFlash("FREE HINT! (Purple Saber)"); after(() => setSaberFlash(null), 1500); }
    } else if (hintsUsed === 1) {
      if (force < hintCost) return;
      if (hintCost > 0) onForceUse?.(hintCost);
      const newRev = new Set(revealed);
      for (let i = 0; i < word.length; i++) {
        if (VOWELS.has(word[i].toLowerCase())) newRev.add(i);
      }
      setRevealed(newRev);
      setHintsUsed(2);
      sfx("pip");
      if (bonus.hintDiscount) { setSaberFlash("FREE HINT! (Purple Saber)"); after(() => setSaberFlash(null), 1500); }
    }
  };

  // ── INPUT HANDLERS ──
  const handleInput = (e) => {
    if (result) return;
    const val = e.target.value.toLowerCase().replace(/[^a-z]/g, "");
    if (val.length <= maxTypeable) {
      setTyped(val);
      sfx("key");
    }
  };

  const handleKey = (ch) => {
    if (result || typed.length >= maxTypeable) return;
    setTyped((t) => t + ch.toLowerCase());
    sfx("key");
    refocusInput();
  };

  const handleDel = () => {
    if (result) return;
    setTyped((t) => t.slice(0, -1));
    refocusInput();
  };

  const submit = () => {
    // Build guess string based on mode
    const guess = mode === "scramble"
      ? selected.map((i) => scrambled[i].char).join("")
      : displayChars.join("");
    if (!guess.trim() || result) return;
    const hinted = hintsUsed > 0;
    const isAudio = mode === "audio";
    const attemptNum = attempt; // capture current attempt number
    if (guess === word.toLowerCase()) {
      setResult("ok"); sfxComboOk(combo); setShowSlash(true);
      setPlayerAnim("attack");
      after(() => { setEnemyAnim("recoil"); triggerSparks(12); setFlash("green"); }, 200);
      after(() => setFlash(null), 600);
      after(() => { setPlayerAnim("idle"); setEnemyAnim("idle"); }, 800);
      logSpellingAttempt(profile.username, word, true, { level: profile.level, hinted, mode });
      const newHp = hp - 1;
      setHp(newHp);
      if (newHp > 0) {
        // Elite enemy: need another word hit
        timerRef.current = after(() => {
          setResult(null); setTyped(""); setShowSlash(false);
          startTime.current = Date.now();
          say(word); refocusInput();
        }, 1400);
      } else {
        const elapsed = (Date.now() - startTime.current) / 1000;
        setElapsedTime(elapsed);
        timerRef.current = after(() => { onResult(true, hinted, isAudio, elapsed); refocusInput(); }, 1400);
      }
    } else {
      setSk((k) => k + 1);
      setEnemyAnim("lunge");
      after(() => { setShake(true); setFlash("red"); setPlayerAnim("hit"); }, 200);
      after(() => { setShake(false); setFlash(null); }, 700);
      after(() => { setEnemyAnim("idle"); setPlayerAnim("idle"); }, 800);
      logSpellingAttempt(profile.username, word, false, { level: profile.level, hinted, mode });

      if (attemptNum >= 3) {
        // 3rd failed attempt: reveal word, clear enemy with 0 points
        setResult("reveal");
        sfx("no");
        onForceUse?.(1);
        timerRef.current = after(() => { onResult(true, true, isAudio, 999, true); refocusInput(); }, 2500);
      } else {
        // Still have attempts left
        setResult("no"); sfx("no");
        onForceUse?.(1);
        timerRef.current = after(() => {
          setResult(null); setTyped(""); setSelected([]);
          const nextAttempt = attemptNum + 1;
          setAttempt(nextAttempt);
          // Progressive hints
          if (nextAttempt === 2) {
            // 2nd attempt: reveal first letter free
            setRevealed(new Set([0]));
          } else if (nextAttempt === 3) {
            // 3rd attempt: reveal vowels
            const newRev = new Set([0]);
            for (let i = 0; i < word.length; i++) {
              if (VOWELS.has(word[i].toLowerCase())) newRev.add(i);
            }
            setRevealed(newRev);
          }
          say(word); refocusInput();
        }, 1800);
      }
    }
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
  const hintCostLabel = bonus.hintDiscount ? "FREE" : "-1⚡";
  const hintLabel = hintsUsed === 0 ? `💡 FIRST LETTER (${hintCostLabel})` : hintsUsed === 1 ? `💡 VOWELS (${hintCostLabel})` : null;
  const canHint = !result && hintsUsed < 2 && (bonus.hintDiscount || force >= 1);

  return (
    <div onClick={() => { if (mode !== "scramble") refocusInput(); }} style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 50% 40%, #0a0a2a, #05050FEE)",
      zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: shake ? "screenShake .4s ease-out" : "encounterAppear .4s ease-out",
      overflow: "hidden",
    }}>
      <ForceParticles count={combo >= 3 ? 16 : 6} color={saber.c + (combo >= 3 ? "88" : "44")} />

      {/* Combo indicator */}
      {combo >= 2 && <div style={{ position: "absolute", top: 12, right: 14, zIndex: 115, fontSize: 14, fontWeight: 800, color: "#FFE066", animation: "planetPulse 1s infinite" }}>🔥 {combo}x COMBO</div>}

      {/* Attempt counter */}
      {attempt > 1 && !result && <div style={{ position: "absolute", top: 12, left: 14, zIndex: 115, fontSize: 11, fontWeight: 700, color: "#EE6666", letterSpacing: 1 }}>ATTEMPT {attempt}/3</div>}

      {/* 30-second timer bar — key resets animation on each attempt */}
      {!result && <div key={`timer-${attempt}`} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 115 }}>
        <div style={{ height: "100%", background: `linear-gradient(90deg, ${saber.c}, #FFE066)`, animation: "timerDrain 30s linear forwards", transformOrigin: "left" }} />
      </div>}

      {/* Screen flash overlay */}
      {flash && <div style={{ position: "absolute", inset: 0, zIndex: 120, pointerEvents: "none", background: flash === "red" ? "#EE0000" : "#00EE00", animation: "flashOverlay .5s forwards" }} />}

      {/* Saber slash effect */}
      {showSlash && (
        <div style={{ position: "absolute", top: "16%", left: "50%", transform: "translateX(-50%)", width: 220, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${saber.c}, ${saber.c}, transparent)`, boxShadow: `0 0 25px ${saber.c}, 0 0 50px ${saber.g}`, animation: "saberSlash .5s forwards", zIndex: 116, pointerEvents: "none" }} />
      )}

      {/* Spark particles */}
      {sparkEls}

      {/* ── ENEMY INFO PANEL ── */}
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px", marginBottom: 6 }}>
        <HoloPanel color="#EE4444" intensity="subtle" style={{ padding: "6px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 13, color: planet.c, fontWeight: 700, letterSpacing: 1 }}>{enEmoji.current} {enRef.current}</div>
            <div style={{ fontSize: 11, color: "#AA6666", fontFamily: "monospace" }}>{hp}/{enemyHp} HP</div>
          </div>
          <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(hp / enemyHp) * 100}%`, borderRadius: 3, background: "linear-gradient(90deg, #EE444488, #EE4444)", transition: "width .3s" }} />
          </div>
          {narrativeIntro && <div style={{ fontSize: 10, color: "#6666AA", fontStyle: "italic", marginTop: 4, lineHeight: 1.4 }}>{narrativeIntro}</div>}
        </HoloPanel>
      </div>

      {/* Saber bonus flash */}
      {saberFlash && <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)", zIndex: 115, padding: "6px 16px", borderRadius: 8, background: `${saber.c}22`, border: `1px solid ${saber.c}66`, color: saber.c, fontSize: 12, fontWeight: 700, letterSpacing: 1, animation: "fadeSlideUp .3s", pointerEvents: "none", whiteSpace: "nowrap" }}>{saberFlash}</div>}

      {/* ── DUEL SCENE ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 6, position: "relative" }}>
        <div style={{ textAlign: "center", ...playerStyle }}>
          <div style={{ fontSize: 48, filter: `drop-shadow(0 0 8px ${saber.c})` }}>🥷</div>
        </div>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${saber.c}, transparent)`, boxShadow: `0 0 10px ${saber.g}`, opacity: result === "ok" ? 1 : 0.3, transition: "opacity .3s" }} />
        <div style={{ fontSize: 12, fontWeight: 900, color: "#EE666666", letterSpacing: 2 }}>VS</div>
        <div style={{ textAlign: "center", ...enemyStyle }}>
          <div style={{ fontSize: enemyHp > 1 ? 56 : 52, filter: `drop-shadow(0 0 ${enemyHp > 1 ? 12 : 8}px ${planet.c})` }}>{enEmoji.current}</div>
        </div>
      </div>

      {/* ── PLAYER INFO ── */}
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px", marginBottom: 6 }}>
        <HoloPanel color={saber.c} intensity="subtle" style={{ padding: "6px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, color: saber.c, fontWeight: 700 }}>🥷 {profile.username?.toUpperCase() || "JEDI"}</div>
            <div style={{ fontSize: 11, color: saber.c, fontFamily: "monospace" }}>{force}⚡</div>
          </div>
        </HoloPanel>
      </div>

      {/* Sentence — hidden in audio mode, unmasked in scramble */}
      {mode === "audio" && !result && (
        <div style={{ fontSize: 14, color: "#4A9EEA", textAlign: "center", marginBottom: 10, fontStyle: "italic" }}>🔊 Listen carefully and spell the word!</div>
      )}
      {mode === "audio" && result && (
        <div style={{ fontSize: 14, color: "#AABB", textAlign: "center", maxWidth: 400, padding: "0 20px", lineHeight: 1.6, marginBottom: 10 }}>{sn.full}</div>
      )}
      {mode === "scramble" && (
        <div style={{ fontSize: 13, color: "#AABB", textAlign: "center", maxWidth: 400, padding: "0 20px", lineHeight: 1.5, marginBottom: 10 }}>{result === "ok" ? sn.full : sn.full}</div>
      )}
      {mode === "classic" && (
        <div style={{ fontSize: 14, color: "#AABB", textAlign: "center", maxWidth: 400, padding: "0 20px", lineHeight: 1.6, marginBottom: 10 }}>{result === "ok" ? sn.full : sn.masked}</div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button onClick={(e) => { say(word); e.currentTarget.style.background = "#4A9EEA44"; setTimeout(() => { if (e.target) e.target.style.background = "#4A9EEA15"; }, 300); refocusInput(); }} style={{ padding: "5px 14px", fontSize: 11, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
        {mode !== "scramble" && hintLabel && (
          <button onClick={() => { useHint(); refocusInput(); }} disabled={!canHint} style={{ padding: "5px 14px", fontSize: 11, background: canHint ? "#FFE06615" : "#111", border: `1px solid ${canHint ? "#FFE06644" : "#222"}`, borderRadius: 6, color: canHint ? "#FFE066" : "#444", cursor: canHint ? "pointer" : "default" }}>{hintLabel}</button>
        )}
      </div>
      {mode !== "scramble" && hintsUsed > 0 && !result && <div style={{ fontSize: 9, color: "#8888AA", marginBottom: 4 }}>Hints: {hintsUsed}/2 — score halved</div>}
      {mode === "audio" && !result && <div style={{ fontSize: 9, color: "#4A9EEA88", marginBottom: 4 }}>Audio mode: ×1.5 points!</div>}

      {/* ── SCRAMBLE MODE: tappable tiles ── */}
      {mode === "scramble" ? (
        <div style={{ marginBottom: 6 }}>
          {/* Answer row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 3, minHeight: 40, marginBottom: 8 }}>
            {word.split("").map((_, i) => {
              const ch = i < selected.length ? scrambled[selected[i]].char : "";
              return <div key={i} onClick={() => { if (ch && !result && i === selected.length - 1) setSelected((s) => s.slice(0, -1)); }} style={{ width: 34, height: 36, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: result === "ok" ? "#2a6a2a" : result === "no" && ch ? (ch === word[i].toLowerCase() ? "#2a6a2a" : "#4a1a1a") : "#1a1a2e", border: `1px solid ${result === "ok" ? "#44CC4466" : result === "no" && ch ? (ch === word[i].toLowerCase() ? "#44CC4466" : "#EE444466") : saber.c + "44"}`, cursor: ch && !result ? "pointer" : "default", transition: "background .2s" }}>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", color: result === "ok" ? "#44CC44" : result === "no" && ch ? (ch === word[i].toLowerCase() ? "#44CC44" : "#EE6666") : "#FFE066" }}>{ch}</span>
              </div>;
            })}
          </div>
          {/* Available tiles */}
          {!result && <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
            {scrambled.map((tile, i) => {
              const used = selected.includes(i);
              return <div key={tile.id} onClick={() => { if (!used && !result) { setSelected((s) => [...s, i]); sfx("pip"); } }} style={{ width: 38, height: 38, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: used ? "#0a0a1a" : `${saber.c}22`, border: `1px solid ${used ? "#222" : saber.c + "66"}`, cursor: used ? "default" : "pointer", opacity: used ? 0.3 : 1, transition: "all .15s", transform: used ? "scale(0.85)" : "scale(1)" }}>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", color: used ? "#444" : saber.c }}>{tile.char}</span>
              </div>;
            })}
          </div>}
          {/* Scramble submit */}
          {!result && selected.length === word.length && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button onClick={submit} style={{ padding: "8px 28px", fontSize: 13, fontWeight: 700, letterSpacing: 2, background: `${saber.c}22`, border: `1px solid ${saber.c}66`, borderRadius: 6, color: saber.c, cursor: "pointer" }}>SUBMIT</button>
            </div>
          )}
          {/* Show correct on wrong */}
          {result === "no" && (
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#AA666688", letterSpacing: 2, marginBottom: 4 }}>CORRECT SPELLING:</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
                {word.split("").map((ch, i) => <div key={i} style={{ width: 34, height: 36, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a3a1a", border: "1px solid #44CC4444" }}><span style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", color: "#44CC44" }}>{ch}</span></div>)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── CLASSIC / AUDIO MODE: keyboard tiles ── */
        <div key={sk} style={{ marginBottom: 6, animation: result === "no" ? "headShake .5s" : "none" }}>
          <WordTiles typed={displayChars.join("")} word={word} result={result} saber={saber} revealed={revealed} />
        </div>
      )}

      {result === "ok" && (() => {
        const sc = calcScore(word, combo, !!bonus.earlyCombo, elapsedTime);
        let pts = hintsUsed > 0 ? Math.floor(sc.total / 2) : sc.total;
        if (mode === "audio") pts = Math.floor(pts * 1.5);
        return (
          <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeSlideUp .3s" }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#44CC44" }}>✦ CORRECT! +{pts}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
              {sc.base} base + {sc.lengthBonus} length{sc.comboBonus > 0 ? ` + ${sc.comboBonus} combo` : ""}{sc.speedBonus > 0 ? ` + ${sc.speedBonus} speed` : ""}{hintsUsed > 0 ? " (×0.5 hint)" : ""}{mode === "audio" ? " (×1.5 audio)" : ""}
            </div>
            {elapsedTime != null && <div style={{ fontSize: 10, color: sc.speedBonus > 0 ? "#FFE066" : "#666", marginTop: 2 }}>{elapsedTime < 5 ? "⚡ LIGHTNING FAST!" : elapsedTime < 10 ? "⚡ Quick!" : elapsedTime < 15 ? "Good pace" : ""} {elapsedTime.toFixed(1)}s</div>}
            {sc.newCombo >= 2 && <div style={{ fontSize: 14, fontWeight: 800, color: "#FFE066", marginTop: 4, animation: "planetPulse 1s infinite" }}>🔥 {sc.newCombo}x COMBO!</div>}
            {sc.newCombo >= 5 && <div style={{ fontSize: 10, color: "#44CC44", marginTop: 2 }}>+1 Force restored!</div>}
            {sc.newCombo >= 10 && <div style={{ fontSize: 16, fontWeight: 900, color: "#FFE066", marginTop: 4, animation: "planetPulse .5s infinite", textShadow: "0 0 20px #FFE066" }}>⚡ FORCE SURGE! ⚡</div>}
          </div>
        );
      })()}

      {result === "no" && (
        <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeSlideUp .3s" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#EE4444" }}>✗ MISS! -1⚡</div>
          <div style={{ fontSize: 10, color: "#AA666688", marginTop: 2 }}>Try again... ({attempt}/3 attempts used)</div>
        </div>
      )}

      {result === "reveal" && (
        <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeSlideUp .3s" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#EE6644" }}>✗ OUT OF ATTEMPTS</div>
          <div style={{ fontSize: 10, color: "#AA666688", letterSpacing: 2, marginTop: 6, marginBottom: 4 }}>THE WORD WAS:</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
            {word.split("").map((ch, i) => <div key={i} style={{ width: 34, height: 36, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a3a1a", border: "1px solid #44CC4444" }}><span style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase", color: "#44CC44" }}>{ch}</span></div>)}
          </div>
          <div style={{ fontSize: 10, color: "#AA666688", marginTop: 4 }}>Enemy cleared • 0 points</div>
        </div>
      )}
      {/* (old duplicate removed) */}

      {/* Visible input + keyboard for classic/audio modes */}
      {mode !== "scramble" && <>
        <div style={{ width: "100%", maxWidth: 400, padding: "0 16px", marginBottom: 8 }}>
          <input ref={inp} type="text" value={typed} onChange={handleInput}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Type your answer..."
            style={{
              width: "100%", padding: "10px 16px", fontSize: 20, fontWeight: 700,
              fontFamily: "monospace", textTransform: "lowercase", letterSpacing: 2,
              background: "#0a0a1a", color: "#FFE066",
              border: `2px solid ${inputFocused ? saber.c : saber.c + "44"}`,
              borderRadius: 8, outline: "none",
              boxShadow: inputFocused ? `0 0 12px ${saber.g}` : "none",
              transition: "border-color .2s, box-shadow .2s",
            }}
            autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />
          {!inputFocused && !result && (
            <div onClick={refocusInput} style={{ textAlign: "center", marginTop: 4, fontSize: 10, color: "#556", cursor: "pointer", animation: "planetPulse 2s infinite" }}>
              Click here or press any key to type
            </div>
          )}
        </div>
        <Keyboard onKey={handleKey} onDel={handleDel} onSubmit={submit} typed={displayChars.join("").trim()} result={result} saber={saber} word={word} />
      </>}
    </div>
  );
};

export default Encounter;
