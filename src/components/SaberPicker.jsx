import { SABERS, SABER_COSTS } from "../data/constants.js";
import { sfx } from "../utils/audio.js";
import { saberBonus } from "../utils/helpers.js";
import HoloPanel from "./HoloPanel";
import Lightsaber from "./Lightsaber";

const SaberPicker = ({ profile, onSelect, onClose }) => {
  const owned = profile.unlockedSabers || [0];
  const current = profile.lightsaberColor;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05050FEE", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "slideIn .3s" }}>
      <HoloPanel color="#FFE066" style={{ padding: 24, maxWidth: 400, width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#FFE06666", letterSpacing: 3, marginBottom: 4 }}>LIGHTSABER</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#FFE066", margin: "0 0 6px", letterSpacing: 2 }}>ARMORY</h2>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Kyber Crystals: <b style={{ color: "#66CCFF" }}>💎 {profile.kyberCrystals}</b></div>
        <div style={{ fontSize: 10, color: "#8888AA", marginBottom: 16, lineHeight: 1.5, padding: "6px 10px", background: "#0A0A1A88", borderRadius: 6, border: "1px solid #1a1a2e" }}>
          Collect 💎 Kyber Crystals on missions to unlock new lightsabers.<br />
          Each saber gives a <b style={{ color: "#FFE066" }}>unique gameplay bonus</b> during battles!
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SABERS.map((s, i) => {
            const isOwned = owned.includes(i);
            const isCurrent = current === i;
            const cost = SABER_COSTS[i];
            const canAfford = profile.kyberCrystals >= cost;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: isCurrent ? `${s.c}15` : "#0E0E1E",
                border: `1px solid ${isCurrent ? s.c + "66" : "#1a1a3a"}`,
                borderRadius: 10, transition: "all .2s",
              }}>
                <div style={{ flexShrink: 0 }}>
                  <Lightsaber color={s.c} glow={s.g} size={50} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: "#8888AA", marginTop: 1 }}>{saberBonus(i).desc}</div>
                  {!isOwned && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{cost} Kyber Crystals</div>}
                </div>
                {isCurrent ? (
                  <span style={{ fontSize: 10, color: s.c, letterSpacing: 1, fontWeight: 700, padding: "4px 10px", background: `${s.c}15`, borderRadius: 4 }}>EQUIPPED</span>
                ) : isOwned ? (
                  <button onClick={() => { sfx("saber"); onSelect(i); }} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "4px 10px", background: `${s.c}22`, border: `1px solid ${s.c}44`, borderRadius: 4, color: s.c, cursor: "pointer" }}>EQUIP</button>
                ) : (
                  <button onClick={() => canAfford && onSelect(i, cost)} disabled={!canAfford} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "4px 10px", background: canAfford ? "#FFE06615" : "#111", border: `1px solid ${canAfford ? "#FFE06644" : "#222"}`, borderRadius: 4, color: canAfford ? "#FFE066" : "#444", cursor: canAfford ? "pointer" : "default" }}>
                    UNLOCK {cost}💎
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 16, padding: "8px 24px", fontSize: 12, background: "none", border: "1px solid #333", borderRadius: 8, color: "#888", cursor: "pointer", letterSpacing: 1 }}>CLOSE</button>
      </HoloPanel>
    </div>
  );
};

export default SaberPicker;
