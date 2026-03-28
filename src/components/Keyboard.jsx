export const KB = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const Keyboard = ({ onKey, onDel, onSubmit, typed, result, saber }) => (
  <div style={{ width: "100%", maxWidth: 480, padding: "0 8px" }}>
    {KB.map((row, ri) => (
      <div key={ri} style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 3 }}>
        {row.map((k) => (
          <button key={k} onClick={() => onKey(k.toLowerCase())} style={{
            width: 34, height: 40, fontSize: 13, fontWeight: 600,
            background: "#0E0E1E",
            border: `1px solid ${saber.c}44`,
            borderRadius: 5, color: "#CCCCEE", cursor: "pointer",
            boxShadow: `0 0 4px ${saber.g}, inset 0 0 3px ${saber.c}11`,
            transition: "box-shadow .15s, transform .1s",
          }}>{k}</button>
        ))}
      </div>
    ))}
    <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 3 }}>
      <button onClick={onDel} style={{
        flex: 1, maxWidth: 110, height: 40, fontSize: 11, fontWeight: 600,
        background: "#1a0a0a", border: "1px solid #442222", borderRadius: 5,
        color: "#AA6666", cursor: "pointer", letterSpacing: 1,
      }}>◂ DELETE</button>
      <button onClick={onSubmit} disabled={!typed || !!result} style={{
        flex: 2, maxWidth: 220, height: 40, fontSize: 13, fontWeight: 700,
        background: typed && !result ? `${saber.c}22` : "#111118",
        border: `1px solid ${typed && !result ? saber.c + "66" : "#222"}`,
        borderRadius: 5, color: typed && !result ? "#FFE066" : "#444",
        cursor: typed && !result ? "pointer" : "default", letterSpacing: 2,
        boxShadow: typed && !result ? `0 0 10px ${saber.g}` : "none",
      }}>SUBMIT ▸</button>
    </div>
  </div>
);

export default Keyboard;
