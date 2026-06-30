import { slotsForLoanType, type Application, type DocSlot } from '@/shared/types'

export interface ReqItem { key: string; label: string; ok: boolean; step: number }

/** Required-field + mandatory-doc set that gates submission (FR-B6/FR-C1). */
export function requirements(app: Application, docSlots: DocSlot[]): ReqItem[] {
  const a = app.applicant
  const e = app.employment
  const l = app.loan
  const b = app.bank
  const items: ReqItem[] = [
    { key: 'fullName', label: 'Full name', ok: !!a.fullName, step: 0 },
    { key: 'dob', label: 'Date of birth', ok: !!a.dob, step: 0 },
    { key: 'pan', label: 'PAN', ok: !!a.pan, step: 0 },
    { key: 'aadhaar', label: 'Aadhaar', ok: !!a.aadhaar, step: 0 },
    { key: 'mobile', label: 'Mobile', ok: !!a.mobile, step: 1 },
    { key: 'city', label: 'City', ok: !!a.city, step: 1 },
    { key: 'pin', label: 'PIN', ok: !!a.pin, step: 1 },
  ]
  if (a.category === 'Salaried') {
    items.push({ key: 'employerName', label: 'Employer name', ok: !!e.employerName, step: 2 })
    items.push({ key: 'netMonthlySalary', label: 'Net monthly salary', ok: !!e.netMonthlySalary, step: 2 })
  } else {
    items.push({ key: 'businessName', label: 'Business name', ok: !!e.businessName, step: 2 })
    items.push({ key: 'annualTurnover', label: 'Annual turnover', ok: !!e.annualTurnover, step: 2 })
  }
  items.push({ key: 'amount', label: 'Loan amount', ok: !!l.amount, step: 3 })
  items.push({ key: 'tenure', label: 'Tenure', ok: !!l.tenureMonths, step: 3 })
  items.push({ key: 'bankId', label: 'Preferred bank', ok: !!l.bankId, step: 3 })
  if (app.loanType === 'Home' || app.loanType === 'Auto') {
    items.push({ key: 'assetValue', label: 'Asset value', ok: !!l.assetValue, step: 3 })
    items.push({ key: 'downPayment', label: 'Down payment', ok: l.downPayment != null, step: 3 })
  }
  items.push({ key: 'accountNumber', label: 'Bank account no.', ok: !!b.accountNumber, step: 4 })
  items.push({ key: 'ifsc', label: 'IFSC', ok: !!b.ifsc, step: 4 })

  // mandatory documents
  const mandatory = slotsForLoanType(docSlots, app.loanType).filter((s) => s.mandatory)
  for (const slot of mandatory) {
    items.push({ key: `doc:${slot.key}`, label: slot.label, ok: app.documents.some((d) => d.slot === slot.key), step: 6 })
  }
  return items
}

export function completeness(items: ReqItem[]): { pct: number; missing: ReqItem[] } {
  const missing = items.filter((i) => !i.ok)
  const pct = items.length === 0 ? 0 : ((items.length - missing.length) / items.length) * 100
  return { pct, missing }
}
