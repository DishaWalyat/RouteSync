import type { ReactNode } from 'react'

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-sm ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-title" className="font-display text-2xl text-ink">
          {title}
        </h2>
        <div className="mt-4 text-sm text-ink">{children}</div>
      </div>
    </div>
  )
}
