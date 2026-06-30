import { useState } from 'react'
import { Dialog } from '@/shared/ui/Dialog'
import { Button, Field, Input, Select, Textarea } from '@/shared/ui/primitives'
import { useStore } from '@/store/useStore'
import type { Application, AnyStatus } from '@/shared/types'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/** Bank Login dialog (drop → Submitted to Bank). */
export function BankLoginDialog({ app, onClose, onDone }: { app: Application; onClose: () => void; onDone: () => void }) {
  const banks = useStore((s) => s.data.banks)
  const move = useStore((s) => s.moveStatus)
  const [bankId, setBankId] = useState(app.loan.bankId ?? banks[0]?.id ?? '')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(todayIso())

  return (
    <Dialog open onClose={onClose} title="Log in to bank" description="Lodge this file with the bank to start processing."
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!reference} onClick={() => { move(app.id, 'Submitted to Bank', { bankLogin: { date: new Date(date).toISOString(), reference } }); useStore.getState().updateApplication(app.id, { loan: { ...app.loan, bankId } }); onDone() }}>Confirm login</Button>
      </>}>
      <div className="space-y-4">
        <Field label="Bank / lender"><Select value={bankId} onChange={(e) => setBankId(e.target.value)}>{banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <Field label="Login reference" required><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. HDFC-LN-77450" /></Field>
        <Field label="Login date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
    </Dialog>
  )
}

/** Sanction dialog (drop → Sanctioned). */
export function SanctionDialog({ app, onClose, onDone }: { app: Application; onClose: () => void; onDone: () => void }) {
  const banks = useStore((s) => s.data.banks)
  const move = useStore((s) => s.moveStatus)
  const [amount, setAmount] = useState(String(app.loan.amount ?? ''))
  const [rate, setRate] = useState('')
  const [tenure, setTenure] = useState(String(app.loan.tenureMonths ?? ''))
  const [date, setDate] = useState(todayIso())

  return (
    <Dialog open onClose={onClose} title="Record sanction" description="Capture the bank's approved terms."
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!amount || !rate} onClick={() => { move(app.id, 'Sanctioned', { sanction: { amount: Number(amount), interestRate: Number(rate), tenureMonths: Number(tenure), date: new Date(date).toISOString(), bankId: app.loan.bankId } }); onDone() }}>Record sanction</Button>
      </>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Sanctioned amount (₹)" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Interest rate (%)" required><Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Tenure (months)"><Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} /></Field>
        <Field label="Sanction date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <input type="hidden" value={banks.length} readOnly />
    </Dialog>
  )
}

/** Disbursement dialog (drop → Disbursed). Surfaces no-rule blocking. */
export function DisbursementDialog({ app, onClose, onDone, onNoRule }: { app: Application; onClose: () => void; onDone: (commissionAmount: number | null) => void; onNoRule: (msg: string) => void }) {
  const move = useStore((s) => s.moveStatus)
  const [amount, setAmount] = useState(String(app.sanction?.amount ?? app.loan.amount ?? ''))
  const [date, setDate] = useState(todayIso())

  function submit() {
    const res = move(app.id, 'Disbursed', { disbursement: { amount: Number(amount), date: new Date(date).toISOString() } })
    if (!res.ok && res.reason === 'no-rule') { onNoRule(res.message); return }
    if (res.ok) onDone(res.application.commission?.effectiveAmount ?? null)
  }

  return (
    <Dialog open onClose={onClose} title="Record disbursement" description="Funds released to the applicant. Commission computes automatically."
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!amount} onClick={submit}>Record disbursement</Button>
      </>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Disbursed amount (₹)" required hint="Commission is computed on this amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Disbursement date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
    </Dialog>
  )
}

/** Hold & Reject reason dialogs. */
export function ReasonDialog({ app, to, onClose, onDone }: { app: Application; to: Extract<AnyStatus, 'On Hold' | 'Rejected'>; onClose: () => void; onDone: () => void }) {
  const move = useStore((s) => s.moveStatus)
  const [reason, setReason] = useState('')
  return (
    <Dialog open onClose={onClose} title={to === 'On Hold' ? 'Put on hold' : 'Reject application'} description={to === 'On Hold' ? 'Pause this file; you can resume it later.' : 'This is terminal and closes any open issue.'}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant={to === 'Rejected' ? 'danger' : 'primary'} onClick={() => { move(app.id, to, to === 'On Hold' ? { holdReason: reason } : { rejectionReason: reason }); onDone() }}>{to === 'On Hold' ? 'Hold' : 'Reject'}</Button>
      </>}>
      <Field label="Reason"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a short reason…" /></Field>
    </Dialog>
  )
}
