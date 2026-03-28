import { useState, useEffect } from "react";
import Stars from "./Stars";

const Login = ({ onLogin, loading }) => {
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Stars n={120} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, width: "100%", maxWidth: 420, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)", transition: "all .8s" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#4A9EEA", marginBottom: 12, fontFamily: "monospace" }}>A LONG TIME AGO IN A CLASSROOM FAR, FAR AWAY...</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#FFE066", margin: "0 0 4px", letterSpacing: 4, textShadow: "0 0 40px #FFE06633, 0 2px 0 #B8860B" }}>JEDI SPELLING</h1>
        <h2 style={{ fontSize: 16, fontWeight: 400, color: "#FFE06688", margin: 0, letterSpacing: 6 }}>ACADEMY</h2>
        <div style={{ margin: "24px auto", width: 200, height: 3, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 2, background: "linear-gradient(90deg,transparent,#4A9EEA,transparent)", boxShadow: "0 0 10px #4A9EEA44" }} />
        </div>
        <div style={{ background: "#0A0A1A", border: "1px solid #1a1a3a", borderRadius: 12, padding: 28, marginTop: 20 }}>
          <label style={{ display: "block", fontSize: 13, color: "#6666AA", letterSpacing: 2, marginBottom: 12, textAlign: "left" }}>IDENTIFY YOURSELF, YOUNG JEDI</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && onLogin(name)} placeholder="Enter your name..." disabled={loading} autoFocus style={{ width: "100%", padding: "14px 16px", fontSize: 18, background: "#060612", border: "1px solid #2a2a4a", borderRadius: 8, color: "#EEEEFF", outline: "none", letterSpacing: 1 }} onFocus={(e) => (e.target.style.borderColor = "#4A9EEA")} onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")} />
          <button onClick={() => name.trim() && onLogin(name)} disabled={!name.trim() || loading} style={{ width: "100%", marginTop: 16, padding: "14px 0", fontSize: 16, fontWeight: 700, letterSpacing: 3, background: name.trim() ? "linear-gradient(135deg,#4A9EEA22,#4A9EEA11)" : "#111122", border: name.trim() ? "1px solid #4A9EEA66" : "1px solid #222", borderRadius: 8, color: name.trim() ? "#FFE066" : "#444", cursor: name.trim() ? "pointer" : "default", transition: "all .3s" }}>{loading ? "CONNECTING TO THE FORCE..." : "BEGIN TRAINING"}</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
