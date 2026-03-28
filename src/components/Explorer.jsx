import { useState, useEffect, useCallback, useRef } from "react";
import { PLANET_NARRATIVE } from "../data/narratives.js";
import { sfx, say } from "../utils/audio.js";
import { getSaber, GS, genMap } from "../utils/helpers.js";
import Stars from "./Stars";
import Nebula from "./Nebula";
import ForceParticles from "./ForceParticles";
import MuteBtn from "./MuteBtn";
import ForceMeter from "./ForceMeter";
import Keyboard from "./Keyboard";

const Explorer = ({ planet, pi, words, boss, profile, score, force, maxForce, combo = 0, defeated, onBattle, onBoss, onCollect, onForceUse, onExit }) => {
  const [pos, setPos] = useState({ x: 0, y: GS - 1 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [map, setMap] = useState(null);
  const [ents, setEnts] = useState([]);
  const [msg, setMsg] = useState(null);
  // Wall challenge state
  const [wallChallenge, setWallChallenge] = useState(null); // { x, y, word }
  const [wcTyped, setWcTyped] = useState("");
  const [wcResult, setWcResult] = useState(null);
  const saber = getSaber(profile.lightsaberColor);

  const [ts, setTs] = useState(Math.min(48, (window.innerWidth - 40) / GS));
  useEffect(() => {
    const onResize = () => setTs(Math.min(48, (window.innerWidth - 40) / GS));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const posRef = useRef(pos);
  const entsRef = useRef(ents);
  const msgTimerRef = useRef(null);
  const wcInpRef = useRef(null);
  posRef.current = pos;
  entsRef.current = ents;

  useEffect(() => {
    const d = genMap(pi, words);
    setMap(d);
    setEnts(d.entities);
    const sp = d.spawn || { x: 0, y: GS - 1 };
    setPos(sp);
    posRef.current = sp;
  }, [pi, words]);

  useEffect(() => {
    if (!map) return;
    setEnts((prev) => prev.filter((e) => !(e.type === "enemy" && defeated.includes(e.word))));
  }, [defeated, map]);

  const total = words.length;
  const def = defeated.length;
  const bossOk = def >= total;

  const showMsg = useCallback((text, duration = 800) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    setMsg(text);
    msgTimerRef.current = setTimeout(() => setMsg(null), duration);
  }, []);

  useEffect(() => () => { if (msgTimerRef.current) clearTimeout(msgTimerRef.current); }, []);

  // Wall challenge: pick a random word from the level
  const startWallChallenge = useCallback((x, y) => {
    const w = words[Math.floor(Math.random() * words.length)];
    setWallChallenge({ x, y, word: w });
    setWcTyped("");
    setWcResult(null);
    say(w);
    setTimeout(() => wcInpRef.current?.focus(), 100);
  }, [words]);

  const submitWallChallenge = useCallback(() => {
    if (!wallChallenge || wcResult) return;
    if (wcTyped.trim().toLowerCase() === wallChallenge.word.toLowerCase()) {
      setWcResult("ok");
      sfx("ok");
      // Destroy the wall
      setMap((m) => {
        const g = m.grid.map((r) => [...r]);
        g[wallChallenge.y][wallChallenge.x] = 0;
        return { ...m, grid: g };
      });
      onCollect?.("score", 50);
      setTimeout(() => { setWallChallenge(null); showMsg("⚔ Wall cut! +50 points", 1500); }, 800);
    } else {
      setWcResult("no");
      sfx("no");
      onForceUse?.(1);
      setTimeout(() => { setWallChallenge(null); showMsg("Wall holds! -1 Force", 1200); }, 1000);
    }
  }, [wallChallenge, wcTyped, wcResult, onCollect, onForceUse, showMsg]);

  const move = useCallback((dx, dy) => {
    if (!map || wallChallenge) return;
    setDir({ x: dx, y: dy });
    const cur = posRef.current;
    const nx = cur.x + dx, ny = cur.y + dy;
    if (nx < 0 || ny < 0 || nx >= GS || ny >= GS) return;
    const cell = map.grid[ny][nx];

    // Hard wall
    if (cell === 1) { showMsg(PLANET_NARRATIVE[pi].wallMsg); return; }
    // Regular hazard
    if (cell === 2) { showMsg(PLANET_NARRATIVE[pi].hazardMsg); return; }
    // Soft wall — start spelling challenge
    if (cell === 3) { startWallChallenge(nx, ny); return; }
    // Jumpable hazard — costs 1 Force if Force >= 2
    if (cell === 4) {
      if (force >= 2) {
        onForceUse?.(1);
        sfx("step");
        setMap((m) => {
          const g = m.grid.map((r) => [...r]);
          g[ny][nx] = 0; // mark as crossed
          return { ...m, grid: g };
        });
        showMsg("⚡ Force Jump!", 1200);
        const newPos = { x: nx, y: ny };
        posRef.current = newPos;
        setPos(newPos);
      } else {
        showMsg("Not enough Force to jump! (need 2⚡)", 1800);
      }
      return;
    }
    // Locked door — requires N enemies defeated
    if (cell === 5) {
      const needed = Math.ceil(total * 0.5);
      if (def >= needed) {
        sfx("pip");
        setMap((m) => {
          const g = m.grid.map((r) => [...r]);
          g[ny][nx] = 0;
          return { ...m, grid: g };
        });
        showMsg("🚪 Door unlocked!", 1200);
        const newPos = { x: nx, y: ny };
        posRef.current = newPos;
        setPos(newPos);
      } else {
        showMsg(`🔒 Defeat ${needed - def} more enemies to unlock!`, 2000);
      }
      return;
    }

    sfx("step");
    const newPos = { x: nx, y: ny };
    posRef.current = newPos;
    setPos(newPos);

    const ent = entsRef.current.find((e) => e.x === nx && e.y === ny);
    if (ent) {
      if (ent.type === "enemy") {
        onBattle(ent.word, ent.id);
      } else if (ent.type === "kyber") {
        sfx("pip");
        onCollect("kyber", 2);
        setEnts((p) => p.filter((e) => e.id !== ent.id));
        const km = PLANET_NARRATIVE[pi].kyberMsgs;
        showMsg(`💎 ${km[Math.floor(Math.random() * km.length)]} +2 Kyber Crystals!`, 2500);
      } else if (ent.type === "holocron") {
        sfx("pip");
        const hc = PLANET_NARRATIVE[pi].holocrons;
        showMsg(`📦 ${hc[Math.floor(Math.random() * hc.length)]}`, 5000);
        setEnts((p) => p.filter((e) => e.id !== ent.id));
        onCollect("score", 50);
      } else if (ent.type === "ration") {
        sfx("pip");
        onCollect("ration", 1);
        setEnts((p) => p.filter((e) => e.id !== ent.id));
        showMsg("🍖 Ration pack! +1 Force restored!", 1800);
      } else if (ent.type === "boss") {
        if (bossOk) {
          sfx("boss");
          onBoss();
        } else {
          showMsg(`🔒 Defeat all enemies first! (${def}/${total})`, 2000);
          posRef.current = cur;
          setPos(cur);
        }
      }
    }
  }, [map, wallChallenge, bossOk, def, total, force, onBattle, onBoss, onCollect, onForceUse, showMsg, startWallChallenge]);

  useEffect(() => {
    const h = (e) => {
      if (wallChallenge) return; // disable movement during wall challenge
      const k = e.key;
      if (k === "ArrowUp" || k === "w") { e.preventDefault(); move(0, -1); }
      if (k === "ArrowDown" || k === "s") { e.preventDefault(); move(0, 1); }
      if (k === "ArrowLeft" || k === "a") { e.preventDefault(); move(-1, 0); }
      if (k === "ArrowRight" || k === "d") { e.preventDefault(); move(1, 0); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [move, wallChallenge]);

  if (!map) return null;
  const dp = { background: "#12122A", border: "1px solid #2a2a4a", borderRadius: 8, color: "#8888CC", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", position: "relative", display: "flex", flexDirection: "column" }}>
      <Stars n={30} />
      <Nebula color={planet.c} opacity={0.06} />
      <ForceParticles count={8} color={planet.c + "66"} />
      <div style={{ position: "relative", zIndex: 10, padding: "10px 14px", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button onClick={onExit} style={{ background: "none", border: "none", color: "#556", fontSize: 12, cursor: "pointer" }}>◂ RETREAT</button>
          <div style={{ fontSize: 12, color: planet.c, letterSpacing: 1.5, fontWeight: 700 }}>{planet.name.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#FFE066", fontFamily: "monospace", fontWeight: 700 }}>{score}</div>
            <MuteBtn />
          </div>
        </div>
        <div style={{ marginBottom: 6 }}>
          <ForceMeter cur={force ?? 5} max={maxForce ?? 5} saberIdx={profile.lightsaberColor} />
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 11, color: "#888" }}>
          <span>Enemies: <b style={{ color: def >= total ? "#44CC44" : "#FFE066" }}>{def}/{total}</b></span>
          <span>Kyber: <b style={{ color: "#66CCFF" }}>{profile.kyberCrystals}</b></span>
          {combo >= 2 && <span style={{ color: "#FFE066", fontWeight: 700, animation: "planetPulse 1s infinite" }}>🔥 {combo}x</span>}
          {bossOk && <span style={{ color: "#EE6666", animation: "planetPulse 1.5s infinite" }}>✦ BOSS UNLOCKED</span>}
        </div>
        {force <= 2 && <div style={{ fontSize: 10, color: "#EE4444", letterSpacing: 1, marginTop: 4, animation: "planetPulse 1s infinite", textAlign: "center" }}>⚠ FORCE CRITICALLY LOW ⚠</div>}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10, padding: 16 }}>
        {msg && <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "#12122AEE", border: "1px solid #FFE06633", borderRadius: 8, padding: "10px 18px", fontSize: 13, color: "#CCCCDD", zIndex: 30, maxWidth: 320, textAlign: "center", animation: "fadeSlideUp .3s", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>{msg}</div>}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GS},${ts}px)`, gridTemplateRows: `repeat(${GS},${ts}px)`, gap: 1, background: "#00000066", borderRadius: 8, overflow: "hidden", border: `1px solid ${planet.c}33`, boxShadow: `0 0 30px ${planet.gc}` }}>
          {map.grid.map((row, y) => row.map((cell, x) => {
            const isP = pos.x === x && pos.y === y;
            const ent = ents.find((e) => e.x === x && e.y === y);
            const gc = planet.gnd[(x + y) % planet.gnd.length];
            let bg = gc;
            if (cell === 1) bg = planet.wc;
            if (cell === 2 || cell === 4) bg = planet.hc;
            if (cell === 3) bg = planet.wc;
            if (cell === 5) bg = planet.wc;
            return (
              <div key={`${x}-${y}`} onClick={() => { const dx = x - pos.x, dy = y - pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy); }} style={{ width: ts, height: ts, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", fontSize: ts * 0.5 }}>
                {cell === 1 && <span style={{ fontSize: ts * 0.45, opacity: 0.6 }}>{planet.we}</span>}
                {cell === 2 && <span style={{ fontSize: ts * 0.4, opacity: 0.5 }}>{planet.he}</span>}
                {cell === 3 && <span style={{ fontSize: ts * 0.45, opacity: 0.8, filter: `drop-shadow(0 0 4px ${saber.c})`, animation: "planetPulse 2s infinite" }}>{planet.we}</span>}
                {cell === 4 && <span style={{ fontSize: ts * 0.4, opacity: 0.7, filter: "drop-shadow(0 0 3px #4A9EEA)" }}>{planet.he}</span>}
                {cell === 5 && <span style={{ fontSize: ts * 0.45 }}>🚪</span>}
                {ent && !isP && ent.type !== "decor" && <span style={{ fontSize: ts * 0.5, position: "absolute", zIndex: 5, animation: ent.type === "boss" ? (bossOk ? "entityBob 1s infinite" : "none") : "entityBob 1.5s infinite", opacity: ent.type === "boss" && !bossOk ? 0.4 : 1, filter: ent.type === "boss" && bossOk ? `drop-shadow(0 0 6px ${planet.c})` : ent.type === "ration" ? "drop-shadow(0 0 4px #FFE066)" : "none" }}>{ent.emoji}</span>}
                {ent && ent.type === "decor" && !isP && <span style={{ fontSize: ts * 0.35, opacity: 0.4 }}>{ent.emoji}</span>}
                {isP && <div style={{ position: "absolute", zIndex: 10, fontSize: ts * 0.55, filter: `drop-shadow(0 0 6px ${saber.c})`, transform: dir.x < 0 ? "scaleX(-1)" : "none" }}>🥷</div>}
              </div>
            );
          }))}
        </div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,50px)", gridTemplateRows: "repeat(3,42px)", gap: 3 }}>
          <div /><button onClick={() => move(0, -1)} style={dp}>▲</button><div />
          <button onClick={() => move(-1, 0)} style={dp}>◀</button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444" }}>MOVE</div>
          <button onClick={() => move(1, 0)} style={dp}>▶</button>
          <div /><button onClick={() => move(0, 1)} style={dp}>▼</button><div />
        </div>
      </div>

      {/* Wall Challenge Popup */}
      {wallChallenge && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#12122A", border: `1px solid ${saber.c}44`, borderRadius: 12, padding: "20px 24px", maxWidth: 360, textAlign: "center", animation: "fadeSlideUp .3s" }}>
            <div style={{ fontSize: 11, color: saber.c, letterSpacing: 2, marginBottom: 6 }}>⚔ CUT THE WALL</div>
            <div style={{ fontSize: 13, color: "#CCCCDD", marginBottom: 12 }}>Spell the word to slice through!</div>
            <button onClick={() => say(wallChallenge.word)} style={{ marginBottom: 10, padding: "5px 14px", fontSize: 11, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, color: wcResult === "ok" ? "#44CC44" : wcResult === "no" ? "#EE4444" : "#FFE066", fontFamily: "monospace", minHeight: 32, marginBottom: 8 }}>
              {wcTyped || <span style={{ color: "#333", fontSize: 11 }}>TYPE THE WORD...</span>}
            </div>
            {wcResult === "ok" && <div style={{ fontSize: 12, color: "#44CC44", fontWeight: 700, marginBottom: 6 }}>✦ Wall destroyed! +50</div>}
            {wcResult === "no" && <div style={{ fontSize: 12, color: "#EE4444", fontWeight: 700, marginBottom: 6 }}>✗ Wrong! The word was: {wallChallenge.word.toUpperCase()}</div>}
            <input ref={wcInpRef} type="text" value={wcTyped} onChange={(e) => { if (!wcResult) setWcTyped(e.target.value.toLowerCase()); }} onKeyDown={(e) => e.key === "Enter" && submitWallChallenge()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
            {!wcResult && <Keyboard onKey={(k) => { if (!wcResult) { setWcTyped((t) => t + k); wcInpRef.current?.focus(); } }} onDel={() => { if (!wcResult) setWcTyped((t) => t.slice(0, -1)); }} onSubmit={submitWallChallenge} typed={wcTyped.trim()} result={wcResult} saber={saber} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorer;
