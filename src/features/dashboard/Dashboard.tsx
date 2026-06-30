import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { useApplicationsForRole, useLedger } from '@/store/selectors'
import { hasOpenIssue } from '@/domain/issues'
import { formatINR } from '@/shared/lib/utils'
import { Button, Card } from '@/shared/ui/primitives'
import { Icon } from '@/shared/ui/icons'
import { Pill } from '@/shared/ui/StatusPill'
import { PIPELINE } from '@/shared/types'

export function Dashboard() {
  const role = useStore((s) => s.ui.role)
  const activeAgentId = useStore((s) => s.ui.activeAgentId)
  const apps = useApplicationsForRole()
  const navigate = useNavigate()
  const ledger = useLedger(role === 'general' ? activeAgentId : null)

  const drafts = apps.filter((a) => a.status === 'Draft')
  const openIssues = apps.filter((a) => hasOpenIssue(a))
  const needsReview = apps.filter((a) => a.status === 'Submitted')

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {}
    for (const a of apps) m[a.status] = (m[a.status] ?? 0) + 1
    return m
  }, [apps])

  return (
    <div className="mx-auto max-w-6xl px-6 py-7">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{role === 'admin' ? 'Operations overview' : 'Your work'}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-ink)]">
            {role === 'admin' ? 'Everything moving through the pipeline.' : 'Applications you are handling and what needs you.'}
          </p>
        </div>
        {role === 'general' && (
          <Button onClick={() => navigate('/application/new')}>
            <Icon.Plus width={16} height={16} /> New application
          </Button>
        )}
      </div>

      {/* Action banner */}
      {role === 'general' && openIssues.length > 0 && (
        <button onClick={() => navigate('/board?filter=issues')} className="mb-5 flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-amber-200 bg-[var(--color-warn-soft)] px-4 py-3 text-left">
          <Icon.Alert width={18} height={18} className="text-[var(--color-warn)]" />
          <span className="text-sm font-medium text-[var(--color-warn)]">
            {openIssues.length} application{openIssues.length > 1 ? 's' : ''} need your action
          </span>
          <Icon.Chevron width={16} height={16} className="ml-auto text-[var(--color-warn)]" />
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === 'admin' ? (
          <>
            <Stat label="Needs review" value={needsReview.length} tone="info" onClick={() => navigate('/board')} />
            <Stat label="Open issues" value={openIssues.length} tone="warn" onClick={() => navigate('/board?filter=issues')} />
            <Stat label="In pipeline" value={apps.filter((a) => !['Closed', 'Rejected'].includes(a.status)).length} tone="neutral" onClick={() => navigate('/board')} />
            <Stat label="Commission released" value={formatINR(ledger.totals.paid)} tone="success" onClick={() => navigate('/commission')} />
          </>
        ) : (
          <>
            <Stat label="Active applications" value={apps.filter((a) => !['Closed', 'Rejected', 'Draft'].includes(a.status)).length} tone="info" onClick={() => navigate('/board')} />
            <Stat label="Drafts to finish" value={drafts.length} tone="neutral" onClick={() => navigate('/board')} />
            <Stat label="Action needed" value={openIssues.length} tone="warn" onClick={() => navigate('/board?filter=issues')} />
            <Stat label="Commission earned" value={formatINR(ledger.totals.earned)} tone="success" onClick={() => navigate('/commission')} />
          </>
        )}
      </div>

      {/* Pipeline mini-bar */}
      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink)]">Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {PIPELINE.map((st) => (
            <button key={st} onClick={() => navigate('/board')} className="flex items-center gap-2 rounded-md border border-[var(--color-line)] px-3 py-1.5 text-[13px] hover:bg-[var(--color-muted)]">
              <Pill tone={st === 'Closed' || st === 'Disbursed' || st === 'Sanctioned' ? 'success' : ['Under Review', 'Submitted to Bank', 'Bank Processing'].includes(st) ? 'info' : 'neutral'}>{st}</Pill>
              <span className="tnum font-semibold">{byStatus[st] ?? 0}</span>
            </button>
          ))}
        </div>
      </Card>

      {role === 'general' && drafts.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 text-sm font-semibold">Resume a draft</h2>
          <div className="flex flex-col divide-y divide-[var(--color-line)]">
            {drafts.map((d) => (
              <button key={d.id} onClick={() => navigate(`/application/${d.id}/edit`)} className="flex items-center justify-between py-2.5 text-left hover:opacity-80">
                <span className="text-sm font-medium">{d.applicant.fullName || 'Untitled applicant'} · {d.loanType}</span>
                <span className="text-xs text-[var(--color-muted-ink)]">{formatINR(d.loan.amount)} →</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value, tone, onClick }: { label: string; value: number | string; tone: 'info' | 'warn' | 'success' | 'neutral'; onClick: () => void }) {
  const ring: Record<string, string> = {
    info: 'text-[var(--color-info)]',
    warn: 'text-[var(--color-warn)]',
    success: 'text-[var(--color-success)]',
    neutral: 'text-[var(--color-ink)]',
  }
  return (
    <button onClick={onClick} className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[13px] font-medium text-[var(--color-muted-ink)]">{label}</p>
      <p className={`tnum mt-2 text-3xl font-semibold ${ring[tone]}`}>{value}</p>
    </button>
  )
}
