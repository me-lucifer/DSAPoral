import { useEffect, type ReactNode } from 'react'
import { Icon } from './icons'

export function Sheet({ open, onClose, title, subtitle, children, headerExtra }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  headerExtra?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[560px] animate-sheet-in flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[var(--color-line)] px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
            {subtitle && <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-ink)]">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button onClick={onClose} className="rounded-md p-1.5 text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)]" aria-label="Close">
              <Icon.X />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
