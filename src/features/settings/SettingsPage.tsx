import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Button, Card, Field, Input, Select } from '@/shared/ui/primitives'
import { Icon } from '@/shared/ui/icons'
import { useToast } from '@/shared/ui/toast'
import { COMMISSION_BASIS, LOAN_TYPES, type CommissionBasis } from '@/shared/types'
import { formatINR } from '@/shared/lib/utils'

const TABS = ['Commission rules', 'Banks', 'Agents', 'Documents', 'General'] as const
type Tab = (typeof TABS)[number]

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Commission rules')
  return (
    <div className="mx-auto max-w-4xl px-6 py-7">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'rounded-full bg-[var(--color-brand)] px-3.5 py-1.5 text-[13px] font-medium text-white' : 'rounded-full bg-[var(--color-muted)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-muted-ink)] hover:bg-slate-200'}>{t}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'Commission rules' && <RulesTab />}
        {tab === 'Banks' && <BanksTab />}
        {tab === 'Agents' && <AgentsTab />}
        {tab === 'Documents' && <DocsTab />}
        {tab === 'General' && <GeneralTab />}
      </div>
    </div>
  )
}

function RulesTab() {
  const rules = useStore((s) => s.data.commissionRules)
  const update = useStore((s) => s.updateRule)
  const { toast } = useToast()
  return (
    <Card className="divide-y divide-[var(--color-line)]">
      <p className="px-5 py-3 text-sm text-[var(--color-muted-ink)]">Commission computes on the disbursed amount. The four rules are editable but can't be deleted.</p>
      {LOAN_TYPES.map((lt) => {
        const r = rules.find((x) => x.loanType === lt)!
        return (
          <div key={lt} className="flex items-center gap-3 px-5 py-3">
            <span className="w-24 text-sm font-medium">{lt}</span>
            <Select value={r.basis} onChange={(e) => update({ ...r, basis: e.target.value as CommissionBasis })} className="h-9 w-36">{COMMISSION_BASIS.map((b) => <option key={b}>{b}</option>)}</Select>
            <Input type="number" step="0.1" value={r.value} onChange={(e) => update({ ...r, value: Number(e.target.value) })} className="h-9 w-28" />
            <span className="text-sm text-[var(--color-muted-ink)]">{r.basis === 'Percentage' ? '% of disbursed' : '₹ flat'}</span>
            <button onClick={() => toast({ tone: 'success', title: 'Saved' })} className="ml-auto text-sm text-[var(--color-brand)] hover:underline">Save</button>
          </div>
        )
      })}
    </Card>
  )
}

function BanksTab() {
  const banks = useStore((s) => s.data.banks)
  const add = useStore((s) => s.addBank)
  const remove = useStore((s) => s.removeBank)
  const [name, setName] = useState('')
  return (
    <Card className="p-5">
      <div className="mb-4 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a bank / lender…" />
        <Button disabled={!name} onClick={() => { add(name); setName('') }}><Icon.Plus width={16} height={16} /> Add</Button>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {banks.map((b) => (
          <div key={b.id} className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-sm"><Icon.Bank width={16} height={16} className="text-[var(--color-muted-ink)]" /> {b.name}</span>
            <button onClick={() => remove(b.id)} className="text-[var(--color-muted-ink)] hover:text-[var(--color-danger)]"><Icon.X width={16} height={16} /></button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AgentsTab() {
  const agents = useStore((s) => s.data.agents)
  const add = useStore((s) => s.addAgent)
  const remove = useStore((s) => s.removeAgent)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  return (
    <Card className="p-5">
      <div className="mb-4 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" />
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="w-32" />
        <Button disabled={!name || !code} onClick={() => { add(name, code); setName(''); setCode('') }}><Icon.Plus width={16} height={16} /> Add</Button>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {agents.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-sm"><Icon.User width={16} height={16} className="text-[var(--color-muted-ink)]" /> {a.name} <span className="text-[var(--color-muted-ink)]">· {a.code}</span></span>
            <button onClick={() => remove(a.id)} className="text-[var(--color-muted-ink)] hover:text-[var(--color-danger)]"><Icon.X width={16} height={16} /></button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DocsTab() {
  const slots = useStore((s) => s.data.docSlots)
  const update = useStore((s) => s.updateDocSlots)
  return (
    <Card className="divide-y divide-[var(--color-line)]">
      <p className="px-5 py-3 text-sm text-[var(--color-muted-ink)]">Toggle which documents are mandatory. The form, review, and issue requests all use this list.</p>
      {slots.map((s) => (
        <label key={s.key} className="flex items-center gap-3 px-5 py-2.5 text-sm">
          <input type="checkbox" checked={s.mandatory} onChange={(e) => update(slots.map((x) => (x.key === s.key ? { ...x, mandatory: e.target.checked } : x)))} className="h-4 w-4 accent-[var(--color-brand)]" />
          <span className="font-medium">{s.label}</span>
          <span className="ml-auto text-[11px] text-[var(--color-muted-ink)]">{s.loanTypes.join(', ')}</span>
        </label>
      ))}
    </Card>
  )
}

function GeneralTab() {
  const orgName = useStore((s) => s.data.settings.orgName)
  const setOrgName = useStore((s) => s.setOrgName)
  const resetDemo = useStore((s) => s.resetDemo)
  const { toast } = useToast()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <Field label="Organisation / brand name"><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></Field>
        <div className="mt-4"><Field label="Currency"><Input value="₹ Indian Rupee (INR)" readOnly className="bg-[var(--color-muted)]" /></Field></div>
      </Card>
      <Card className="border-amber-200 p-5">
        <h3 className="text-sm font-semibold">Reset demo data</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-ink)]">Restores the seeded sample applications and settings. Your current role stays signed in.</p>
        {confirm ? (
          <div className="mt-3 flex gap-2">
            <Button variant="danger" onClick={() => { resetDemo(); setConfirm(false); toast({ tone: 'success', title: 'Demo data reset' }) }}>Yes, reset everything</Button>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" className="mt-3" onClick={() => setConfirm(true)}>Reset demo data</Button>
        )}
      </Card>
      <p className="text-center text-[11px] text-[var(--color-muted-ink)]">{formatINR(0).slice(0, 1)} · Prototype · DSA Portal</p>
    </div>
  )
}
