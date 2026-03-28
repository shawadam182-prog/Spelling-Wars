import { useMemo, useEffect } from "react";

const HyperspaceOverlay = ({ active, onDone }) => {
  const lines = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    i, x: Math.random() * 100, delay: Math.random() * 0.2, w: Math.random() * 2 + 1,
  })), []);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#05050F", overflow: "hidden", animation: "hyperspaceFade .7s forwards" }}>
      {lines.map((l) => (
        <div key={l.i} style={{
          position: "absolute", left: `${l.x}%`, top: "50%", width: l.w,
          background: "linear-gradient(to bottom, transparent, #4A9EEA88, #FFFFFFCC, #4A9EEA88, transparent)",
          animation: `hyperspaceStretch .5s ${l.delay}s ease-in forwards`,
          height: 2, opacity: 0,
        }} />
      ))}
    </div>
  );
};

export default HyperspaceOverlay;
