import { newId, nowIso } from '@/shared/lib/utils'
import type { Application, Commission, CommissionRule } from '@/shared/types'

// AD-4 / AD-11: commission is computed ONLY here. The Disbursed transition
// snapshots it; totals derive from records, never re-running this.

export type ComputeResult =
  | { kind: 'ok'; amount: number; basis: CommissionRule['basis']; rate: number }
  | { kind: 'no-rule' }

export function computeCommission(rule: CommissionRule | undefined, disbursed: number): ComputeResult {
  if (!rule || !rule.value || rule.value <= 0) return { kind: 'no-rule' }
  let amount = rule.basis === 'Percentage' ? (disbursed * rule.value) / 100 : rule.value
  if (rule.min != null) amount = Math.max(amount, rule.min)
  if (rule.max != null) amount = Math.min(amount, rule.max)
  return { kind: 'ok', amount: Math.round(amount), basis: rule.basis, rate: rule.value }
}

/** Build the snapshot record at first Disbursed entry (AD-11). */
export function buildCommissionSnapshot(
  app: Application,
  disbursed: number,
  result: Extract<ComputeResult, { kind: 'ok' }>,
): Commission {
  return {
    id: newId(),
    applicationId: app.id,
    payeeAgentId: app.createdBy,
    basis: result.basis,
    rate: result.rate,
    base: disbursed,
    computedAmount: result.amount,
    effectiveAmount: result.amount,
    computedAt: nowIso(),
  }
}

export function ruleFor(rules: CommissionRule[], loanType: Application['loanType']): CommissionRule | undefined {
  return rules.find((r) => r.loanType === loanType)
}
