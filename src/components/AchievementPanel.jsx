import { ACHIEVEMENTS, tierColor } from "../data/achievements";
import Stars from "./Stars";

const AchievementPanel = ({ profile, onClose }) => {
  const unlocked = profile.unlockedAchievements || [];
  const count = unlocked.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: "#05050FEE",
      display: "flex", flexDirection: "column", alignItems: "center",
      overflow: "auto", padding: "20px 12px",
    }}>
      <Stars n={60} />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#FFE066", letterSpacing: 4, margin: 0, textShadow: "0 0 20px #FFE06644" }}>
            ACHIEVEMENTS
          </h2>
          <p style={{ fontSize: 11, color: "#8888AA", margin: "4px 0 0" }}>
            {count} / {ACHIEVEMENTS.length} unlocked
          </p>
          <div style={{ width: 120, height: 4, background: "#1a1a2e", borderRadius: 2, margin: "8px auto 0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / ACHIEVEMENTS.length) * 100}%`, background: count === ACHIEVEMENTS.length ? "#FF44FF" : "#FFE066", borderRadius: 2, transition: "width .3s" }} />
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}>
          {ACHIEVEMENTS.map((ach) => {
            const earned = unlocked.includes(ach.id);
            const tc = tierColor(ach.tier);
            return (
              <div key={ach.id} style={{
                background: earned ? "#12122A" : "#0A0A18",
                border: `1px solid ${earned ? tc + "66" : "#1a1a2e"}`,
                borderRadius: 10, padding: "12px 10px", textAlign: "center",
                opacity: earned ? 1 : 0.4,
                boxShadow: earned ? `0 0 12px ${tc}22` : "none",
                transition: "all .3s",
              }}>
                <div style={{
                  fontSize: 28, marginBottom: 6,
                  filter: earned ? `drop-shadow(0 0 6px ${tc})` : "grayscale(1)",
                }}>
                  {ach.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: earned ? tc : "#444", letterSpacing: 0.5 }}>
                  {ach.name}
                </div>
                <div style={{ fontSize: 9, color: earned ? "#8888AA" : "#333", marginTop: 3, lineHeight: 1.3 }}>
                  {ach.desc}
                </div>
                {earned && (
                  <div style={{ fontSize: 8, color: tc, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>
                    {ach.tier}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={onClose} style={{
            padding: "10px 28px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
            background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8,
            color: "#FFE066", cursor: "pointer",
          }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementPanel;
