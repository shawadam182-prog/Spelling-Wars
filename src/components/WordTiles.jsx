import { useMemo } from "react";

/**
 * Wordle-style letter tiles for spelling feedback.
 * Before submit: neutral saber-colored tiles.
 * Correct: all tiles flash green.
 * Wrong: green (right letter + position), amber (right letter, wrong position), red (not in word).
 */
const WordTiles = ({ typed, word, result, saber }) => {
  const letters = typed ? typed.split("") : [];
  const target = word.toLowerCase();
  const maxLen = Math.max(word.length, letters.length);

  // Responsive sizing — scale down for long words
  const tileSize = maxLen > 10 ? 26 : maxLen > 7 ? 30 : 36;
  const fontSize = maxLen > 10 ? 13 : maxLen > 7 ? 15 : 18;
  const gap = maxLen > 10 ? 2 : 3;

  // Wordle colouring for wrong answers
  const tileColors = useMemo(() => {
    if (result !== "no") return null;
    const guess = typed.trim().toLowerCase();
    const colors = new Array(guess.length).fill("miss");
    const remaining = {};

    // Count target letter frequencies
    for (const ch of target) remaining[ch] = (remaining[ch] || 0) + 1;

    // Pass 1: exact matches
    for (let i = 0; i < guess.length; i++) {
      if (i < target.length && guess[i] === target[i]) {
        colors[i] = "exact";
        remaining[guess[i]]--;
      }
    }
    // Pass 2: present but wrong position
    for (let i = 0; i < guess.length; i++) {
      if (colors[i] === "exact") continue;
      if (remaining[guess[i]] > 0) {
        colors[i] = "present";
        remaining[guess[i]]--;
      }
    }
    return colors;
  }, [typed, target, result]);

  const bg = (i) => {
    if (!result) return "#1a1a2e";
    if (result === "ok") return "#2a6a2a";
    if (!tileColors?.[i]) return "#1a1a2e";
    if (tileColors[i] === "exact") return "#2a6a2a";
    if (tileColors[i] === "present") return "#8a6a1a";
    return "#4a1a1a";
  };

  const border = (i) => {
    if (!result) return `1px solid ${saber.c}44`;
    if (result === "ok") return "1px solid #44CC4466";
    if (!tileColors?.[i]) return "1px solid #33335544";
    if (tileColors[i] === "exact") return "1px solid #44CC4466";
    if (tileColors[i] === "present") return "1px solid #CCAA2266";
    return "1px solid #EE444466";
  };

  const color = (i) => {
    if (!result) return "#FFE066";
    if (result === "ok") return "#44CC44";
    if (!tileColors?.[i]) return "#666";
    if (tileColors[i] === "exact") return "#44CC44";
    if (tileColors[i] === "present") return "#FFCC44";
    return "#EE6666";
  };

  const tile = (ch, i, overrides = {}) => (
    <div key={i} style={{
      width: tileSize, height: tileSize, borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: overrides.bg || bg(i),
      border: overrides.border || border(i),
      animation: overrides.anim || (result ? `tileReveal .3s ${i * 0.06}s both` : "none"),
      transition: "background .3s, border .3s",
    }}>
      <span style={{
        fontSize, fontWeight: 800, fontFamily: "monospace", textTransform: "uppercase",
        color: overrides.color || color(i),
      }}>{ch}</span>
    </div>
  );

  return (
    <div style={{ textAlign: "center" }}>
      {/* Main tiles */}
      <div style={{ display: "flex", justifyContent: "center", gap, flexWrap: "wrap", minHeight: tileSize + 8 }}>
        {letters.length === 0
          ? word.split("").map((_, i) => tile("_", i, { bg: "#111118", border: "1px solid #222233", color: "#333", anim: "none" }))
          : letters.map((ch, i) => tile(ch, i))
        }
      </div>

      {/* Correct word shown below on wrong answer */}
      {result === "no" && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: "#AA666688", letterSpacing: 2, marginBottom: 4 }}>CORRECT SPELLING:</div>
          <div style={{ display: "flex", justifyContent: "center", gap }}>
            {word.split("").map((ch, i) => tile(ch, i, {
              bg: "#1a3a1a", border: "1px solid #44CC4444", color: "#44CC44",
              anim: `tileReveal .3s ${(letters.length + i) * 0.04}s both`,
            }))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordTiles;
