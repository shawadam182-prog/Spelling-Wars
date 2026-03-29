import { useState, useEffect, useRef } from "react";
import { PLANETS, BOSSES, LORE, SABERS } from "../data/constants.js";
import { LW } from "../data/words.js";
import { getRank, getSaber, planetMastery, getTroubleWords } from "../utils/helpers.js";
import Stars from "./Stars";
import Nebula from "./Nebula";
import ForceParticles from "./ForceParticles";
import MuteBtn from "./MuteBtn";
import HoloPanel from "./HoloPanel";
import ShipSilhouettes from "./ShipSilhouettes";

const Galaxy = ({ profile, onSelect, onLogout, onSaberPick, onTroubleWords, onAchievements, onDaily, onScanner }) => {
  const [hov, setHov] = useState(null);
  const [lore, setLore] = useState(null);
  const loreTimer = useRef(null);
  const rank = getRank(profile.level);
  const saber = getSaber(profile.lightsaberColor);
  const pts = [{ x: 15, y: 82 }, { x: 42, y: 72 }, { x: 72, y: 80 }, { x: 85, y: 58 }, { x: 58, y: 42 }, { x: 28, y: 48 }, { x: 12, y: 30 }, { x: 38, y: 16 }, { x: 65, y: 22 }, { x: 85, y: 8 }];

  useEffect(() => () => { if (loreTimer.current) clearTimeout(loreTimer.current); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Stars n={160} />
      <Nebula color="#4A9EEA" color2="#9944CC" opacity={0.05} />
      <ForceParticles count={12} color="#FFE06622" />
      <ShipSilhouettes types={["xwing", "tieFighter", "starDestroyer"]} count={4} opacity={0.03} />
      <div style={{ position: "relative", zIndex: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle,${saber.c}33,transparent)`, border: `2px solid ${saber.c}66`, fontSize: 16 }}>{rank.icon}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#FFE066", letterSpacing: 1.5 }}>{profile.username.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: "#8888AA" }}>{rank.name} — Level {profile.level}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: "#FFE066", fontWeight: 700, fontFamily: "monospace" }}>{profile.totalScore.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>SCORE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: "#66CCFF", fontWeight: 700, fontFamily: "monospace" }}>{profile.kyberCrystals}</div>
            <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>KYBER</div>
          </div>
          <MuteBtn />
          <button onClick={onLogout} style={{ background: "none", border: "1px solid #333", borderRadius: 6, color: "#666", fontSize: 10, padding: "3px 8px", cursor: "pointer" }}>LOG OUT</button>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "16px 0 6px", position: "relative", zIndex: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: 6, color: "#FFE066", margin: 0, textShadow: "0 0 30px #FFE06644" }}>GALAXY MAP</h1>
        <p style={{ fontSize: 11, color: "#556", margin: "4px 0 0", letterSpacing: 2 }}>CHOOSE YOUR DESTINATION</p>
      </div>
      <div style={{ flex: 1, position: "relative", zIndex: 5, padding: "10px 20px 10px", minHeight: 440 }}>
        {PLANETS.map((pl, i) => {
          const p = pts[i], unlk = profile.level >= pl.id, cur = profile.level === pl.id, done = (profile.planetsCompleted || []).includes(pl.id), h = hov === pl.id, bossData = BOSSES[i], sz = cur ? 58 : done ? 48 : 44;
          return (
            <div key={pl.id} onMouseEnter={() => (unlk || done) && setHov(pl.id)} onMouseLeave={() => setHov(null)} onClick={() => (unlk || done) && onSelect(pl.id, done && !cur)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", cursor: (unlk || done) ? "pointer" : "default", zIndex: h ? 20 : 10, transition: "transform .2s" }}>
              {cur && <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `2px solid ${pl.c}44`, animation: "planetPulse 2s infinite" }} />}
              <div style={{ width: sz, height: sz, borderRadius: "50%", background: unlk ? `radial-gradient(circle at 35% 35%,${pl.c}CC,${pl.c}44,${pl.c}11)` : "radial-gradient(circle at 35% 35%,#333,#1a1a1a)", boxShadow: unlk ? `0 0 ${cur ? 28 : 12}px ${pl.gc}` : "none", transition: "all .3s", display: "flex", alignItems: "center", justifyContent: "center", transform: h ? "scale(1.15)" : "scale(1)", opacity: unlk ? 1 : 0.3 }}>
                {done && <span style={{ fontSize: 16, filter: "drop-shadow(0 0 4px #FFE066)" }}>✦</span>}
                {!unlk && !done && <span style={{ fontSize: 14, opacity: 0.5 }}>🔒</span>}
              </div>
              <div style={{ textAlign: "center", marginTop: 5, whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: unlk ? (cur ? "#FFE066" : "#CCC") : "#444" }}>{pl.name.toUpperCase()}</div>
                {cur && <div style={{ fontSize: 8, color: "#FFE06688" }}>▸ YOU ARE HERE</div>}
                {done && !cur && <div style={{ fontSize: 8, color: "#44AA44" }}>PRACTICE</div>}
              </div>
              {h && (unlk || done) && (
                <HoloPanel color={pl.c} intensity="subtle" style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 10, padding: "8px 12px", boxShadow: "0 4px 20px rgba(0,0,0,.6)", whiteSpace: "nowrap", minWidth: 170, textAlign: "center", zIndex: 30 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: pl.c, letterSpacing: 1 }}>{pl.name}</div>
                  <div style={{ fontSize: 10, color: "#8888AA", fontStyle: "italic", margin: "3px 0" }}>"{pl.desc}"</div>
                  <div style={{ fontSize: 9, color: "#666688" }}>{LW[i]?.length} words — Boss: {bossData.icon} {bossData.name}</div>
                  {(() => {
                    const m = planetMastery(profile, LW[i]);
                    const pct = Math.round(m * 100);
                    return <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                      <div style={{ width: 60, height: 5, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? "#44CC44" : pct >= 40 ? "#FFE066" : "#EE6666", borderRadius: 3, transition: "width .3s" }} />
                      </div>
                      <span style={{ fontSize: 9, color: "#8888AA" }}>{pct}%</span>
                    </div>;
                  })()}
                  <div style={{ marginTop: 4, fontSize: 10, fontWeight: 600, color: done && !cur ? "#44AA44" : cur ? "#FFE066" : "#44AA44", padding: "2px 8px", borderRadius: 4, background: done && !cur ? "#44AA4415" : cur ? "#FFE06615" : "#44AA4415" }}>{done && !cur ? "✦ PRACTICE MODE" : done ? "✦ COMPLETED" : "▸ TAP TO LAUNCH"}</div>
                </HoloPanel>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "relative", zIndex: 10, padding: "10px 20px 18px", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => {
          if (loreTimer.current) clearTimeout(loreTimer.current);
          setLore(LORE[Math.floor(Math.random() * LORE.length)]);
          loreTimer.current = setTimeout(() => setLore(null), 5000);
        }} style={{ background: "#12122A", border: "1px solid #2a2a4a", borderRadius: 8, color: "#8888CC", fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>✦ ARCHIVES</button>
        {(() => {
          const d = new Date();
          const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const done = profile.lastDailyDate === today;
          return <button onClick={done ? undefined : onDaily} style={{ background: done ? "#0A0A18" : "#12122A", border: `1px solid ${done ? "#44AA4444" : "#66CCFF44"}`, borderRadius: 8, color: done ? "#44AA44" : "#66CCFF", fontSize: 11, padding: "8px 14px", cursor: done ? "default" : "pointer", opacity: done ? 0.6 : 1 }}>{done ? "✓ DAILY DONE" : "☀ DAILY"}{profile.dailyStreak > 0 && ` (${profile.dailyStreak}🔥)`}</button>;
        })()}
        <button onClick={onAchievements} style={{ background: "#12122A", border: "1px solid #FFD70044", borderRadius: 8, color: "#FFD700", fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>🏆 ACHIEVEMENTS</button>
        <button onClick={onSaberPick} style={{ background: "#12122A", border: `1px solid ${saber.c}44`, borderRadius: 8, color: saber.c, fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>⚔ LIGHTSABER</button>
        {onTroubleWords && <button onClick={onTroubleWords} style={{ background: "#12122A", border: "1px solid #EE444444", borderRadius: 8, color: "#EE6666", fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>⚔ TROUBLE WORDS</button>}
        <button onClick={onScanner} style={{ background: "#12122A", border: "1px solid #44CC4444", borderRadius: 8, color: "#44CC44", fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>📡 SCAN HOMEWORK</button>
        <button onClick={() => onSelect(profile.level)} style={{ background: `linear-gradient(135deg,${saber.c}33,${saber.c}11)`, border: `1px solid ${saber.c}66`, borderRadius: 8, color: "#FFE066", fontSize: 13, fontWeight: 700, padding: "8px 24px", cursor: "pointer", letterSpacing: 2 }}>▸ LAUNCH MISSION</button>
      </div>
      {lore && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "#12122AEE", border: "1px solid #FFE06633", borderRadius: 10, padding: "12px 18px", maxWidth: 380, textAlign: "center", zIndex: 50, animation: "fadeSlideUp .4s" }}>
          <div style={{ fontSize: 9, color: "#FFE06688", letterSpacing: 2, marginBottom: 4 }}>✦ JEDI ARCHIVES ✦</div>
          <div style={{ fontSize: 12, color: "#CCCCDD", lineHeight: 1.5 }}>{lore}</div>
        </div>
      )}
    </div>
  );
};

export default Galaxy;
