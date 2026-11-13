import { Link } from 'react-router-dom'

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm text-white">L</span>
      <span className="font-display text-2xl leading-none tracking-tight text-ink">LifeLog</span>
    </Link>
  )
}
