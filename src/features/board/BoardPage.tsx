import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { cn } from '@/shared/lib/utils'
import { useStore } from '@/store/useStore'
import { useApplicationsForRole } from '@/store/selectors'
import { hasOpenIssue } from '@/domain/issues'
import { requiresData } from '@/domain/transition'
import { PIPELINE, statusColor, type AnyStatus, type Application, LOAN_TYPES } from '@/shared/types'
import { KanbanCard } from './KanbanCard'
import { BankLoginDialog, DisbursementDialog, ReasonDialog, SanctionDialog } from './transitionDialogs'
import { PayoutDialog } from '@/features/commission/PayoutDialog'
import { DetailSheet } from '@/features/application-detail/DetailSheet'
import { ListView } from './ListView'
import { colorClasses } from '@/shared/ui/StatusPill'
import { Input } from '@/shared/ui/primitives'
import { Icon } from '@/shared/ui/icons'
import { useToast } from '@/shared/ui/toast'

const COLUMNS: AnyStatus[] = [...PIPELINE, 'On Hold', 'Rejected']

export function BoardPage() {
  const role = useStore((s) => s.ui.role)
  const apps = useApplicationsForRole()
  const [params, setParams] = useSearchParams()
  const { toast } = useToast()

  const [view, setView] = useState<'board' | 'list'>('board')
  const [search, setSearch] = useState('')
  const [loanType, setLoanType] = useState('')
  const onlyIssues = params.get('filter') === 'issues'

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pending, setPending] = useState<{ app: Application; to: AnyStatus } | null>(null)
  const [noRule, setNoRule] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor))

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (a.status === 'Draft' && role === 'admin') return false
      if (search && !a.applicant.fullName.toLowerCase().includes(search.toLowerCase())) return false
      if (loanType && a.loanType !== loanType) return false
      if (onlyIssues && !hasOpenIssue(a)) return false
      return true
    })
  }, [apps, search, loanType, onlyIssues, role])

  const byColumn = useMemo(() => {
    const m = new Map<AnyStatus, Application[]>()
    for (const c of COLUMNS) m.set(c, [])
    // Drafts only show for GA — add a Draft column at front in that case
    if (role === 'general') m.set('Draft' as AnyStatus, [])
    for (const a of filtered) {
      if (!m.has(a.status)) m.set(a.status, [])
      m.get(a.status)!.push(a)
    }
    return m
  }, [filtered, role])

  const columns: AnyStatus[] = role === 'general' ? (['Draft', ...COLUMNS] as AnyStatus[]) : COLUMNS

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id as AnyStatus | undefined
    if (!overId) return
    const app = apps.find((a) => a.id === e.active.id)
    if (!app || app.status === overId) return

    const need = requiresData(overId)
    if (need) {
      setPending({ app, to: overId })
      return
    }
    if (overId === 'On Hold' || overId === 'Rejected') {
      setPending({ app, to: overId })
      return
    }
    const res = useStore.getState().moveStatus(app.id, overId)
    if (res.ok) toast({ tone: 'info', title: `Moved to ${overId}`, body: app.applicant.fullName })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <div className="flex rounded-[var(--radius-md)] bg-[var(--color-muted)] p-0.5">
            {(['board', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn('rounded-[6px] px-3 py-1 text-[13px] font-medium capitalize', view === v ? 'bg-white text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-muted-ink)]')}>{v}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon.Search width={15} height={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicant…" className="h-9 w-48 pl-8" />
          </div>
          <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="h-9 rounded-md border border-[var(--color-line)] bg-white px-2 text-[13px]">
            <option value="">All loan types</option>
            {LOAN_TYPES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            onClick={() => { const p = new URLSearchParams(params); if (onlyIssues) p.delete('filter'); else p.set('filter', 'issues'); setParams(p) }}
            className={cn('h-9 rounded-md border px-3 text-[13px] font-medium', onlyIssues ? 'border-amber-300 bg-[var(--color-warn-soft)] text-[var(--color-warn)]' : 'border-[var(--color-line)] bg-white text-[var(--color-muted-ink)]')}
          >
            Open issues
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <ListView apps={filtered} onOpen={(id) => setSelectedId(id)} />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto px-6 pb-6">
            {columns.map((col) => (
              <Column key={col} status={col} apps={byColumn.get(col) ?? []} draggable={role === 'admin' && col !== 'Draft'} onOpen={setSelectedId} />
            ))}
          </div>
        </DndContext>
      )}

      {/* Detail */}
      {selectedId && <DetailSheet id={selectedId} onClose={() => setSelectedId(null)} />}

      {/* Transition dialogs */}
      {pending?.to === 'Submitted to Bank' && <BankLoginDialog app={pending.app} onClose={() => setPending(null)} onDone={() => { setPending(null); toast({ tone: 'info', title: 'Logged in to bank' }) }} />}
      {pending?.to === 'Sanctioned' && <SanctionDialog app={pending.app} onClose={() => setPending(null)} onDone={() => { setPending(null); toast({ tone: 'success', title: 'Sanction recorded' }) }} />}
      {pending?.to === 'Disbursed' && <DisbursementDialog app={pending.app} onClose={() => setPending(null)} onNoRule={(m) => { setPending(null); setNoRule(m) }} onDone={(c) => { setPending(null); toast({ tone: 'success', title: 'Disbursed', body: c != null ? `Commission computed: ₹${c.toLocaleString('en-IN')}` : undefined }) }} />}
      {pending?.to === 'Closed' && <PayoutDialog app={pending.app} onClose={() => setPending(null)} onDone={() => setPending(null)} />}
      {(pending?.to === 'On Hold' || pending?.to === 'Rejected') && <ReasonDialog app={pending.app} to={pending.to} onClose={() => setPending(null)} onDone={() => { setPending(null); toast({ tone: pending.to === 'Rejected' ? 'danger' : 'info', title: pending.to === 'Rejected' ? 'Application rejected' : 'Put on hold' }) }} />}

      {noRule && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={() => setNoRule(null)}>
          <div className="max-w-sm rounded-[var(--radius-lg)] bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2 text-[var(--color-warn)]"><Icon.Alert /> <span className="font-semibold">No commission rule</span></div>
            <p className="text-sm text-[var(--color-muted-ink)]">{noRule} Set a rate in Settings → Commission rules, then disburse again.</p>
            <button onClick={() => setNoRule(null)} className="mt-4 w-full rounded-md bg-[var(--color-brand)] py-2 text-sm font-medium text-white">Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Column({ status, apps, draggable, onOpen }: { status: AnyStatus; apps: Application[]; draggable: boolean; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const c = colorClasses[statusColor(status)]
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn('h-2 w-2 rounded-full', c.dot)} />
        <span className="text-[13px] font-semibold">{status}</span>
        <span className="ml-auto rounded-full border border-[var(--color-line)] bg-white px-2 text-[11px] font-semibold text-[var(--color-muted-ink)] tnum">{apps.length}</span>
      </div>
      <div ref={setNodeRef} className={cn('flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--color-muted)] p-2.5 transition-colors', isOver && 'ring-2 ring-[var(--color-ring)]')}>
        {apps.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-md border border-dashed border-[var(--color-line)] py-6 text-[11px] text-slate-400">{draggable ? 'Drop here' : 'Empty'}</div>
        ) : (
          apps.map((a) => <KanbanCard key={a.id} app={a} draggable={draggable} onOpen={() => onOpen(a.id)} />)
        )}
      </div>
    </div>
  )
}
