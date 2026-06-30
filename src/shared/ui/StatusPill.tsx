import { cn } from '@/shared/lib/utils'
import { statusColor, type AnyStatus, type ColorRole } from '@/shared/types'

export const colorClasses: Record<ColorRole, { pill: string; dot: string; text: string; soft: string }> = {
  neutral: { pill: 'bg-[var(--color-slate-soft)] text-[var(--color-slate-ink)]', dot: 'bg-[var(--color-slate-ink)]', text: 'text-[var(--color-slate-ink)]', soft: 'bg-[var(--color-slate-soft)]' },
  info: { pill: 'bg-[var(--color-info-soft)] text-[var(--color-info)]', dot: 'bg-[var(--color-info)]', text: 'text-[var(--color-info)]', soft: 'bg-[var(--color-info-soft)]' },
  success: { pill: 'bg-[var(--color-success-soft)] text-[var(--color-success)]', dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', soft: 'bg-[var(--color-success-soft)]' },
  warn: { pill: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]', dot: 'bg-[var(--color-warn)]', text: 'text-[var(--color-warn)]', soft: 'bg-[var(--color-warn-soft)]' },
  danger: { pill: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]', dot: 'bg-[var(--color-danger)]', text: 'text-[var(--color-danger)]', soft: 'bg-[var(--color-danger-soft)]' },
}

export function StatusPill({ status, className }: { status: AnyStatus; className?: string }) {
  const c = colorClasses[statusColor(status)]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', c.pill, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {status}
    </span>
  )
}

export function Pill({ tone, children, className }: { tone: ColorRole; children: React.ReactNode; className?: string }) {
  const c = colorClasses[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', c.pill, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {children}
    </span>
  )
}
