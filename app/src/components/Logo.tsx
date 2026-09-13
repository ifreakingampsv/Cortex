export function CortexMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="sun-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6A03C" />
          <stop offset="100%" stopColor="#EF5A2E" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#sun-g)" />
      <path
        d="M 8 20 a 12 12 0 0 0 16.5 3.5 A 14 14 0 0 1 11.5 8.5 A 12 12 0 0 0 8 20 Z"
        fill="#FDE9DC"
        opacity="0.92"
      />
    </svg>
  )
}

export function CortexLogo({ size = 26, wordSize = 22 }: { size?: number; wordSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <CortexMark size={size} />
      <span className="font-bold tracking-tight text-stone-900" style={{ fontSize: wordSize }}>
        cortex
      </span>
    </span>
  )
}

export function SunCloudIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="sc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6A03C" />
          <stop offset="100%" stopColor="#EF5A2E" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="20" r="12" fill="url(#sc-g)" />
      <path
        d="M10 34c0-4.4 3.6-8 8-8 .8 0 1.6.1 2.3.4C22 23.9 24.8 22 28 22c4.4 0 8 3.6 8 8 0 .5 0 1-.1 1.4 2.4.9 4.1 3.1 4.1 5.6H12c-1.1 0-2-.9-2-3z"
        fill="#fff"
      />
    </svg>
  )
}
