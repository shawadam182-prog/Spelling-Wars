import { useMemo } from "react";
import { sfx } from "../utils/audio.js";

export const KB = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const Keyboard = ({ onKey, onDel, onSubmit, typed, result, saber, word }) => {
  // After wrong answer, color keys based on whether they're in the word
  const keyColors = useMemo(() => {
    if (result !== "no" || !word) return null;
    const target = new Set(word.toLowerCase().split(""));
    const map = {};
    for (const row of KB) for (const k of row) {
      map[k] = target.has(k.toLowerCase()) ? "inWord" : "notInWord";
    }
    return map;
  }, [result, word]);

  const keyBg = (k) => {
    if (!keyColors) return "#0E0E1E";
    if (keyColors[k] === "inWord") return "#1a3a1a";
    if (keyColors[k] === "notInWord") return "#0a0a0e";
    return "#0E0E1E";
  };

  const keyBorder = (k) => {
    if (!keyColors) return `1px solid ${saber.c}44`;
    if (keyColors[k] === "inWord") return "1px solid #44CC4466";
    if (keyColors[k] === "notInWord") return "1px solid #222";
    return `1px solid ${saber.c}44`;
  };

  const keyColor = (k) => {
    if (!keyColors) return "#CCCCEE";
    if (keyColors[k] === "inWord") return "#44CC44";
    if (keyColors[k] === "notInWord") return "#444";
    return "#CCCCEE";
  };

  const handleKey = (k) => {
    sfx("key");
    onKey(k.toLowerCase());
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, padding: "0 8px" }}>
      {KB.map((row, ri) => (
        <div key={ri} style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 3 }}>
          {row.map((k) => (
            <button key={k} onClick={() => handleKey(k)}
              onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              style={{
                width: 38, height: 42, fontSize: 14, fontWeight: 600,
                background: keyBg(k),
                border: keyBorder(k),
                borderRadius: 5, color: keyColor(k), cursor: "pointer",
                boxShadow: `0 0 4px ${saber.g}, inset 0 0 3px ${saber.c}11`,
                transition: "box-shadow .15s, transform .08s, background .2s, color .2s",
              }}>{k}</button>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 3 }}>
        <button onClick={onDel} style={{
          flex: 1, maxWidth: 110, height: 42, fontSize: 11, fontWeight: 600,
          background: "#1a0a0a", border: "1px solid #442222", borderRadius: 5,
          color: "#AA6666", cursor: "pointer", letterSpacing: 1,
        }}>◂ DELETE</button>
        <button onClick={onSubmit} disabled={!typed || !!result} style={{
          flex: 2, maxWidth: 220, height: 42, fontSize: 13, fontWeight: 700,
          background: typed && !result ? `${saber.c}22` : "#111118",
          border: `1px solid ${typed && !result ? saber.c + "66" : "#222"}`,
          borderRadius: 5, color: typed && !result ? "#FFE066" : "#444",
          cursor: typed && !result ? "pointer" : "default", letterSpacing: 2,
          boxShadow: typed && !result ? `0 0 10px ${saber.g}` : "none",
        }}>SUBMIT ▸</button>
      </div>
    </div>
  );
};

export default Keyboard;
