import { useEffect, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icons'

export function Dialog({ open, onClose, title, description, children, footer, wide }: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative z-10 w-full animate-fade-in rounded-[var(--radius-lg)] bg-white shadow-xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-start justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink)]">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-[var(--color-muted-ink)]">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)]" aria-label="Close">
            <Icon.X width={18} height={18} />
          </button>
        </div>
        {children && <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>}
        {footer && <div className="flex justify-end gap-2 border-t border-[var(--color-line)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
