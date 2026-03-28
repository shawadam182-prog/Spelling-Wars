import { useState } from "react";
import { isMuted, setMutedGlobal } from "../utils/audio.js";

const MuteBtn = () => {
  const [m, setM] = useState(isMuted());
  return (
    <button onClick={() => { const n = !m; setM(n); setMutedGlobal(n); }} style={{
      background: "none", border: "1px solid #333", borderRadius: 6,
      color: m ? "#666" : "#FFE066", fontSize: 14, padding: "3px 8px",
      cursor: "pointer", minWidth: 32,
    }} title={m ? "Unmute" : "Mute"}>
      {m ? "🔇" : "🔊"}
    </button>
  );
};

export default MuteBtn;
