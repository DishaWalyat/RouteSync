import type { ComponentType, ReactNode } from 'react'
import { Button } from './ui/Button.tsx'

export function EmptyState({
  title,
  description,
  children,
  actionLabel,
  onAction,
  icon: Icon,
}: {
  title: string
  description?: string
  children?: ReactNode
  actionLabel?: string
  onAction?: () => void
  icon?: ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white border border-line text-muted shadow-2xs">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted">{description}</p>}
      {children && <div className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{children}</div>}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-16 text-center text-sm text-muted">{label}</p>
}
