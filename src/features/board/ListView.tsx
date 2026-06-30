import { formatINR, relativeAge } from '@/shared/lib/utils'
import { StatusPill } from '@/shared/ui/StatusPill'
import { Chip, EmptyState } from '@/shared/ui/primitives'
import { hasOpenIssue } from '@/domain/issues'
import { useStore } from '@/store/useStore'
import type { Application } from '@/shared/types'

export function ListView({ apps, onOpen }: { apps: Application[]; onOpen: (id: string) => void }) {
  const banks = useStore((s) => s.data.banks)
  const bankName = (id?: string) => banks.find((b) => b.id === id)?.name ?? '—'

  if (apps.length === 0)
    return <div className="px-6 pb-6"><EmptyState title="Nothing here yet" body="No applications match your filters." /></div>

  return (
    <div className="flex-1 overflow-auto px-6 pb-6">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-[12px] uppercase tracking-wide text-[var(--color-muted-ink)]">
            <th className="border-b border-[var(--color-line)] px-3 py-2 font-medium">Applicant</th>
            <th className="border-b border-[var(--color-line)] px-3 py-2 font-medium">Loan</th>
            <th className="border-b border-[var(--color-line)] px-3 py-2 font-medium">Amount</th>
            <th className="border-b border-[var(--color-line)] px-3 py-2 font-medium">Bank</th>
            <th className="border-b border-[var(--color-line)] px-3 py-2 font-medium">Status</th>
            <th className="border-b border-[var(--color-line)] px-3 py-2 font-medium">Age</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id} onClick={() => onOpen(a.id)} className="cursor-pointer hover:bg-[var(--color-muted)]">
              <td className="border-b border-[var(--color-line)] px-3 py-2.5 font-medium">
                {a.applicant.fullName || 'Untitled'}
                {hasOpenIssue(a) && <span className="ml-2 rounded bg-[var(--color-warn-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-warn)]">Action needed</span>}
              </td>
              <td className="border-b border-[var(--color-line)] px-3 py-2.5"><Chip>{a.loanType}</Chip></td>
              <td className="border-b border-[var(--color-line)] px-3 py-2.5 tnum font-semibold">{formatINR(a.loan.amount)}</td>
              <td className="border-b border-[var(--color-line)] px-3 py-2.5 text-[var(--color-muted-ink)]">{bankName(a.loan.bankId)}</td>
              <td className="border-b border-[var(--color-line)] px-3 py-2.5"><StatusPill status={a.status} /></td>
              <td className="border-b border-[var(--color-line)] px-3 py-2.5 text-[var(--color-muted-ink)]">{relativeAge(a.statusHistory[a.statusHistory.length - 1]?.at ?? a.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
