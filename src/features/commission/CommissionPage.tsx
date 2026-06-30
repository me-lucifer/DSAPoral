import { useStore } from '@/store/useStore'
import { useLedger } from '@/store/selectors'
import { formatDate, formatINR } from '@/shared/lib/utils'
import { Card, Chip, EmptyState } from '@/shared/ui/primitives'
import { Pill } from '@/shared/ui/StatusPill'

export function CommissionPage() {
  const role = useStore((s) => s.ui.role)
  const activeAgentId = useStore((s) => s.ui.activeAgentId)
  const agents = useStore((s) => s.data.agents)
  const { rows, totals } = useLedger(role === 'general' ? activeAgentId : null)
  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? '—'

  return (
    <div className="mx-auto max-w-5xl px-6 py-7">
      <h1 className="text-2xl font-semibold tracking-tight">Commission</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-ink)]">{role === 'admin' ? 'Across all agents.' : 'Your earnings.'}</p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <Total label="Earned" value={totals.earned} tone="text-[var(--color-ink)]" />
        <Total label="Paid" value={totals.paid} tone="text-[var(--color-success)]" />
        <Total label="Pending" value={totals.pending} tone="text-[var(--color-warn)]" />
      </div>

      <Card className="mt-6 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6"><EmptyState title="No commission yet" body="Commission appears here once an application is disbursed." /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-wide text-[var(--color-muted-ink)]">
                <th className="px-4 py-2.5 font-medium">Applicant</th>
                {role === 'admin' && <th className="px-4 py-2.5 font-medium">Agent</th>}
                <th className="px-4 py-2.5 font-medium">Loan</th>
                <th className="px-4 py-2.5 font-medium">Commission</th>
                <th className="px-4 py-2.5 font-medium">Payout</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.commission.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium">{r.application.applicant.fullName}</td>
                  {role === 'admin' && <td className="px-4 py-3 text-[var(--color-muted-ink)]">{agentName(r.agentId)}</td>}
                  <td className="px-4 py-3"><Chip>{r.application.loanType}</Chip></td>
                  <td className="px-4 py-3 tnum font-semibold">{formatINR(r.commission.effectiveAmount)}</td>
                  <td className="px-4 py-3">{r.payout ? <Pill tone={r.payout.status === 'Paid' ? 'success' : 'warn'}>{r.payout.status}</Pill> : <Pill tone="warn">Pending</Pill>}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-ink)]">{r.payout ? formatDate(r.payout.date) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function Total({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-[var(--color-muted-ink)]">{label}</p>
      <p className={`tnum mt-1.5 text-2xl font-semibold ${tone}`}>{formatINR(value)}</p>
    </Card>
  )
}
