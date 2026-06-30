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

  // ---- Additional volume so the board reads as a busy operation ----

  // Submitted
  const a9 = baseApp({ loanType: 'Personal', status: 'Submitted', name: 'Anita Desai', amount: 450000, bankId: 'bank-icici', createdBy: 'agent-priya', daysOld: 1 })
  a9.statusHistory = history([[null, 'Submitted', 1]])
  apps.push(a9)

  const a10 = baseApp({ loanType: 'Auto', status: 'Submitted', name: 'Karthik Menon', amount: 950000, bankId: 'bank-axis', createdBy: 'agent-rahul', daysOld: 2 })
  a10.statusHistory = history([[null, 'Submitted', 2]])
  apps.push(a10)

  // Under Review
  const a11 = baseApp({ loanType: 'Personal', status: 'Under Review', name: 'Pooja Gupta', amount: 550000, bankId: 'bank-hdfc', createdBy: 'agent-amit', daysOld: 3 })
  a11.statusHistory = history([[null, 'Submitted', 3], ['Submitted', 'Under Review', 1]])
  apps.push(a11)

  // Submitted to Bank
  const a12 = baseApp({ loanType: 'Business', status: 'Submitted to Bank', name: 'Imran Khan', amount: 1800000, bankId: 'bank-icici', createdBy: 'agent-priya', daysOld: 6 })
  a12.verified = true
  a12.bankLogin = { date: daysAgoIso(2), reference: 'ICICI-LN-90233' }
  a12.statusHistory = history([[null, 'Submitted', 6], ['Submitted', 'Under Review', 5], ['Under Review', 'Submitted to Bank', 2]])
  apps.push(a12)

  const a13 = baseApp({ loanType: 'Home', status: 'Submitted to Bank', name: 'Lakshmi Pillai', amount: 6500000, bankId: 'bank-sbi', createdBy: 'agent-rahul', daysOld: 8 })
  a13.verified = true
  a13.bankLogin = { date: daysAgoIso(3), reference: 'SBI-LN-44781' }
  a13.statusHistory = history([[null, 'Submitted', 8], ['Submitted', 'Under Review', 6], ['Under Review', 'Submitted to Bank', 3]])
  apps.push(a13)

  // Bank Processing
  const a14 = baseApp({ loanType: 'Personal', status: 'Bank Processing', name: 'Sanjay Mehta', amount: 700000, bankId: 'bank-kotak', createdBy: 'agent-amit', daysOld: 10 })
  a14.verified = true
  a14.bankLogin = { date: daysAgoIso(7), reference: 'KOTAK-LN-33442' }
  a14.statusHistory = history([[null, 'Submitted', 10], ['Submitted', 'Under Review', 9], ['Under Review', 'Submitted to Bank', 7], ['Submitted to Bank', 'Bank Processing', 5]])
  apps.push(a14)

  // Sanctioned
  const a15 = baseApp({ loanType: 'Auto', status: 'Sanctioned', name: 'Neha Kapoor', amount: 1100000, bankId: 'bank-axis', createdBy: 'agent-priya', daysOld: 13 })
  a15.verified = true
  a15.bankLogin = { date: daysAgoIso(11), reference: 'AXIS-LN-61290' }
  a15.sanction = { amount: 1100000, interestRate: 9.9, tenureMonths: 60, date: daysAgoIso(2), bankId: 'bank-axis' }
  a15.statusHistory = history([[null, 'Submitted', 13], ['Submitted', 'Under Review', 12], ['Under Review', 'Submitted to Bank', 11], ['Submitted to Bank', 'Bank Processing', 8], ['Bank Processing', 'Sanctioned', 2]])
  apps.push(a15)

  // Disbursed, commission pending (Rahul)
  const a16 = baseApp({ loanType: 'Business', status: 'Disbursed', name: 'Rohit Sinha', amount: 1500000, bankId: 'bank-hdfc', createdBy: 'agent-rahul', daysOld: 18 })
  a16.verified = true
  a16.bankLogin = { date: daysAgoIso(15), reference: 'HDFC-LN-50912' }
  a16.sanction = { amount: 1500000, interestRate: 10.5, tenureMonths: 48, date: daysAgoIso(5), bankId: 'bank-hdfc' }
  a16.disbursement = { amount: 1500000, date: daysAgoIso(3) }
  a16.disbursedToApplicant = { amount: 1500000, date: daysAgoIso(3) }
  a16.commission = { id: newId(), applicationId: a16.id, payeeAgentId: 'agent-rahul', basis: 'Percentage', rate: 1.5, base: 1500000, computedAmount: 22500, effectiveAmount: 22500, computedAt: daysAgoIso(3) }
  a16.statusHistory = history([[null, 'Submitted', 18], ['Submitted', 'Under Review', 17], ['Under Review', 'Submitted to Bank', 15], ['Submitted to Bank', 'Bank Processing', 12], ['Bank Processing', 'Sanctioned', 5], ['Sanctioned', 'Disbursed', 3]])
  apps.push(a16)

  // Closed, commission paid (Priya)
  const a17 = baseApp({ loanType: 'Personal', status: 'Closed', name: 'Anjali Rao', amount: 500000, bankId: 'bank-icici', createdBy: 'agent-priya', daysOld: 34 })
  a17.verified = true
  a17.bankLogin = { date: daysAgoIso(30), reference: 'ICICI-LN-21188' }
  a17.sanction = { amount: 500000, interestRate: 11.2, tenureMonths: 36, date: daysAgoIso(16), bankId: 'bank-icici' }
  a17.disbursement = { amount: 500000, date: daysAgoIso(12) }
  a17.disbursedToApplicant = { amount: 500000, date: daysAgoIso(12) }
  a17.commission = { id: newId(), applicationId: a17.id, payeeAgentId: 'agent-priya', basis: 'Percentage', rate: 2.0, base: 500000, computedAmount: 10000, effectiveAmount: 10000, computedAt: daysAgoIso(12) }
  payouts.push({ id: newId(), applicationId: a17.id, agentId: 'agent-priya', amount: 10000, mode: 'NEFT / Bank Transfer', date: daysAgoIso(9), reference: 'NEFT-7741920', tds: 500, status: 'Paid', createdAt: daysAgoIso(9) })
  a17.statusHistory = history([[null, 'Submitted', 34], ['Submitted', 'Under Review', 32], ['Under Review', 'Submitted to Bank', 30], ['Submitted to Bank', 'Bank Processing', 25], ['Bank Processing', 'Sanctioned', 16], ['Sanctioned', 'Disbursed', 12], ['Disbursed', 'Closed', 9]])
  apps.push(a17)

  // On Hold (Amit) — gives Amit an extra visible card too
  const a18 = baseApp({ loanType: 'Home', status: 'On Hold', name: 'Farhan Qureshi', amount: 5200000, bankId: 'bank-sbi', createdBy: 'agent-amit', daysOld: 11 })
  a18.priorStatus = 'Under Review'
  a18.holdReason = 'Awaiting property valuation report.'
  a18.statusHistory = history([[null, 'Submitted', 11], ['Submitted', 'Under Review', 9], ['Under Review', 'On Hold', 4]])
  apps.push(a18)

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
