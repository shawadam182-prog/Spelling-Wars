const HoloPanel = ({ children, color = "#4A9EEA", intensity = "normal", style = {}, borderRadius = 12 }) => {
  const alpha = intensity === "subtle" ? "06" : "0A";
  const borderAlpha = intensity === "subtle" ? "22" : "33";
  const glowSize = intensity === "subtle" ? 8 : 15;
  const scanlineAlpha = intensity === "subtle" ? "04" : "08";

  return (
    <div style={{
      position: "relative",
      background: `${color}${alpha}`,
      border: `1px solid ${color}${borderAlpha}`,
      borderRadius,
      boxShadow: `0 0 ${glowSize}px ${color}11, inset 0 0 ${glowSize}px ${color}06`,
      animation: "holoFlicker 4s ease-in-out infinite",
      overflow: "hidden",
      ...style,
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        borderRadius,
        background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}${scanlineAlpha} 2px, ${color}${scanlineAlpha} 4px)`,
        opacity: 0.5,
      }} />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};

export default HoloPanel;
