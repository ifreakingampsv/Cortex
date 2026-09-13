/**
 * Cortex brand marks — a glowing neural network: nodes and synapses
 * arranged in a brain silhouette, electric blue → violet → magenta.
 */

export function CortexMark({ size = 26 }: { size?: number }) {
  const nodes: [number, number][] = [
    [16, 4.5], [8.5, 9], [23.5, 9], [5.5, 16.5], [26.5, 16.5],
    [9.5, 24], [22.5, 24], [16, 15.5], [16, 27.5],
  ]
  const links: [number, number][] = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7],
    [7, 8], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 8], [6, 8],
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="cx-link" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <radialGradient id="cx-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#cx-glow)" />
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="url(#cx-link)" strokeWidth="1.1" strokeOpacity="0.85" strokeLinecap="round"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 7 ? 3.1 : 2.1} fill="url(#cx-link)" />
      ))}
      <circle cx="16" cy="15.5" r="1.3" fill="#EDE9FE" />
    </svg>
  )
}

export function CortexLogo({ size = 26, wordSize = 22 }: { size?: number; wordSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <CortexMark size={size} />
      <span className="font-display font-bold tracking-tight text-slate-100" style={{ fontSize: wordSize }}>
        cortex
      </span>
    </span>
  )
}

/** Larger synapse-cluster illustration for feature tiles. */
export function NeuralIcon({ size = 40 }: { size?: number }) {
  const nodes: [number, number][] = [
    [10, 8], [30, 6], [40, 18], [34, 32], [16, 36], [6, 24], [24, 20], [44, 34],
  ]
  const links: [number, number][] = [
    [0, 1], [0, 5], [1, 2], [1, 6], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2], [3, 7], [6, 3],
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 50 42" aria-hidden>
      <defs>
        <linearGradient id="ni-link" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="url(#ni-link)" strokeWidth="1.4" strokeOpacity="0.9" strokeLinecap="round" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 6 ? 3.6 : 2.5} fill="url(#ni-link)" />
      ))}
      <circle cx="24" cy="20" r="1.6" fill="#EDE9FE" />
    </svg>
  )
}
