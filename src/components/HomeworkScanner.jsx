import { useState, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import Stars from "./Stars";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const HomeworkScanner = ({ onWords, onClose }) => {
  const [step, setStep] = useState("capture"); // capture | scanning | confirm | error
  const [words, setWords] = useState([]);
  const [error, setError] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!GEMINI_KEY) {
      setError("Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env.local file.");
      setStep("error");
      return;
    }

    setStep("scanning");

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: file.type || "image/jpeg",
                  data: base64,
                },
              },
              {
                text: `Extract all English spelling words from this image. This is a child's spelling homework or word list. Return ONLY a JSON array of lowercase words, nothing else. Example: ["apple", "banana", "cherry"]. If you cannot find any words, return an empty array [].`,
              },
            ],
          },
        ],
      });

      const text = response.text.trim();
      // Parse JSON from response (handle markdown code blocks)
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError("No words detected in the image. Try a clearer photo.");
        setStep("error");
        return;
      }

      // Clean: lowercase, trim, deduplicate, limit to 15
      const clean = [...new Set(parsed.map((w) => String(w).toLowerCase().trim()).filter((w) => w.length >= 2))].slice(0, 15);
      if (clean.length === 0) {
        setError("No valid words detected. Try again.");
        setStep("error");
        return;
      }

      setWords(clean);
      setStep("confirm");
    } catch (err) {
      console.error("Scanner error:", err);
      setError(err.message || "Failed to scan image. Check your API key and try again.");
      setStep("error");
    }
  };

  const removeWord = (i) => setWords((w) => w.filter((_, j) => j !== i));

  const startEdit = (i) => {
    setEditIdx(i);
    setEditVal(words[i]);
  };

  const saveEdit = () => {
    if (editVal.trim()) {
      setWords((w) => w.map((v, i) => (i === editIdx ? editVal.trim().toLowerCase() : v)));
    }
    setEditIdx(null);
    setEditVal("");
  };

  const launch = () => {
    if (words.length >= 2) onWords(words);
  };

  // Capture step
  if (step === "capture") {
    return (
      <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Stars n={60} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "planetPulse 2s infinite" }}>📡</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#66CCFF", letterSpacing: 3, margin: 0 }}>INTERCEPT TRANSMISSION</h1>
          <p style={{ fontSize: 12, color: "#8888AA", marginTop: 8, lineHeight: 1.5 }}>
            Our scanners have detected an Imperial transmission containing secret codes.
            Photograph the transmission to decode the words within!
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <button onClick={() => fileRef.current?.click()} style={{
              padding: "14px 28px", fontSize: 14, fontWeight: 700, letterSpacing: 2,
              background: "#66CCFF15", border: "1px solid #66CCFF44", borderRadius: 10,
              color: "#66CCFF", cursor: "pointer",
            }}>
              📷 SCAN TRANSMISSION
            </button>
            <button onClick={onClose} style={{
              padding: "10px 20px", fontSize: 11, fontWeight: 600, letterSpacing: 1,
              background: "none", border: "1px solid #333", borderRadius: 8,
              color: "#666", cursor: "pointer",
            }}>
              ABORT MISSION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanning
  if (step === "scanning") {
    return (
      <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Stars n={40} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 48, animation: "bossPulse 1s infinite" }}>📡</div>
          <h2 style={{ fontSize: 18, color: "#66CCFF", letterSpacing: 3, marginTop: 16 }}>DECODING TRANSMISSION...</h2>
          <p style={{ fontSize: 11, color: "#8888AA", marginTop: 8 }}>Analysing Imperial codes...</p>
          <div style={{ width: 120, height: 3, background: "#1a1a2e", borderRadius: 2, margin: "16px auto", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", background: "#66CCFF", borderRadius: 2, animation: "scanPulse 1.5s infinite" }} />
          </div>
        </div>
        <style>{`@keyframes scanPulse { 0%,100% { width: 20%; margin-left: 0; } 50% { width: 80%; margin-left: 10%; } }`}</style>
      </div>
    );
  }

  // Error
  if (step === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Stars n={40} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, maxWidth: 380 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, color: "#EE6666", letterSpacing: 2 }}>TRANSMISSION CORRUPTED</h2>
          <p style={{ fontSize: 12, color: "#AA6666", marginTop: 8, lineHeight: 1.5 }}>{error}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button onClick={() => { setStep("capture"); setError(null); }} style={{
              padding: "10px 20px", fontSize: 12, fontWeight: 700,
              background: "#66CCFF15", border: "1px solid #66CCFF44", borderRadius: 8,
              color: "#66CCFF", cursor: "pointer",
            }}>TRY AGAIN</button>
            <button onClick={onClose} style={{
              padding: "10px 20px", fontSize: 12, fontWeight: 600,
              background: "none", border: "1px solid #333", borderRadius: 8,
              color: "#666", cursor: "pointer",
            }}>BACK</button>
          </div>
        </div>
      </div>
    );
  }

  // Confirm step
  return (
    <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "auto" }}>
      <Stars n={60} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, maxWidth: 420, width: "100%" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#44CC44", letterSpacing: 3 }}>TRANSMISSION DECODED</h2>
        <p style={{ fontSize: 11, color: "#8888AA", marginTop: 4 }}>
          {words.length} secret codes extracted. Tap a word to edit, or X to remove.
        </p>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {words.map((w, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#12122A", border: "1px solid #2a2a4a", borderRadius: 8,
              padding: "8px 12px",
            }}>
              <span style={{ fontSize: 11, color: "#666688", width: 20 }}>{i + 1}.</span>
              {editIdx === i ? (
                <input
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  autoFocus
                  style={{
                    flex: 1, background: "#0A0A18", border: "1px solid #66CCFF44",
                    borderRadius: 4, color: "#CCCCDD", fontSize: 14, padding: "4px 8px",
                    fontFamily: "monospace", outline: "none",
                  }}
                />
              ) : (
                <span
                  onClick={() => startEdit(i)}
                  style={{ flex: 1, fontSize: 14, color: "#CCCCDD", fontFamily: "monospace", textAlign: "left", cursor: "pointer" }}
                >
                  {w}
                </span>
              )}
              <button onClick={() => removeWord(i)} style={{
                background: "none", border: "none", color: "#EE666688", fontSize: 14, cursor: "pointer", padding: "2px 6px",
              }}>✗</button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={() => { setStep("capture"); setWords([]); }} style={{
            padding: "10px 18px", fontSize: 11, fontWeight: 600,
            background: "none", border: "1px solid #333", borderRadius: 8,
            color: "#666", cursor: "pointer",
          }}>RE-SCAN</button>
          <button onClick={launch} disabled={words.length < 2} style={{
            padding: "12px 28px", fontSize: 13, fontWeight: 700, letterSpacing: 2,
            background: words.length >= 2 ? "#44CC4415" : "#1a1a2e",
            border: `1px solid ${words.length >= 2 ? "#44CC4466" : "#333"}`,
            borderRadius: 8, color: words.length >= 2 ? "#44CC44" : "#444",
            cursor: words.length >= 2 ? "pointer" : "default",
          }}>▸ LAUNCH MISSION ({words.length} words)</button>
          <button onClick={onClose} style={{
            padding: "10px 18px", fontSize: 11, fontWeight: 600,
            background: "none", border: "1px solid #333", borderRadius: 8,
            color: "#666", cursor: "pointer",
          }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
};

export default HomeworkScanner;
