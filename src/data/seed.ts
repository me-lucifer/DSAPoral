import { daysAgoIso, newId } from '@/shared/lib/utils'
import { DEFAULT_DOC_SLOTS } from '@/shared/types'
import type {
  Agent,
  AnyStatus,
  Application,
  Bank,
  Commission,
  CommissionRule,
  DataPartition,
  DocumentMeta,
  LoanType,
  Payout,
  Root,
  StatusEvent,
} from '@/shared/types'

// AD-8: the single source of demo content. Back-dated timestamps so the
// board looks lived-in (FR-I3).

const AGENTS: Agent[] = [
  { id: 'agent-amit', name: 'Amit Sharma', code: 'DSA-001', contact: '98200 11111' },
  { id: 'agent-priya', name: 'Priya Nair', code: 'DSA-002', contact: '98200 22222' },
  { id: 'agent-rahul', name: 'Rahul Verma', code: 'DSA-003', contact: '98200 33333' },
]

const BANKS: Bank[] = [
  { id: 'bank-hdfc', name: 'HDFC Bank' },
  { id: 'bank-sbi', name: 'State Bank of India' },
  { id: 'bank-icici', name: 'ICICI Bank' },
  { id: 'bank-axis', name: 'Axis Bank' },
  { id: 'bank-kotak', name: 'Kotak Mahindra Bank' },
]

const RULES: CommissionRule[] = [
  { loanType: 'Personal', basis: 'Percentage', value: 2.0 },
  { loanType: 'Home', basis: 'Percentage', value: 0.5 },
  { loanType: 'Business', basis: 'Percentage', value: 1.5 },
  { loanType: 'Auto', basis: 'Percentage', value: 1.0 },
]

function doc(slot: string, name: string): DocumentMeta {
  return {
    id: newId(),
    slot,
    name,
    mime: name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    size: 120000 + Math.floor(name.length * 3137),
    uploadedAt: daysAgoIso(10),
    uploadedByRole: 'general',
  }
}

function history(pairs: Array<[AnyStatus | null, AnyStatus, number]>): StatusEvent[] {
  return pairs.map(([from, to, daysAgo]) => ({
    id: newId(),
    from,
    to,
    actorRole: from === null ? 'general' : 'admin',
    at: daysAgoIso(daysAgo),
  }))
}

interface AppSeed {
  loanType: LoanType
  status: AnyStatus
  name: string
  amount: number
  bankId: string
  createdBy: string
  daysOld: number
}

function baseApp(s: AppSeed): Application {
  const salaried = s.loanType !== 'Business'
  return {
    id: newId(),
    loanType: s.loanType,
    status: s.status,
    priorStatus: null,
    createdBy: s.createdBy,
    createdAt: daysAgoIso(s.daysOld),
    updatedAt: daysAgoIso(1),
    submittedAt: daysAgoIso(s.daysOld),
    applicant: {
      fullName: s.name,
      category: salaried ? 'Salaried' : 'Self-employed',
      pan: 'ABCDE1234F',
      aadhaar: '1234 5678 9012',
      mobile: '9820012345',
      email: s.name.split(' ')[0].toLowerCase() + '@example.com',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400001',
      dob: '1990-05-14',
    },
    employment: salaried
      ? { employerName: 'Acme Corp', netMonthlySalary: 85000, designation: 'Manager', experienceYears: 6 }
      : { businessName: s.name + ' Enterprises', businessNature: 'Trading', vintageYears: 7, annualTurnover: 4200000, gstNumber: '27ABCDE1234F1Z5' },
    loan: {
      amount: s.amount,
      tenureMonths: s.loanType === 'Home' ? 240 : 48,
      purpose: s.loanType === 'Home' ? 'Home purchase' : s.loanType === 'Business' ? 'Working capital' : s.loanType === 'Auto' ? 'New car' : 'Personal use',
      bankId: s.bankId,
    },
    bank: { accountNumber: '5012XXXX3456', ifsc: 'HDFC0001234', bankName: 'HDFC Bank', cibil: 760 },
    documents: [doc('pan', 'pan.pdf'), doc('aadhaar', 'aadhaar.pdf'), doc('bank_statement', 'statement.pdf')],
    statusHistory: [],
    issues: [],
  }
}

function buildSeedApplications(): { applications: Application[]; payouts: Payout[] } {
  const apps: Application[] = []
  const payouts: Payout[] = []

  // 1 — Submitted (awaiting review)
  const a1 = baseApp({ loanType: 'Business', status: 'Submitted', name: 'Rajesh Kumar', amount: 1200000, bankId: 'bank-hdfc', createdBy: 'agent-priya', daysOld: 1 })
  a1.statusHistory = history([[null, 'Submitted', 1]])
  apps.push(a1)

  // 2 — Under Review
  const a2 = baseApp({ loanType: 'Home', status: 'Under Review', name: 'Meena Iyer', amount: 4500000, bankId: 'bank-sbi', createdBy: 'agent-rahul', daysOld: 4 })
  a2.verified = false
  a2.statusHistory = history([[null, 'Submitted', 4], ['Submitted', 'Under Review', 2]])
  apps.push(a2)

  // 3 — Bank Processing WITH an open issue (Action Needed)
  const a3 = baseApp({ loanType: 'Personal', status: 'Bank Processing', name: 'Arjun Nair', amount: 650000, bankId: 'bank-icici', createdBy: 'agent-amit', daysOld: 7 })
  a3.verified = true
  a3.bankLogin = { date: daysAgoIso(5), reference: 'ICICI-LN-88231' }
  a3.statusHistory = history([[null, 'Submitted', 7], ['Submitted', 'Under Review', 6], ['Under Review', 'Submitted to Bank', 5], ['Submitted to Bank', 'Bank Processing', 4]])
  a3.issues = [
    {
      id: newId(),
      type: 'Pending Document',
      description: 'Bank requires the latest 6-month bank statement.',
      requestedSlots: ['bank_statement'],
      state: 'Open',
      raisedAt: daysAgoIso(2),
    },
  ]
  apps.push(a3)

  // 4 — On Hold (prior = Bank Processing)
  const a4 = baseApp({ loanType: 'Auto', status: 'On Hold', name: 'Fatima Sheikh', amount: 800000, bankId: 'bank-axis', createdBy: 'agent-priya', daysOld: 9 })
  a4.priorStatus = 'Bank Processing'
  a4.verified = true
  a4.holdReason = 'Applicant travelling; resume next week.'
  a4.bankLogin = { date: daysAgoIso(6), reference: 'AXIS-LN-55012' }
  a4.statusHistory = history([[null, 'Submitted', 9], ['Submitted', 'Under Review', 8], ['Under Review', 'Submitted to Bank', 6], ['Submitted to Bank', 'Bank Processing', 5], ['Bank Processing', 'On Hold', 3]])
  apps.push(a4)

  // 5 — Sanctioned
  const a5 = baseApp({ loanType: 'Business', status: 'Sanctioned', name: 'Vikram Patel', amount: 2000000, bankId: 'bank-kotak', createdBy: 'agent-rahul', daysOld: 12 })
  a5.verified = true
  a5.bankLogin = { date: daysAgoIso(10), reference: 'KOTAK-LN-22119' }
  a5.sanction = { amount: 2000000, interestRate: 9.4, tenureMonths: 60, date: daysAgoIso(1), bankId: 'bank-kotak' }
  a5.statusHistory = history([[null, 'Submitted', 12], ['Submitted', 'Under Review', 11], ['Under Review', 'Submitted to Bank', 10], ['Submitted to Bank', 'Bank Processing', 8], ['Bank Processing', 'Sanctioned', 1]])
  apps.push(a5)

  // 6 — Disbursed, commission COMPUTED but payout PENDING (Amit) → ledger pending > 0
  const a6 = baseApp({ loanType: 'Personal', status: 'Disbursed', name: 'Sneha Reddy', amount: 300000, bankId: 'bank-hdfc', createdBy: 'agent-amit', daysOld: 16 })
  a6.verified = true
  a6.bankLogin = { date: daysAgoIso(13), reference: 'HDFC-LN-77450' }
  a6.sanction = { amount: 300000, interestRate: 11.5, tenureMonths: 36, date: daysAgoIso(4), bankId: 'bank-hdfc' }
  a6.disbursement = { amount: 300000, date: daysAgoIso(2) }
  a6.disbursedToApplicant = { amount: 300000, date: daysAgoIso(2) }
  const c6: Commission = {
    id: newId(),
    applicationId: a6.id,
    payeeAgentId: 'agent-amit',
    basis: 'Percentage',
    rate: 2.0,
    base: 300000,
    computedAmount: 6000,
    effectiveAmount: 6000,
    computedAt: daysAgoIso(2),
  }
  a6.commission = c6
  a6.statusHistory = history([[null, 'Submitted', 16], ['Submitted', 'Under Review', 15], ['Under Review', 'Submitted to Bank', 13], ['Submitted to Bank', 'Bank Processing', 11], ['Bank Processing', 'Sanctioned', 4], ['Sanctioned', 'Disbursed', 2]])
  apps.push(a6)

  // 7 — Closed, commission PAID (Amit)
  const a7 = baseApp({ loanType: 'Home', status: 'Closed', name: 'Deepak Joshi', amount: 4000000, bankId: 'bank-sbi', createdBy: 'agent-amit', daysOld: 30 })
  a7.verified = true
  a7.bankLogin = { date: daysAgoIso(26), reference: 'SBI-LN-31002' }
  a7.sanction = { amount: 4000000, interestRate: 8.6, tenureMonths: 240, date: daysAgoIso(12), bankId: 'bank-sbi' }
  a7.disbursement = { amount: 4000000, date: daysAgoIso(8) }
  a7.disbursedToApplicant = { amount: 4000000, date: daysAgoIso(8) }
  const c7: Commission = {
    id: newId(),
    applicationId: a7.id,
    payeeAgentId: 'agent-amit',
    basis: 'Percentage',
    rate: 0.5,
    base: 4000000,
    computedAmount: 20000,
    effectiveAmount: 20000,
    computedAt: daysAgoIso(8),
  }
  a7.commission = c7
  const p7: Payout = {
    id: newId(),
    applicationId: a7.id,
    agentId: 'agent-amit',
    amount: 20000,
    mode: 'NEFT / Bank Transfer',
    date: daysAgoIso(6),
    reference: 'NEFT-9920183',
    tds: 1000,
    status: 'Paid',
    createdAt: daysAgoIso(6),
  }
  payouts.push(p7)
  a7.statusHistory = history([[null, 'Submitted', 30], ['Submitted', 'Under Review', 28], ['Under Review', 'Submitted to Bank', 26], ['Submitted to Bank', 'Bank Processing', 22], ['Bank Processing', 'Sanctioned', 12], ['Sanctioned', 'Disbursed', 8], ['Disbursed', 'Closed', 6]])
  apps.push(a7)

  // 8 — A draft owned by Amit (drafts-to-finish on dashboard)
  const a8 = baseApp({ loanType: 'Personal', status: 'Draft', name: 'Sunita Rao', amount: 250000, bankId: 'bank-hdfc', createdBy: 'agent-amit', daysOld: 1 })
  a8.submittedAt = undefined
  a8.documents = [doc('pan', 'pan.pdf')]
  a8.statusHistory = []
  apps.push(a8)

  return { applications: apps, payouts }
}

export function buildSeedData(): DataPartition {
  const { applications, payouts } = buildSeedApplications()
  return {
    applications,
    agents: AGENTS,
    banks: BANKS,
    commissionRules: RULES,
    payouts,
    docSlots: DEFAULT_DOC_SLOTS,
    settings: { orgName: 'DSA Portal', currency: 'INR' },
    meta: { schemaVersion: 1 },
  }
}

export function freshRoot(): Root {
  return {
    data: buildSeedData(),
    ui: { role: null, activeAgentId: 'agent-amit' },
  }
}
