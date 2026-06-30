import type { LoanType } from './enums'

/** Canonical document-slot registry (AD-14). The ONE source of slot keys
 *  used by the form, review gate, issue requests, and completeness meter. */
export interface DocSlot {
  key: string
  label: string
  mandatory: boolean
  loanTypes: LoanType[] // which loan types require/offer this slot
}

const ALL: LoanType[] = ['Personal', 'Home', 'Business', 'Auto']

export const DEFAULT_DOC_SLOTS: DocSlot[] = [
  { key: 'pan', label: 'PAN Card', mandatory: true, loanTypes: ALL },
  { key: 'aadhaar', label: 'Aadhaar Card', mandatory: true, loanTypes: ALL },
  { key: 'photo', label: 'Passport Photograph', mandatory: true, loanTypes: ALL },
  { key: 'address_proof', label: 'Address Proof', mandatory: true, loanTypes: ALL },
  { key: 'salary_slips', label: 'Last 3 Salary Slips', mandatory: true, loanTypes: ['Personal', 'Home', 'Auto'] },
  { key: 'bank_statement', label: 'Bank Statement (6 months)', mandatory: true, loanTypes: ALL },
  { key: 'itr', label: 'ITR / Form-16', mandatory: false, loanTypes: ['Personal', 'Home', 'Business'] },
  { key: 'gst_returns', label: 'GST Returns', mandatory: true, loanTypes: ['Business'] },
  { key: 'business_proof', label: 'Business Proof (Shop & Est. / Trade Licence)', mandatory: true, loanTypes: ['Business'] },
  { key: 'property_docs', label: 'Property Documents', mandatory: true, loanTypes: ['Home'] },
  { key: 'vehicle_quote', label: 'Vehicle Quotation / Invoice', mandatory: true, loanTypes: ['Auto'] },
  { key: 'coapplicant_kyc', label: 'Co-applicant KYC', mandatory: false, loanTypes: ['Home'] },
]

export function slotsForLoanType(slots: DocSlot[], loanType: LoanType): DocSlot[] {
  return slots.filter((s) => s.loanTypes.includes(loanType))
}
