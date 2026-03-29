import { useState, useEffect } from "react";
import Stars from "./Stars";
import Lightsaber from "./Lightsaber";
import HoloPanel from "./HoloPanel";

const Login = ({ onLogin, loading }) => {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("intro"); // intro -> title -> form

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("title"), 2800);
    const t2 = setTimeout(() => setPhase("form"), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const skip = () => { if (phase !== "form") setPhase("form"); };

  return (
    <div onClick={skip} style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", cursor: phase !== "form" ? "pointer" : "default" }}>
      <Stars n={120} />

      {/* Phase 1: "A long time ago..." */}
      {phase === "intro" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: "#4A9EEA", fontFamily: "monospace", textAlign: "center", lineHeight: 2.2, animation: "introFade 2.8s ease-in-out forwards" }}>
            A LONG TIME AGO<br />IN A CLASSROOM FAR, FAR AWAY....
          </div>
        </div>
      )}

      {/* Phase 2+3: Title + Form */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, width: "100%", maxWidth: 420, opacity: phase === "intro" ? 0 : 1, transition: "opacity .4s" }}>
        {/* Title block */}
        <div style={{ animation: phase === "title" || phase === "form" ? "titleReveal .8s ease-out forwards" : "none", marginBottom: 8 }}>
          {/* Crossed lightsabers behind title */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-30deg)", opacity: 0.2, pointerEvents: "none" }}>
              <Lightsaber color="#4A9EEA" glow="#4A9EEA60" size={160} horizontal />
            </div>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(30deg) scaleY(-1)", opacity: 0.2, pointerEvents: "none" }}>
              <Lightsaber color="#EE4444" glow="#EE444460" size={160} horizontal />
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: "#FFE066", margin: "0 0 2px", letterSpacing: 5, textShadow: "0 0 40px #FFE06644, 0 0 80px #FFE06622, 0 2px 0 #B8860B, 0 4px 0 #8B6914", position: "relative", zIndex: 2 }}>JEDI SPELLING</h1>
            <h2 style={{ fontSize: 18, fontWeight: 400, color: "#FFE06688", margin: 0, letterSpacing: 8, position: "relative", zIndex: 2 }}>ACADEMY</h2>
          </div>
        </div>

        {/* Lightsaber divider */}
        <div style={{ margin: "20px auto", display: "flex", justifyContent: "center" }}>
          <Lightsaber color="#4A9EEA" glow="#4A9EEA60" size={220} horizontal animated />
        </div>

        {/* Login form */}
        <div style={{ opacity: phase === "form" ? 1 : 0, transform: phase === "form" ? "translateY(0)" : "translateY(20px)", transition: "all .6s ease-out" }}>
          <HoloPanel color="#4A9EEA" style={{ padding: 28, marginTop: 8 }}>
            <label style={{ display: "block", fontSize: 13, color: "#6666AA", letterSpacing: 2, marginBottom: 12, textAlign: "left" }}>IDENTIFY YOURSELF, YOUNG JEDI</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && onLogin(name)} placeholder="Enter your name..." disabled={loading} autoFocus style={{ width: "100%", padding: "14px 16px", fontSize: 18, background: "#060612", border: "1px solid #2a2a4a", borderRadius: 8, color: "#EEEEFF", outline: "none", letterSpacing: 1 }} onFocus={(e) => (e.target.style.borderColor = "#4A9EEA")} onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")} />
            <button onClick={() => name.trim() && onLogin(name)} disabled={!name.trim() || loading} style={{ width: "100%", marginTop: 16, padding: "14px 0", fontSize: 16, fontWeight: 700, letterSpacing: 3, background: name.trim() ? "linear-gradient(135deg,#4A9EEA22,#4A9EEA11)" : "#111122", border: name.trim() ? "1px solid #4A9EEA66" : "1px solid #222", borderRadius: 8, color: name.trim() ? "#FFE066" : "#444", cursor: name.trim() ? "pointer" : "default", transition: "all .3s" }}>{loading ? "CONNECTING TO THE FORCE..." : "BEGIN TRAINING"}</button>
          </HoloPanel>
        </div>
      </div>
    </div>
  );
};

export default Login;
