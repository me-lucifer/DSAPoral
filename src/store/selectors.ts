import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { Application, Commission, Payout } from '@/shared/types'
import { useStore } from './useStore'

// AD-5: role/agent scoping is read-time. These derive views; storage isn't partitioned.

export function useApplicationsForRole(): Application[] {
  return useStore(
    useShallow((s) => {
      const { role, activeAgentId } = s.ui
      const apps = s.data.applications
      if (role === 'general') {
        return apps.filter((a) => a.createdBy === activeAgentId)
      }
      // admin: everything except drafts (FR-J2 / AD-5)
      return apps.filter((a) => a.status !== 'Draft')
    }),
  )
}

export function useApplication(id: string | undefined): Application | undefined {
  return useStore((s) => s.data.applications.find((a) => a.id === id))
}

export function useAgentName(agentId: string | null | undefined): string {
  return useStore((s) => s.data.agents.find((a) => a.id === agentId)?.name ?? '—')
}

export function useBankName(bankId: string | null | undefined): string {
  return useStore((s) => s.data.banks.find((b) => b.id === bankId)?.name ?? '—')
}

export interface LedgerTotals {
  earned: number
  paid: number
  pending: number
}

export interface LedgerRow {
  application: Application
  commission: Commission
  payout?: Payout
  agentId: string
}

/** Ledger derived ONLY from commission + payout records (AD-11).
 *  Selects stable raw arrays, then computes with useMemo to keep refs stable. */
export function useLedger(scopeToAgent: string | null): { rows: LedgerRow[]; totals: LedgerTotals } {
  const applications = useStore((s) => s.data.applications)
  const payouts = useStore((s) => s.data.payouts)
  return useMemo(() => {
    const rows: LedgerRow[] = applications
      .filter((a) => a.commission && (scopeToAgent ? a.commission.payeeAgentId === scopeToAgent : true))
      .map((a) => ({
        application: a,
        commission: a.commission!,
        payout: payouts.find((p) => p.applicationId === a.id),
        agentId: a.commission!.payeeAgentId,
      }))
      .sort((x, y) => (y.commission.computedAt > x.commission.computedAt ? 1 : -1))
    const earned = rows.reduce((sum, r) => sum + r.commission.effectiveAmount, 0)
    const paid = rows.reduce((sum, r) => sum + (r.payout?.status === 'Paid' ? r.payout.amount : 0), 0)
    return { rows, totals: { earned, paid, pending: earned - paid } }
  }, [applications, payouts, scopeToAgent])
}
