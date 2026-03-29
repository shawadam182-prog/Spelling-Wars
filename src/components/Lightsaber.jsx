const Lightsaber = ({ color = "#4A9EEA", glow = "#4A9EEA60", size = 100, horizontal = false, animated = false }) => {
  // Proportional sizing — blade is ~65% of total, handle ~35%
  const w = horizontal ? size : size * 0.22;
  const h = horizontal ? size * 0.22 : size;
  const id = `saber-${color.replace("#", "")}-${size}`;

  if (horizontal) {
    const handleW = size * 0.32;
    const bladeW = size * 0.65;
    const barH = h * 0.45;
    const glowH = h * 0.7;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <defs>
          <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id={`${id}-blade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#FFFFFFCC" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={`${id}-handle`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888" />
            <stop offset="50%" stopColor="#555" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>
        </defs>
        {/* Handle */}
        <rect x={0} y={h * 0.2} width={handleW} height={h * 0.6} rx={2} fill={`url(#${id}-handle)`} />
        {/* Grip lines */}
        {[0.3, 0.45, 0.6, 0.75].map((p) => (
          <line key={p} x1={handleW * 0.15} y1={h * p} x2={handleW * 0.85} y2={h * p} stroke="#222" strokeWidth={0.8} opacity={0.6} />
        ))}
        {/* Emitter ring */}
        <rect x={handleW - 3} y={h * 0.15} width={6} height={h * 0.7} rx={1} fill="#777" />
        {/* Activation button */}
        <circle cx={handleW * 0.5} cy={h * 0.5} r={h * 0.1} fill="#CC2222" />
        {/* Blade glow (behind) */}
        <rect x={handleW + 2} y={(h - glowH) / 2} width={bladeW} height={glowH} rx={glowH / 2}
          fill={color} opacity={0.3} filter={`url(#${id}-glow)`}
          style={animated ? { animation: "saberIgnite .4s ease-out" } : undefined} />
        {/* Blade core */}
        <rect x={handleW + 2} y={(h - barH) / 2} width={bladeW} height={barH} rx={barH / 2}
          fill={`url(#${id}-blade)`}
          style={animated ? { animation: "saberIgnite .4s ease-out" } : undefined} />
        {/* Blade tip glow */}
        <circle cx={handleW + 2 + bladeW} cy={h / 2} r={barH * 0.6} fill={color} opacity={0.15} filter={`url(#${id}-glow)`} />
      </svg>
    );
  }

  // Vertical (default)
  const handleH = size * 0.35;
  const bladeH = size * 0.62;
  const barW = w * 0.4;
  const glowW = w * 0.7;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id={`${id}-blade`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#FFFFFFCC" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={`${id}-handle`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#888" />
          <stop offset="50%" stopColor="#555" />
          <stop offset="100%" stopColor="#333" />
        </linearGradient>
      </defs>
      {/* Handle (bottom) */}
      <rect x={w * 0.15} y={h - handleH} width={w * 0.7} height={handleH} rx={2} fill={`url(#${id}-handle)`} />
      {/* Grip lines */}
      {[0.25, 0.4, 0.55, 0.7].map((p) => (
        <line key={p} x1={w * 0.2} y1={h - handleH + handleH * p} x2={w * 0.8} y2={h - handleH + handleH * p} stroke="#222" strokeWidth={0.8} opacity={0.6} />
      ))}
      {/* Emitter ring */}
      <rect x={w * 0.1} y={h - handleH - 4} width={w * 0.8} height={6} rx={1} fill="#777" />
      {/* Activation button */}
      <circle cx={w * 0.5} cy={h - handleH * 0.35} r={w * 0.1} fill="#CC2222" />
      {/* Blade glow (behind) */}
      <rect x={(w - glowW) / 2} y={2} width={glowW} height={bladeH} rx={glowW / 2}
        fill={color} opacity={0.3} filter={`url(#${id}-glow)`}
        style={animated ? { animation: "saberIgnite .4s ease-out" } : undefined} />
      {/* Blade core */}
      <rect x={(w - barW) / 2} y={4} width={barW} height={bladeH - 4} rx={barW / 2}
        fill={`url(#${id}-blade)`}
        style={animated ? { animation: "saberIgnite .4s ease-out" } : undefined} />
      {/* Blade tip glow */}
      <circle cx={w / 2} cy={4} r={barW * 0.6} fill={color} opacity={0.15} filter={`url(#${id}-glow)`} />
    </svg>
  );
};

export default Lightsaber;
