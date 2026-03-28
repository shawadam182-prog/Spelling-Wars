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
  const sn = useMemo(() => sent(word), [word]);
  const saber = getSaber(profile.lightsaberColor);
  const inp = useRef(null);
  const enIdx = useRef(Math.floor(Math.random() * planet.en.length));
  const enRef = useRef(planet.en[enIdx.current]);
  const narrativeIntro = PLANET_NARRATIVE[pi]?.encounterIntros[enIdx.current] || "";
  const timerRef = useRef(null);

  useEffect(() => {
    setTyped("");
    setResult(null);
    setShowSlash(false);
    const t = setTimeout(() => { say(word); inp.current?.focus(); }, 300);
    return () => clearTimeout(t);
  }, [word]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const submit = () => {
    if (!typed.trim() || result) return;
    if (typed.trim().toLowerCase() === word.toLowerCase()) {
      setResult("ok"); sfx("ok"); setShowSlash(true);
      logSpellingAttempt(profile.username, word, true, { level: profile.level });
      timerRef.current = setTimeout(() => onResult(true), 1200);
    } else {
      setResult("no"); sfx("no"); setSk((k) => k + 1);
      logSpellingAttempt(profile.username, word, false, { level: profile.level });
      timerRef.current = setTimeout(() => { setTyped(""); setResult(null); inp.current?.focus(); }, 1500);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #0a0a2a, #05050FEE)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "encounterAppear .4s ease-out" }}>
      <ForceParticles count={6} color={saber.c + "44"} />
      {showSlash && (
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 220, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${saber.c}, ${saber.c}, transparent)`, boxShadow: `0 0 25px ${saber.c}, 0 0 50px ${saber.g}`, animation: "saberSlash .5s forwards", zIndex: 110, pointerEvents: "none" }} />
      )}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#EE666688", letterSpacing: 2 }}>ENCOUNTER</div>
        <div style={{ fontSize: 14, color: planet.c, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{enRef.current}</div>
        {narrativeIntro && <div style={{ fontSize: 11, color: "#8888AA", fontStyle: "italic", marginTop: 6, maxWidth: 340, lineHeight: 1.5 }}>{narrativeIntro}</div>}
      </div>
      <div style={{ fontSize: 15, color: "#AABB", textAlign: "center", maxWidth: 400, padding: "0 20px", lineHeight: 1.6, marginBottom: 14 }}>{result === "ok" ? sn.full : sn.masked}</div>
      <button onClick={() => say(word)} style={{ marginBottom: 12, padding: "6px 16px", fontSize: 12, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
      <div key={sk} style={{ fontSize: 32, fontWeight: 800, letterSpacing: 6, textAlign: "center", color: result === "ok" ? "#44CC44" : result === "no" ? "#EE4444" : "#FFE066", fontFamily: "monospace", minHeight: 44, marginBottom: 8, animation: result === "no" ? "headShake .5s" : "none" }}>
        {typed || <span style={{ color: "#333", fontSize: 13, letterSpacing: 2 }}>TYPE THE WORD...</span>}
      </div>
      {result && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 10, color: result === "ok" ? "#44CC44" : "#EE4444", animation: "fadeSlideUp .3s" }}>{result === "ok" ? "✦ CORRECT! +100" : `THE WORD WAS: ${word.toUpperCase()}`}</div>}
      <input ref={inp} type="text" value={typed} onChange={(e) => { if (!result) setTyped(e.target.value.toLowerCase()); }} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
      <Keyboard onKey={(k) => { if (!result) { setTyped((t) => t + k); inp.current?.focus(); } }} onDel={() => { if (!result) setTyped((t) => t.slice(0, -1)); }} onSubmit={submit} typed={typed.trim()} result={result} saber={saber} />
    </div>
  );
};

export default Encounter;
