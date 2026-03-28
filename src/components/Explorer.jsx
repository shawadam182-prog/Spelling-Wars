import { useState, useEffect, useCallback, useRef } from "react";
import { PLANET_NARRATIVE } from "../data/narratives.js";
import { sfx } from "../utils/audio.js";
import { getSaber, GS, genMap } from "../utils/helpers.js";
import Stars from "./Stars";
import Nebula from "./Nebula";
import ForceParticles from "./ForceParticles";
import MuteBtn from "./MuteBtn";
import ForceMeter from "./ForceMeter";

const Explorer = ({ planet, pi, words, boss, profile, score, defeated, onBattle, onBoss, onCollect, onExit }) => {
  const [pos, setPos] = useState({ x: 0, y: GS - 1 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [map, setMap] = useState(null);
  const [ents, setEnts] = useState([]);
  const [msg, setMsg] = useState(null);
  const saber = getSaber(profile.lightsaberColor);

  // Mobile-responsive tile size
  const [ts, setTs] = useState(Math.min(48, (window.innerWidth - 40) / GS));
  useEffect(() => {
    const onResize = () => setTs(Math.min(48, (window.innerWidth - 40) / GS));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const posRef = useRef(pos);
  const entsRef = useRef(ents);
  const msgTimerRef = useRef(null);
  posRef.current = pos;
  entsRef.current = ents;

  useEffect(() => {
    const d = genMap(pi, words);
    setMap(d);
    setEnts(d.entities);
    setPos({ x: 0, y: GS - 1 });
    posRef.current = { x: 0, y: GS - 1 };
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

  const move = useCallback((dx, dy) => {
    if (!map) return;
    setDir({ x: dx, y: dy });
    const cur = posRef.current;
    const nx = cur.x + dx, ny = cur.y + dy;
    if (nx < 0 || ny < 0 || nx >= GS || ny >= GS) return;
    if (map.grid[ny][nx] === 1) { showMsg(PLANET_NARRATIVE[pi].wallMsg); return; }
    if (map.grid[ny][nx] === 2) { showMsg(PLANET_NARRATIVE[pi].hazardMsg); return; }

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
  }, [map, bossOk, def, total, onBattle, onBoss, onCollect, showMsg]);

  useEffect(() => {
    const h = (e) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w") { e.preventDefault(); move(0, -1); }
      if (k === "ArrowDown" || k === "s") { e.preventDefault(); move(0, 1); }
      if (k === "ArrowLeft" || k === "a") { e.preventDefault(); move(-1, 0); }
      if (k === "ArrowRight" || k === "d") { e.preventDefault(); move(1, 0); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [move]);

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
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 11, color: "#888" }}>
          <span>Enemies: <b style={{ color: def >= total ? "#44CC44" : "#FFE066" }}>{def}/{total}</b></span>
          <span>Kyber: <b style={{ color: "#66CCFF" }}>{profile.kyberCrystals}</b></span>
          {bossOk && <span style={{ color: "#EE6666", animation: "planetPulse 1.5s infinite" }}>✦ BOSS UNLOCKED</span>}
        </div>
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
            if (cell === 2) bg = planet.hc;
            return (
              <div key={`${x}-${y}`} onClick={() => { const dx = x - pos.x, dy = y - pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy); }} style={{ width: ts, height: ts, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", fontSize: ts * 0.5 }}>
                {cell === 1 && <span style={{ fontSize: ts * 0.45, opacity: 0.6 }}>{planet.we}</span>}
                {cell === 2 && <span style={{ fontSize: ts * 0.4, opacity: 0.5 }}>{planet.he}</span>}
                {ent && !isP && ent.type !== "decor" && <span style={{ fontSize: ts * 0.5, position: "absolute", zIndex: 5, animation: ent.type === "boss" ? (bossOk ? "entityBob 1s infinite" : "none") : ent.type === "enemy" ? "entityBob 1.5s infinite" : "none", opacity: ent.type === "boss" && !bossOk ? 0.4 : 1, filter: ent.type === "boss" && bossOk ? `drop-shadow(0 0 6px ${planet.c})` : "none" }}>{ent.emoji}</span>}
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
    </div>
  );
};

export default Explorer;
