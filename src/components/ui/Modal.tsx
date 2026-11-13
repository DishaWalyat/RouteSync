import type { ReactNode } from 'react'
import { X } from 'lucide-react'

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-line bg-white p-6 sm:p-7 shadow-xl ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-line/60">
          <h2 id="modal-title" className="font-display text-2xl font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-paper hover:text-ink transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 text-sm text-ink">{children}</div>
      </div>
    </div>
  )
}
