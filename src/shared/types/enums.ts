// Canonical enums — PRD §13 glossary, verbatim (AD-7). No synonyms anywhere.

export const STATUSES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Submitted to Bank',
  'Bank Processing',
  'Sanctioned',
  'Disbursed',
  'Closed',
] as const
export type Status = (typeof STATUSES)[number]

// Off-pipeline statuses (set on a card; shown distinctly).
export const OFF_PIPELINE = ['On Hold', 'Rejected'] as const
export type OffPipelineStatus = (typeof OFF_PIPELINE)[number]

export type AnyStatus = Status | OffPipelineStatus

/** Pipeline columns shown left→right on the board. */
export const PIPELINE: Status[] = [...STATUSES]

export type IssueState = 'Open' | 'Responded' | 'Resolved'
export const ISSUE_TYPES = [
  'Pending Document',
  'Additional Information',
  'Clarification',
  'Other',
] as const
export type IssueType = (typeof ISSUE_TYPES)[number]

export const LOAN_TYPES = ['Personal', 'Home', 'Business', 'Auto'] as const
export type LoanType = (typeof LOAN_TYPES)[number]

export const APPLICANT_CATEGORIES = ['Salaried', 'Self-employed', 'Professional'] as const
export type ApplicantCategory = (typeof APPLICANT_CATEGORIES)[number]

export const COMMISSION_BASIS = ['Percentage', 'Flat'] as const
export type CommissionBasis = (typeof COMMISSION_BASIS)[number]

export const PAYMENT_MODES = ['NEFT / Bank Transfer', 'UPI', 'Cheque', 'Cash'] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export const PAYOUT_STATUS = ['Pending', 'Paid'] as const
export type PayoutStatus = (typeof PAYOUT_STATUS)[number]

export type Role = 'admin' | 'general'

/** Semantic color role per status — the Status Color Map (EXPERIENCE.md). */
export type ColorRole = 'neutral' | 'info' | 'success' | 'warn' | 'danger'

export function statusColor(status: AnyStatus): ColorRole {
  switch (status) {
    case 'Draft':
    case 'Submitted':
      return 'neutral'
    case 'Under Review':
    case 'Submitted to Bank':
    case 'Bank Processing':
      return 'info'
    case 'Sanctioned':
    case 'Disbursed':
    case 'Closed':
      return 'success'
    case 'On Hold':
      return 'warn'
    case 'Rejected':
      return 'danger'
    default:
      return 'neutral'
  }
}
