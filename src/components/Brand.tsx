import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-[#5B4BD8] to-[#FF6433] text-white shadow-xs font-bold transition group-hover:scale-105">
        <Sparkles size={18} className="text-white" />
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
          LifeLog
        </span>
        <span className="rounded-full bg-accent-soft px-1.5 py-0.2 text-[10px] font-bold text-accent">
          EDU
        </span>
      </div>
    </Link>
  )
}
