import { cn, relativeAge } from '@/shared/lib/utils'
import { statusColor, type StatusEvent } from '@/shared/types'
import { colorClasses } from '@/shared/ui/StatusPill'

export function Timeline({ events }: { events: StatusEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-[var(--color-muted-ink)]">No history yet.</p>
  const ordered = [...events].reverse()
  return (
    <ol className="relative ml-1.5 space-y-3 border-l border-[var(--color-line)] pl-4">
      {ordered.map((e, i) => {
        const isStatusMove = e.from !== e.to
        const c = colorClasses[statusColor(e.to)]
        const current = i === 0
        return (
          <li key={e.id} className="relative">
            <span className={cn('absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white', current ? c.dot : 'bg-slate-300')} />
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm">
                {isStatusMove ? (
                  <span className="font-medium">{e.to}</span>
                ) : (
                  <span className="text-[var(--color-muted-ink)]">{e.note ?? 'Update'}</span>
                )}
                <span className="ml-2 text-[11px] capitalize text-[var(--color-muted-ink)]">{e.actorRole}</span>
              </p>
              <span className="shrink-0 text-[11px] text-[var(--color-muted-ink)]">{relativeAge(e.at)}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
