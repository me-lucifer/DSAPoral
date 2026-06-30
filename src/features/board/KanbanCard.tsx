import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatINR, relativeAge } from '@/shared/lib/utils'
import { Chip } from '@/shared/ui/primitives'
import { Pill } from '@/shared/ui/StatusPill'
import { Icon } from '@/shared/ui/icons'
import { openIssue } from '@/domain/issues'
import { useAgent, useBankName } from '@/store/selectors'
import { useStore } from '@/store/useStore'
import type { Application } from '@/shared/types'

export function KanbanCard({ app, draggable, onOpen }: { app: Application; draggable: boolean; onOpen: () => void }) {
  const issue = openIssue(app)
  const bank = useBankName(app.loan.bankId)
  const role = useStore((s) => s.ui.role)
  const agent = useAgent(app.createdBy)
  const accent = issue ? 'bg-[var(--color-warn)]' : app.status === 'On Hold' ? 'bg-[var(--color-slate-ink)]' : 'bg-[var(--color-brand)]'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id, disabled: !draggable })
  const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: 50 } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={onOpen}
      className={cn(
        'relative cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-3 pl-4 shadow-sm transition-shadow hover:shadow-md',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'scale-[1.02] shadow-lg',
      )}
    >
      <span className={cn('absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full', accent)} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight">{app.applicant.fullName || 'Untitled'}</p>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Chip>{app.loanType}</Chip>
        {bank !== '—' && <span className="truncate text-[11px] text-[var(--color-muted-ink)]">{bank}</span>}
      </div>
      <p className="tnum mt-2 text-sm font-bold">{formatINR(app.loan.amount)}</p>
      {role === 'admin' && agent && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-dashed border-[var(--color-line)] pt-2 text-[11px] text-[var(--color-muted-ink)]">
          <Icon.User width={12} height={12} className="shrink-0" />
          <span className="truncate font-medium text-[var(--color-ink)]">{agent.name}</span>
          {agent.contact && <span className="ml-auto shrink-0 tnum">{agent.contact}</span>}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-muted-ink)]">{relativeAge(app.statusHistory[app.statusHistory.length - 1]?.at ?? app.updatedAt)}</span>
        {issue ? (
          <Pill tone={issue.state === 'Responded' ? 'info' : 'warn'}>
            <Icon.Alert width={11} height={11} /> {issue.state === 'Responded' ? 'Responded' : 'Action needed'}
          </Pill>
        ) : app.status === 'On Hold' ? (
          <Pill tone="warn">On hold</Pill>
        ) : null}
      </div>
    </div>
  )
}
