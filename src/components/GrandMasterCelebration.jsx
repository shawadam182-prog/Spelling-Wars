import { useState, useEffect } from "react";
import { SABERS, PLANETS } from "../data/constants.js";
import { sfx } from "../utils/audio.js";
import Stars from "./Stars";

const GrandMasterCelebration = ({ profile, onContinue }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);
  useEffect(() => { sfx("win"); }, []);

  const saberIcons = SABERS.map((s, i) => (
    <div key={i} style={{
      position: "absolute", animation: `grandMasterOrbit ${6 + i}s linear infinite`,
      animationDelay: `${i * 1.2}s`,
    }}>
      <div style={{ width: 8, height: 24, borderRadius: 4, background: s.c, boxShadow: `0 0 12px ${s.g}` }} />
    </div>
  ));

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Stars n={200} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.8)", transition: "all 1s ease-out" }}>
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {saberIcons}
          <div style={{ fontSize: 64, animation: "planetFloat 3s infinite", filter: "drop-shadow(0 0 20px #FFE066)" }}>✶</div>
        </div>
        <div style={{ fontSize: 11, color: "#FFE06688", letterSpacing: 4, marginBottom: 8 }}>YOU HAVE ACHIEVED THE RANK OF</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: "#FFE066", letterSpacing: 6, margin: "0 0 8px", animation: "grandMasterGlow 3s ease-in-out infinite" }}>GRAND MASTER</h1>
        <p style={{ fontSize: 16, color: "#AABB", maxWidth: 400, margin: "0 auto 8px", lineHeight: 1.6 }}>All planets have been liberated. The galaxy is at peace.</p>
        <p style={{ fontSize: 14, color: "#FFE066", fontFamily: "monospace", marginTop: 16 }}>Final Score: {profile.totalScore.toLocaleString()}</p>
        <p style={{ fontSize: 12, color: "#66CCFF", marginTop: 4 }}>Kyber Crystals: {profile.kyberCrystals}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
          {PLANETS.map((pl) => (
            <div key={pl.id} style={{ width: 28, height: 28, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%,${pl.c}CC,${pl.c}44)`, boxShadow: `0 0 8px ${pl.gc}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, filter: "drop-shadow(0 0 3px #FFE066)" }}>✦</span>
            </div>
          ))}
        </div>
        <button onClick={onContinue} style={{ marginTop: 28, padding: "14px 36px", fontSize: 15, fontWeight: 700, letterSpacing: 3, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ RETURN TO GALAXY</button>
        <p style={{ fontSize: 11, color: "#556", marginTop: 12 }}>You can revisit any planet in Practice Mode!</p>
      </div>
    </div>
  );
};

export default GrandMasterCelebration;
