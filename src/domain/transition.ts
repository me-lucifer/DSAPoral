import { newId, nowIso } from '@/shared/lib/utils'
import { PIPELINE, type AnyStatus, type Status } from '@/shared/types'
import type {
  Application,
  BankLoginInfo,
  CommissionRule,
  DisbursementInfo,
  SanctionInfo,
  StatusEvent,
} from '@/shared/types'
import { buildCommissionSnapshot, computeCommission, ruleFor } from './commission'

// AD-3 / AD-13: the single transition path. Sole writer of StatusEvent.
// All status changes (gates, free moves, On Hold, Resume, Rejected) go here.

export interface TransitionPayload {
  note?: string
  bankLogin?: BankLoginInfo
  sanction?: SanctionInfo
  disbursement?: DisbursementInfo
  rejectionReason?: string
  holdReason?: string
}

export interface TransitionContext {
  rules: CommissionRule[]
  actorRole: 'admin' | 'general' | 'system'
}

export type TransitionResult =
  | { ok: true; application: Application }
  | { ok: false; reason: 'no-rule'; message: string }
  | { ok: false; reason: 'blocked'; message: string }

function stamp(app: Application, to: AnyStatus, actorRole: StatusEvent['actorRole'], note?: string): StatusEvent {
  return { id: newId(), from: app.status, to, actorRole, at: nowIso(), note }
}

/** Which status, if dropped onto, requires data (AD-3 / FR-E3). */
export function requiresData(to: AnyStatus): null | 'bankLogin' | 'sanction' | 'disbursement' | 'payout' {
  if (to === 'Submitted to Bank') return 'bankLogin'
  if (to === 'Sanctioned') return 'sanction'
  if (to === 'Disbursed') return 'disbursement'
  if (to === 'Closed') return 'payout'
  return null
}

export function pipelineIndex(s: AnyStatus): number {
  return PIPELINE.indexOf(s as Status)
}

/** Is moving from→to a "backward" pipeline move? */
export function isBackward(from: AnyStatus, to: AnyStatus): boolean {
  const fi = pipelineIndex(from)
  const ti = pipelineIndex(to)
  return fi >= 0 && ti >= 0 && ti < fi
}

/** Is the forward jump non-adjacent (illogical) — used for soft-confirm. */
export function isIllogicalJump(from: AnyStatus, to: AnyStatus): boolean {
  const fi = pipelineIndex(from)
  const ti = pipelineIndex(to)
  if (fi < 0 || ti < 0) return false
  return ti - fi > 1
}

export function transition(
  app: Application,
  to: AnyStatus,
  payload: TransitionPayload,
  ctx: TransitionContext,
): TransitionResult {
  const next: Application = { ...app, statusHistory: [...app.statusHistory], updatedAt: nowIso() }

  // On Hold — record prior status (AD-13)
  if (to === 'On Hold') {
    next.priorStatus = (app.status as Status) ?? null
    next.holdReason = payload.holdReason
  }

  // Rejected — terminal; auto-close any open issue (FR-D4)
  if (to === 'Rejected') {
    next.rejectionReason = payload.rejectionReason
    next.issues = app.issues.map((i) => (i.state !== 'Resolved' ? { ...i, state: 'Resolved' as const, resolvedAt: nowIso() } : i))
  }

  // Data-required gates
  if (to === 'Submitted to Bank') {
    if (payload.bankLogin) next.bankLogin = payload.bankLogin
  }
  if (to === 'Sanctioned') {
    if (payload.sanction) next.sanction = payload.sanction
  }
  if (to === 'Disbursed') {
    if (payload.disbursement) {
      next.disbursement = payload.disbursement
      next.disbursedToApplicant = { amount: payload.disbursement.amount, date: payload.disbursement.date }
      // AD-11: snapshot commission only on FIRST entry to Disbursed
      if (!next.commission) {
        const rule = ruleFor(ctx.rules, app.loanType)
        const result = computeCommission(rule, payload.disbursement.amount)
        if (result.kind === 'no-rule') {
          return { ok: false, reason: 'no-rule', message: `No commission rule configured for ${app.loanType} — set a rate in Settings.` }
        }
        next.commission = buildCommissionSnapshot(next, payload.disbursement.amount, result)
      }
    }
  }

  next.statusHistory.push(stamp(app, to, ctx.actorRole, payload.note))
  next.status = to
  return { ok: true, application: next }
}

/** Resume from On Hold → restore priorStatus (AD-13). */
export function resume(app: Application, ctx: TransitionContext): TransitionResult {
  const back = app.priorStatus ?? 'Bank Processing'
  const next: Application = {
    ...app,
    status: back,
    priorStatus: null,
    holdReason: undefined,
    updatedAt: nowIso(),
    statusHistory: [...app.statusHistory, stamp(app, back, ctx.actorRole, 'Resumed from hold')],
  }
  return { ok: true, application: next }
}
