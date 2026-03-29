import { getSaber } from "../utils/helpers.js";

const ForceMeter = ({ cur, max, saberIdx }) => {
  const pct = Math.max(0, cur / max);
  const c = getSaber(saberIdx);
  const danger = cur <= 2;
  const bladeColor = danger ? "#EE4444" : c.c;
  const id = `fm-${saberIdx}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, animation: danger ? "dangerPulse 1.5s infinite" : "none" }}>
      <svg width="100%" height={22} viewBox="0 0 300 22" style={{ flex: 1 }}>
        <defs>
          <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id={`${id}-blade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#FFFFFFCC" />
            <stop offset="100%" stopColor={bladeColor} />
          </linearGradient>
          <linearGradient id={`${id}-handle`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#999" />
            <stop offset="40%" stopColor="#666" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>
        </defs>

        {/* Handle grip */}
        <rect x={0} y={4} width={28} height={14} rx={2} fill={`url(#${id}-handle)`} />
        {/* Grip texture lines */}
        <line x1={5} y1={7.5} x2={23} y2={7.5} stroke="#222" strokeWidth={0.7} />
        <line x1={5} y1={10.5} x2={23} y2={10.5} stroke="#222" strokeWidth={0.7} />
        <line x1={5} y1={13.5} x2={23} y2={13.5} stroke="#222" strokeWidth={0.7} />
        {/* Emitter ring */}
        <rect x={25} y={3} width={5} height={16} rx={1} fill="#888" />
        {/* Activation button */}
        <circle cx={14} cy={11} r={2.2} fill={danger ? "#EE4444" : "#CC2222"} />

        {/* Blade glow (wide, blurred) */}
        <rect x={30} y={3} width={Math.max(0, 264 * pct)} height={16} rx={8}
          fill={bladeColor} opacity={0.25} filter={`url(#${id}-glow)`}
          style={{ transition: "width .5s" }} />
        {/* Blade core (narrow, bright) */}
        <rect x={30} y={6} width={Math.max(0, 264 * pct)} height={10} rx={5}
          fill={`url(#${id}-blade)`}
          style={{ transition: "width .5s" }} />
        {/* Blade tip highlight */}
        {pct > 0.05 && (
          <circle cx={30 + 264 * pct} cy={11} r={4} fill={bladeColor} opacity={0.15} filter={`url(#${id}-glow)`}
            style={{ transition: "cx .5s" }} />
        )}
      </svg>
      <span style={{ fontSize: 12, color: danger ? "#EE4444" : "#AAB", fontFamily: "monospace", minWidth: 36, textAlign: "right" }}>{cur}/{max}</span>
    </div>
  );
};

export default ForceMeter;
