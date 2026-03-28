import { useState, useEffect, useMemo, useRef } from "react";
import { LW } from "../data/words";
import { WS } from "../data/words";
import { sfx, sfxComboOk } from "../utils/audio";
import { saberBonus } from "../utils/helpers";
import Stars from "./Stars";
import Keyboard from "./Keyboard";
import WordTiles from "./WordTiles";

// Deterministic seeded random from date string
const seedRng = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) | 0;
    return ((h >>> 0) / 4294967296);
  };
};

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDailyWords = () => {
  const today = getTodayStr();
  const rng = seedRng(today);
  const allWords = LW.flat();
  // Fisher-Yates with seeded rng to pick 5
  const pool = [...allWords];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { words: pool.slice(0, 5), date: today };
};

const DailyChallenge = ({ profile, onComplete, onExit }) => {
  const { words, date } = useMemo(getDailyWords, []);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState([]);
  const [result, setResult] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const word = words[idx];

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Sentence for current word
  const sentence = useMemo(() => {
    const s = WS[word?.toLowerCase()];
    if (s) return s.replace(new RegExp(word, "gi"), "_______");
    return `The word is _______.`;
  }, [word]);

  const onKey = (k) => {
    if (result || done) return;
    sfx("key");
    if (k === "⌫") setInput((p) => p.slice(0, -1));
    else if (k === "⏎") submit();
    else setInput((p) => [...p, k]);
  };

  const submit = () => {
    if (input.length === 0 || result) return;
    const attempt = input.join("");
    const isCorrect = attempt.toLowerCase() === word.toLowerCase();
    setResult(isCorrect ? "ok" : "no");

    if (isCorrect) {
      sfxComboOk(correct);
      setCorrect((c) => c + 1);
    } else {
      sfx("hit");
    }

    setTimeout(() => {
      if (idx < words.length - 1) {
        setIdx((i) => i + 1);
        setInput([]);
        setResult(null);
      } else {
        clearInterval(timerRef.current);
        setDone(true);
      }
    }, isCorrect ? 800 : 1500);
  };

  const finish = () => {
    onComplete(correct, date);
  };

  if (done) {
    const perfect = correct === 5;
    const streak = profile.dailyStreak || 0;
    const crystals = correct >= 3 ? (perfect ? 5 : 3) : 1;
    return (
      <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Stars n={80} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{perfect ? "🌟" : correct >= 3 ? "✦" : "📖"}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#FFE066", letterSpacing: 4, margin: 0 }}>DAILY CHALLENGE</h1>
          <p style={{ fontSize: 11, color: "#8888AA", marginTop: 4, letterSpacing: 2 }}>{date}</p>

          <div style={{ marginTop: 20, display: "flex", gap: 16, justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: correct >= 4 ? "#44CC44" : correct >= 3 ? "#FFE066" : "#EE6666", fontFamily: "monospace" }}>{correct}/5</div>
              <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>CORRECT</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#66CCFF", fontFamily: "monospace" }}>{timer}s</div>
              <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>TIME</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#66CCFF", fontFamily: "monospace" }}>+{crystals}</div>
              <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>KYBER</div>
            </div>
          </div>

          {perfect && <p style={{ fontSize: 13, color: "#44CC44", marginTop: 12 }}>Perfect score! The Force is strong with you.</p>}

          <div style={{ marginTop: 16 }}>
            {words.map((w, i) => (
              <div key={i} style={{ fontSize: 13, color: i < correct ? "#44CC44" : "#EE6666", fontFamily: "monospace", margin: "3px 0" }}>
                {i < correct ? "✓" : "✗"} {w}
              </div>
            ))}
          </div>

          <button onClick={finish} style={{ marginTop: 20, padding: "12px 32px", fontSize: 14, fontWeight: 700, letterSpacing: 2, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>
            CLAIM REWARD
          </button>
        </div>
      </div>
    );
  }

  // Word display
  const displayChars = word ? word.split("") : [];
  const attempt = input.join("");

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", position: "relative" }}>
      <Stars n={60} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1a1a2e" }}>
        <button onClick={onExit} style={{ background: "none", border: "1px solid #333", borderRadius: 6, color: "#666", fontSize: 10, padding: "4px 10px", cursor: "pointer" }}>EXIT</button>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#FFE066", letterSpacing: 2 }}>DAILY CHALLENGE</div>
        <div style={{ fontSize: 12, color: "#66CCFF", fontFamily: "monospace" }}>{timer}s</div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "12px 0", position: "relative", zIndex: 10 }}>
        {words.map((_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: "50%",
            background: i < idx ? (i < correct ? "#44CC44" : "#EE6666") : i === idx ? "#FFE066" : "#2a2a4a",
            boxShadow: i === idx ? "0 0 8px #FFE06666" : "none",
            transition: "all .3s",
          }} />
        ))}
      </div>

      {/* Word number */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 10, padding: "4px 0" }}>
        <span style={{ fontSize: 10, color: "#8888AA", letterSpacing: 2 }}>WORD {idx + 1} OF 5</span>
      </div>

      {/* Sentence clue */}
      <div style={{ textAlign: "center", padding: "8px 20px", position: "relative", zIndex: 10 }}>
        <p style={{ fontSize: 13, color: "#CCCCDD", fontStyle: "italic", lineHeight: 1.5, maxWidth: 380, margin: "0 auto" }}>"{sentence}"</p>
      </div>

      {/* Word tiles */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10, padding: "10px 20px" }}>
        <WordTiles word={word} attempt={attempt} result={result} />

        {result === "no" && (
          <div style={{ marginTop: 10, fontSize: 14, color: "#EE6666", fontWeight: 700, animation: "shake .3s" }}>
            {word.toUpperCase()}
          </div>
        )}
        {result === "ok" && (
          <div style={{ marginTop: 10, fontSize: 14, color: "#44CC44", fontWeight: 700 }}>
            CORRECT!
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Keyboard onKey={onKey} result={result} word={result === "no" ? word : undefined} />
      </div>
    </div>
  );
};

export default DailyChallenge;
