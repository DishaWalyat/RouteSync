import type { ReactNode } from 'react'

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {children && <div className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{children}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-16 text-center text-sm text-muted">{label}</p>
}
