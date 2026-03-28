import { useMemo } from "react";

const Stars = ({ n = 120 }) => {
  const stars = useMemo(
    () => Array.from({ length: n }, (_, i) => ({
      i, x: Math.random() * 100, y: Math.random() * 100,
      sz: Math.random() * 2.2 + 0.4, op: Math.random() * 0.7 + 0.3,
      d: Math.random() * 3 + 2, dl: Math.random() * 4,
    })),
    [n]
  );
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s) => (
        <div key={s.i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.sz, height: s.sz, borderRadius: "50%",
          backgroundColor: s.sz > 1.8 ? "#FFFDE8" : "#E8E8FF",
          opacity: s.op,
          animation: `starTwinkle ${s.d}s ease-in-out ${s.dl}s infinite`,
        }} />
      ))}
    </div>
  );
};

export default Stars;
