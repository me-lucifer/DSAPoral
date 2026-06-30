import type {
  AnyStatus,
  ApplicantCategory,
  CommissionBasis,
  IssueState,
  IssueType,
  LoanType,
  PaymentMode,
  PayoutStatus,
  Status,
} from './enums'

export interface DocumentMeta {
  id: string
  slot: string // DocSlot.key (AD-14)
  name: string
  mime: string
  size: number
  uploadedAt: string
  uploadedByRole: 'admin' | 'general'
}

export interface CoApplicant {
  kind: 'Co-applicant' | 'Guarantor'
  name?: string
  relationship?: string
  dob?: string
  occupation?: string
  income?: number
  pan?: string
}

export interface Applicant {
  fullName: string
  fatherSpouseName?: string
  dob?: string
  gender?: string
  maritalStatus?: string
  dependents?: number
  pan?: string
  aadhaar?: string
  category: ApplicantCategory
  // contact
  mobile?: string
  email?: string
  addressLine?: string
  city?: string
  district?: string
  state?: string
  pin?: string
  residenceType?: string
}

export interface Employment {
  // salaried
  employerName?: string
  employerCategory?: string
  designation?: string
  experienceYears?: number
  netMonthlySalary?: number
  // self-employed / business
  businessName?: string
  businessNature?: string
  constitution?: string
  vintageYears?: number
  annualTurnover?: number
  gstNumber?: string
  existingObligations?: number
}

export interface LoanDetails {
  amount?: number
  tenureMonths?: number
  purpose?: string
  bankId?: string
  // secured
  assetValue?: number
  downPayment?: number
  assetDescription?: string
}

export interface BankDetails {
  accountNumber?: string
  ifsc?: string
  bankName?: string
  accountType?: string
  cibil?: number
}

export interface StatusEvent {
  id: string
  from: AnyStatus | null
  to: AnyStatus
  actorRole: 'admin' | 'general' | 'system'
  at: string
  note?: string
}

export interface Issue {
  id: string
  type: IssueType
  description: string
  requestedSlots: string[] // DocSlot.key[]
  state: IssueState
  raisedAt: string
  respondedAt?: string
  resolvedAt?: string
  replyNote?: string
}

export interface SanctionInfo {
  amount: number
  interestRate: number
  tenureMonths: number
  date: string
  bankId?: string
}

export interface BankLoginInfo {
  date: string
  reference: string
}

export interface DisbursementInfo {
  amount: number
  date: string
}

/** Commission snapshot, created at first Disbursed entry (AD-11). */
export interface Commission {
  id: string
  applicationId: string
  payeeAgentId: string // = application.createdBy (AD-5/AD-11)
  basis: CommissionBasis
  rate: number // percent or flat amount per the basis
  base: number // disbursed amount
  computedAmount: number
  overrideAmount?: number
  overrideReason?: string
  effectiveAmount: number
  computedAt: string
}

export interface Payout {
  id: string
  applicationId: string
  agentId: string
  amount: number
  mode: PaymentMode
  date: string
  reference?: string
  tds?: number
  notes?: string
  status: PayoutStatus
  createdAt: string
}

export interface Application {
  id: string
  loanType: LoanType
  status: AnyStatus
  priorStatus: Status | null // for On Hold → Resume (AD-13)
  createdBy: string // agent id, immutable (AD-5)
  createdAt: string
  updatedAt: string
  submittedAt?: string
  applicant: Applicant
  employment: Employment
  loan: LoanDetails
  bank: BankDetails
  coApplicant?: CoApplicant
  documents: DocumentMeta[]
  statusHistory: StatusEvent[]
  issues: Issue[]
  verified?: boolean
  // bank events
  bankLogin?: BankLoginInfo
  sanction?: SanctionInfo
  disbursement?: DisbursementInfo
  disbursedToApplicant?: { amount: number; date: string }
  commission?: Commission
  rejectionReason?: string
  holdReason?: string
}

export interface Agent {
  id: string
  name: string
  code: string
  contact?: string
}

export interface Bank {
  id: string
  name: string
}

export interface CommissionRule {
  loanType: LoanType
  basis: CommissionBasis
  value: number // percent (e.g. 2 = 2%) or flat rupees
  min?: number
  max?: number
}

export interface Settings {
  orgName: string
  currency: 'INR'
}

export interface Meta {
  schemaVersion: number
}

/** The persisted root (AD-12): two partitions — data (resettable) + ui (preserved). */
export interface DataPartition {
  applications: Application[]
  agents: Agent[]
  banks: Bank[]
  commissionRules: CommissionRule[]
  payouts: Payout[]
  docSlots: import('./documents').DocSlot[]
  settings: Settings
  meta: Meta
}

export interface UiPartition {
  role: 'admin' | 'general' | null
  activeAgentId: string | null
}

export interface Root {
  data: DataPartition
  ui: UiPartition
}
