import { useMemo } from "react";

// Simple SVG path data for iconic Star Wars ships
const SHIPS = {
  xwing: {
    viewBox: "0 0 100 100",
    paths: [
      // Fuselage
      "M 45 20 L 55 20 L 58 80 L 42 80 Z",
      // Wings (X shape)
      "M 50 35 L 15 10 L 12 14 L 45 40 Z",
      "M 50 35 L 85 10 L 88 14 L 55 40 Z",
      "M 50 55 L 15 85 L 12 81 L 45 58 Z",
      "M 50 55 L 85 85 L 88 81 L 55 58 Z",
      // Cockpit
      "M 47 22 L 53 22 L 52 30 L 48 30 Z",
    ],
  },
  tieFighter: {
    viewBox: "0 0 100 100",
    paths: [
      // Left panel
      "M 10 10 L 15 10 L 15 90 L 10 90 Z",
      "M 15 10 L 38 20 L 38 80 L 15 90 Z",
      // Right panel
      "M 85 10 L 90 10 L 90 90 L 85 90 Z",
      "M 62 20 L 85 10 L 85 90 L 62 80 Z",
      // Cockpit (hexagonal)
      "M 50 35 L 60 42 L 60 58 L 50 65 L 40 58 L 40 42 Z",
      // Struts
      "M 38 50 L 40 50",
      "M 60 50 L 62 50",
    ],
  },
  starDestroyer: {
    viewBox: "0 0 120 60",
    paths: [
      // Main hull (triangle)
      "M 60 5 L 115 45 L 110 50 L 10 50 L 5 45 Z",
      // Bridge tower
      "M 52 20 L 68 20 L 66 12 L 54 12 Z",
      "M 56 12 L 64 12 L 62 8 L 58 8 Z",
      // Engine glow area
      "M 15 48 L 105 48 L 108 52 L 12 52 Z",
    ],
  },
};

const ShipSilhouettes = ({ types = ["xwing", "tieFighter"], count = 3, color = "#ffffff", opacity = 0.04 }) => {
  const ships = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type: types[i % types.length],
      x: 5 + Math.random() * 85,
      y: 8 + Math.random() * 75,
      size: 40 + Math.random() * 50,
      rotation: -15 + Math.random() * 30,
      duration: 25 + Math.random() * 20,
      delay: Math.random() * 10,
      op: opacity * (0.6 + Math.random() * 0.8),
    }));
  }, [types, count, opacity]);

  return (
    <>
      {ships.map((s) => {
        const ship = SHIPS[s.type];
        if (!ship) return null;
        return (
          <div key={s.id} style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size * 0.6,
            opacity: s.op,
            transform: `rotate(${s.rotation}deg)`,
            animation: `shipDrift ${s.duration}s ${s.delay}s ease-in-out infinite`,
            pointerEvents: "none",
            zIndex: 1,
          }}>
            <svg viewBox={ship.viewBox} width="100%" height="100%">
              {ship.paths.map((d, i) => (
                <path key={i} d={d} fill={color} />
              ))}
            </svg>
          </div>
        );
      })}
    </>
  );
};

export default ShipSilhouettes;
