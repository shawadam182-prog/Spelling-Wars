import { useMemo } from "react";

const ForceParticles = ({ count = 15, color = "#FFE066" }) => {
  const pts = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, x: Math.random() * 100, y: Math.random() * 100,
    sz: Math.random() * 3 + 1, dur: Math.random() * 6 + 4, dl: Math.random() * 6,
  })), [count]);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      {pts.map((p) => (
        <div key={p.i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.sz, height: p.sz, borderRadius: "50%", background: color, boxShadow: `0 0 ${p.sz * 2}px ${color}`, animation: `particleFloat ${p.dur}s ease-in-out ${p.dl}s infinite` }} />
      ))}
    </div>
  );
};

export default ForceParticles;
