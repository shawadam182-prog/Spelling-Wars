const Nebula = ({ color = "#4A9EEA", color2, opacity = 0.07 }) => {
  const c2 = color2 || color;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "70vw", height: "50vh", left: "5%", top: "15%", background: `radial-gradient(ellipse, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}, transparent 70%)`, animation: "nebulaDrift 28s ease-in-out infinite", filter: "blur(50px)" }} />
      <div style={{ position: "absolute", width: "55vw", height: "45vh", right: "0", bottom: "5%", background: `radial-gradient(ellipse, ${c2}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, "0")}, transparent 70%)`, animation: "nebulaDrift2 22s ease-in-out infinite", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", width: "30vw", height: "30vh", left: "40%", top: "50%", background: `radial-gradient(ellipse, ${color}${Math.round(opacity * 0.4 * 255).toString(16).padStart(2, "0")}, transparent 70%)`, animation: "nebulaDrift 35s ease-in-out 5s infinite reverse", filter: "blur(45px)" }} />
    </div>
  );
};

export default Nebula;
