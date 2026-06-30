import { create } from 'zustand'
import { newId, nowIso } from '@/shared/lib/utils'
import { clearRoot, loadRoot, persist } from '@/data/repository'
import { freshRoot } from '@/data/seed'
import {
  raiseIssue as raiseIssueFn,
  resolveIssue as resolveIssueFn,
  respondIssue as respondIssueFn,
} from '@/domain/issues'
import { resume as resumeFn, transition, type TransitionPayload, type TransitionResult } from '@/domain/transition'
import type {
  Agent,
  AnyStatus,
  Application,
  Bank,
  CommissionRule,
  DocSlot,
  IssueType,
  LoanType,
  Payout,
  Role,
  Root,
} from '@/shared/types'

interface StoreState extends Root {
  // hydration
  hydrate: () => void
  // ui
  setRole: (role: Role) => void
  switchRole: () => void
  setActiveAgent: (agentId: string) => void
  // applications
  createDraft: (loanType: LoanType) => string
  updateApplication: (id: string, patch: Partial<Application>) => void
  submitApplication: (id: string) => void
  deleteDraft: (id: string) => void
  moveStatus: (id: string, to: AnyStatus, payload?: TransitionPayload) => TransitionResult
  resumeApplication: (id: string) => void
  verifyApplication: (id: string) => void
  setCommissionOverride: (id: string, amount: number, reason: string) => void
  // issues
  raiseIssue: (id: string, input: { type: IssueType; description: string; requestedSlots: string[] }) => { ok: boolean; message?: string }
  respondIssue: (id: string, replyNote?: string) => void
  resolveIssue: (id: string) => void
  // payouts
  recordPayout: (input: Omit<Payout, 'id' | 'createdAt'>) => void
  // settings
  updateRule: (rule: CommissionRule) => void
  addBank: (name: string) => void
  removeBank: (id: string) => void
  addAgent: (name: string, code: string, contact?: string) => void
  removeAgent: (id: string) => void
  updateDocSlots: (slots: DocSlot[]) => void
  setOrgName: (name: string) => void
  resetDemo: () => void
}

function initialRoot(): Root {
  return loadRoot() ?? freshRoot()
}

export const useStore = create<StoreState>((set, get) => {
  const root = initialRoot()
  return {
    ...root,

    hydrate: () => {
      const r = loadRoot()
      if (r) set({ ...r })
    },

    setRole: (role) => set((s) => ({ ui: { ...s.ui, role } })),
    switchRole: () => set((s) => ({ ui: { ...s.ui, role: null } })),
    setActiveAgent: (agentId) => set((s) => ({ ui: { ...s.ui, activeAgentId: agentId } })),

    createDraft: (loanType) => {
      const id = newId()
      const agentId = get().ui.activeAgentId ?? get().data.agents[0]?.id ?? 'agent-amit'
      const app: Application = {
        id,
        loanType,
        status: 'Draft',
        priorStatus: null,
        createdBy: agentId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        applicant: { fullName: '', category: 'Salaried' },
        employment: {},
        loan: {},
        bank: {},
        documents: [],
        statusHistory: [],
        issues: [],
      }
      set((s) => ({ data: { ...s.data, applications: [app, ...s.data.applications] } }))
      return id
    },

    updateApplication: (id, patch) =>
      set((s) => ({
        data: {
          ...s.data,
          applications: s.data.applications.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: nowIso() } : a)),
        },
      })),

    submitApplication: (id) =>
      set((s) => ({
        data: {
          ...s.data,
          applications: s.data.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'Submitted',
                  submittedAt: nowIso(),
                  updatedAt: nowIso(),
                  statusHistory: [
                    ...a.statusHistory,
                    { id: newId(), from: 'Draft', to: 'Submitted', actorRole: 'general', at: nowIso() },
                  ],
                }
              : a,
          ),
        },
      })),

    deleteDraft: (id) =>
      set((s) => ({
        data: { ...s.data, applications: s.data.applications.filter((a) => !(a.id === id && a.status === 'Draft')) },
      })),

    moveStatus: (id, to, payload = {}) => {
      const s = get()
      const app = s.data.applications.find((a) => a.id === id)
      if (!app) return { ok: false, reason: 'blocked', message: 'Not found' }
      const result = transition(app, to, payload, { rules: s.data.commissionRules, actorRole: s.ui.role === 'general' ? 'general' : 'admin' })
      if (result.ok) {
        set((st) => ({
          data: { ...st.data, applications: st.data.applications.map((a) => (a.id === id ? result.application : a)) },
        }))
      }
      return result
    },

    resumeApplication: (id) =>
      set((s) => {
        const app = s.data.applications.find((a) => a.id === id)
        if (!app) return s
        const r = resumeFn(app, { rules: s.data.commissionRules, actorRole: 'admin' })
        if (!r.ok) return s
        return { data: { ...s.data, applications: s.data.applications.map((a) => (a.id === id ? r.application : a)) } }
      }),

    verifyApplication: (id) =>
      set((s) => ({
        data: { ...s.data, applications: s.data.applications.map((a) => (a.id === id ? { ...a, verified: true, updatedAt: nowIso() } : a)) },
      })),

    setCommissionOverride: (id, amount, reason) =>
      set((s) => ({
        data: {
          ...s.data,
          applications: s.data.applications.map((a) =>
            a.id === id && a.commission
              ? { ...a, commission: { ...a.commission, overrideAmount: amount, overrideReason: reason, effectiveAmount: amount } }
              : a,
          ),
        },
      })),

    raiseIssue: (id, input) => {
      const s = get()
      const app = s.data.applications.find((a) => a.id === id)
      if (!app) return { ok: false, message: 'Not found' }
      const r = raiseIssueFn(app, input)
      if (!r.ok) return r
      set((st) => ({ data: { ...st.data, applications: st.data.applications.map((a) => (a.id === id ? r.application : a)) } }))
      return { ok: true }
    },

    respondIssue: (id, replyNote) =>
      set((s) => {
        const app = s.data.applications.find((a) => a.id === id)
        if (!app) return s
        return { data: { ...s.data, applications: s.data.applications.map((a) => (a.id === id ? respondIssueFn(app, replyNote) : a)) } }
      }),

    resolveIssue: (id) =>
      set((s) => {
        const app = s.data.applications.find((a) => a.id === id)
        if (!app) return s
        return { data: { ...s.data, applications: s.data.applications.map((a) => (a.id === id ? resolveIssueFn(app) : a)) } }
      }),

    recordPayout: (input) => {
      const payout: Payout = { ...input, id: newId(), createdAt: nowIso() }
      set((s) => ({ data: { ...s.data, payouts: [...s.data.payouts, payout] } }))
    },

    updateRule: (rule) =>
      set((s) => ({
        data: { ...s.data, commissionRules: s.data.commissionRules.map((r) => (r.loanType === rule.loanType ? rule : r)) },
      })),

    addBank: (name) =>
      set((s) => ({ data: { ...s.data, banks: [...s.data.banks, { id: newId(), name }] } })),
    removeBank: (id) =>
      set((s) => ({ data: { ...s.data, banks: s.data.banks.filter((b) => b.id !== id) } })),

    addAgent: (name, code, contact) =>
      set((s) => ({ data: { ...s.data, agents: [...s.data.agents, { id: newId(), name, code, contact }] } })),
    removeAgent: (id) =>
      set((s) => ({ data: { ...s.data, agents: s.data.agents.filter((a) => a.id !== id) } })),

    updateDocSlots: (slots) => set((s) => ({ data: { ...s.data, docSlots: slots } })),

    setOrgName: (name) => set((s) => ({ data: { ...s.data, settings: { ...s.data.settings, orgName: name } } })),

    resetDemo: () => {
      clearRoot()
      const fresh = freshRoot()
      // preserve ui partition (AD-8)
      set((s) => ({ data: fresh.data, ui: s.ui }))
    },
  } satisfies StoreState as StoreState & Root
})

// AD-12: persist the whole root via a SINGLE subscription (debounced),
// not inside individual actions. Flush on beforeunload.
let timer: ReturnType<typeof setTimeout> | null = null
function snapshot(): Root {
  const s = useStore.getState()
  return { data: s.data, ui: s.ui }
}
useStore.subscribe(() => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => persist(snapshot()), 150)
})
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => persist(snapshot()))
}
