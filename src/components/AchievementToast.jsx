import { useState, useEffect } from "react";
import { getAchievement, tierColor } from "../data/achievements";

const AchievementToast = ({ achievementId, onDone }) => {
  const [visible, setVisible] = useState(false);
  const ach = getAchievement(achievementId);

  useEffect(() => {
    if (!ach) { onDone?.(); return; }
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setVisible(false), 3500);
    const t3 = setTimeout(() => onDone?.(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [ach, onDone]);

  if (!ach) return null;
  const tc = tierColor(ach.tier);

  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : -80}px)`,
      zIndex: 9999, transition: "transform .4s cubic-bezier(.34,1.56,.64,1), opacity .4s",
      opacity: visible ? 1 : 0, pointerEvents: "none",
    }}>
      <div style={{
        background: "#12122AEE", border: `2px solid ${tc}88`, borderRadius: 12,
        padding: "10px 20px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: `0 0 30px ${tc}44, 0 4px 20px rgba(0,0,0,.6)`,
        minWidth: 240,
      }}>
        <div style={{ fontSize: 28, filter: `drop-shadow(0 0 8px ${tc})` }}>{ach.icon}</div>
        <div>
          <div style={{ fontSize: 9, color: tc, letterSpacing: 2, fontWeight: 700 }}>ACHIEVEMENT UNLOCKED</div>
          <div style={{ fontSize: 14, color: "#FFE066", fontWeight: 700, marginTop: 2 }}>{ach.name}</div>
          <div style={{ fontSize: 10, color: "#8888AA", marginTop: 1 }}>{ach.desc}</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
