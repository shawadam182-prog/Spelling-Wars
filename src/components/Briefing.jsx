import { useState, useEffect } from "react";
import { PLANET_NARRATIVE } from "../data/narratives.js";
import { getSaber } from "../utils/helpers.js";
import Stars from "./Stars";

const Briefing = ({ planet, pi, boss, words, profile, isPractice, onStart, onBack }) => {
  const [show, setShow] = useState(false);
  const saber = getSaber(profile.lightsaberColor);
  useEffect(() => { const t = setTimeout(() => setShow(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#05050F", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Stars n={80} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, width: "100%", maxWidth: 460, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(30px)", transition: "all .6s" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto 16px", background: `radial-gradient(circle at 35% 35%,${planet.c}CC,${planet.c}44)`, boxShadow: `0 0 40px ${planet.gc}`, animation: "planetFloat 4s infinite" }} />
        <div style={{ fontSize: 10, color: isPractice ? "#44AA4488" : "#FFE06666", letterSpacing: 4 }}>{isPractice ? "PRACTICE MISSION" : "MISSION BRIEFING"}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: planet.c, margin: "4px 0", letterSpacing: 3, textShadow: `0 0 20px ${planet.gc}` }}>{planet.name.toUpperCase()}</h1>
        <p style={{ fontSize: 13, color: "#8888AA", fontStyle: "italic", margin: "0 0 12px" }}>"{planet.desc}"</p>
        {PLANET_NARRATIVE[pi]?.missionBrief && <p style={{ fontSize: 12, color: "#AABB", lineHeight: 1.7, margin: "0 0 16px", padding: "10px 14px", background: "#0A0A1A88", borderLeft: `2px solid ${planet.c}44`, borderRadius: 4 }}>{PLANET_NARRATIVE[pi].missionBrief}</p>}
        {isPractice && <div style={{ fontSize: 11, color: "#44AA44", background: "#44AA4415", padding: "4px 12px", borderRadius: 4, display: "inline-block", marginBottom: 12 }}>Practice — no rank or score changes</div>}
        <div style={{ background: "#0A0A1A", border: "1px solid #1a1a3a", borderRadius: 12, padding: 18, textAlign: "left" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 1.5 }}>WORDS</div><div style={{ fontSize: 20, color: "#FFE066", fontWeight: 700, fontFamily: "monospace" }}>{words.length}</div></div>
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 1.5 }}>BOSS</div><div style={{ fontSize: 14, color: "#EE6666", fontWeight: 600, marginTop: 2 }}>{boss.icon} {boss.name}</div></div>
          </div>
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 12 }}>
            <div style={{ fontSize: 9, color: "#556", letterSpacing: 1.5, marginBottom: 6 }}>TARGET WORDS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {words.map((w, i) => {
                const m = profile.wordProgress[w] || 0;
                return <span key={i} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, background: m >= 3 ? "#44AA4422" : m > 0 ? "#FFE06615" : "#ffffff08", color: m >= 3 ? "#44AA44" : m > 0 ? "#FFE066" : "#667", border: `1px solid ${m >= 3 ? "#44AA4433" : m > 0 ? "#FFE06622" : "#1a1a2e"}` }}>{w}</span>;
              })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
          <button onClick={onBack} style={{ padding: "10px 18px", fontSize: 12, background: "none", border: "1px solid #333", borderRadius: 8, color: "#666", cursor: "pointer" }}>◂ BACK</button>
          <button onClick={onStart} style={{ padding: "10px 28px", fontSize: 14, fontWeight: 700, letterSpacing: 3, background: `linear-gradient(135deg,${saber.c}33,${saber.c}11)`, border: `1px solid ${saber.c}66`, borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ ENGAGE</button>
        </div>
        <div style={{ marginTop: 18, fontSize: 11, color: "#EE666688", fontStyle: "italic" }}>"{boss.q}"</div>
      </div>
    </div>
  );
};

export default Briefing;
