import { Link } from 'react-router-dom'

export function RouteSyncLogo({
  theme = 'light',
  className = '',
  to,
}: {
  theme?: 'light' | 'dark'
  className?: string
  to?: string
}) {
  const isDark = theme === 'dark'

  const content = (
    <div className={`flex items-center gap-2.5 font-sans ${className}`}>
      {/* 3D Isometric Cube Icon matching the reference */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Top face */}
        <polygon points="16,2 29,9.5 16,17 3,9.5" fill="#3B82F6" />
        {/* Left face */}
        <polygon points="3,9.5 16,17 16,30 3,22.5" fill="#1D4ED8" />
        {/* Right face */}
        <polygon points="16,17 29,9.5 29,22.5 16,30" fill="#2563EB" />
        {/* Inner white cube outline/highlight */}
        <polyline points="3,9.5 16,17 29,9.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <line x1="16" y1="17" x2="16" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      </svg>
      <span
        className={`font-display text-xl font-extrabold tracking-tight ${
          isDark ? 'text-white' : 'text-[#0F172A]'
        }`}
      >
        RouteSync
      </span>
    </div>
  )

  if (to) {
    return <Link to={to} className="inline-block">{content}</Link>
  }

  return content
}

export function Brand({ theme = 'light', to }: { theme?: 'light' | 'dark'; to?: string }) {
  return <RouteSyncLogo theme={theme} to={to} />
}
