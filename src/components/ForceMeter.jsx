import { getSaber } from "../utils/helpers.js";

const ForceMeter = ({ cur, max, saberIdx }) => {
  const p = Math.max(0, (cur / max) * 100);
  const c = getSaber(saberIdx);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#FFE066", fontFamily: "monospace", letterSpacing: 1 }}>FORCE</span>
      <div style={{ flex: 1, height: 14, background: "#1a1a2e", borderRadius: 7, border: "1px solid #333355", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, borderRadius: 6, background: `linear-gradient(90deg,${c.c}88,${c.c})`, boxShadow: `0 0 12px ${c.g}`, transition: "width .5s" }} />
      </div>
      <span style={{ fontSize: 12, color: "#AAB", fontFamily: "monospace", minWidth: 36, textAlign: "right" }}>{cur}/{max}</span>
    </div>
  );
};

export default ForceMeter;
