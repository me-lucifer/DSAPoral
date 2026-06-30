import { useState } from 'react'
import { Dialog } from '@/shared/ui/Dialog'
import { Button, Field, Input, Select, Textarea } from '@/shared/ui/primitives'
import { useStore } from '@/store/useStore'
import { formatINR } from '@/shared/lib/utils'
import { PAYMENT_MODES, type Application, type PaymentMode } from '@/shared/types'
import { useToast } from '@/shared/ui/toast'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/** Records a payout and transitions the application to Closed (FR-G3/G4). */
export function PayoutDialog({ app, onClose, onDone }: { app: Application; onClose: () => void; onDone: () => void }) {
  const recordPayout = useStore((s) => s.recordPayout)
  const move = useStore((s) => s.moveStatus)
  const { toast } = useToast()
  const commission = app.commission
  const [amount, setAmount] = useState(String(commission?.effectiveAmount ?? ''))
  const [mode, setMode] = useState<PaymentMode>('NEFT / Bank Transfer')
  const [date, setDate] = useState(todayIso())
  const [reference, setReference] = useState('')
  const [tds, setTds] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Paid')

  if (!commission) {
    return (
      <Dialog open onClose={onClose} title="No commission yet" footer={<Button onClick={onClose}>Close</Button>}>
        <p className="text-sm text-[var(--color-muted-ink)]">Record a disbursement first — commission is computed at disbursement.</p>
      </Dialog>
    )
  }

  function submit() {
    recordPayout({ applicationId: app.id, agentId: commission!.payeeAgentId, amount: Number(amount), mode, date: new Date(date).toISOString(), reference, tds: tds ? Number(tds) : undefined, notes, status })
    move(app.id, 'Closed', { note: `Commission payout ${formatINR(Number(amount))} (${status})` })
    toast({ tone: 'success', title: 'Commission released', body: `${formatINR(Number(amount))} recorded for the agent.` })
    onDone()
  }

  return (
    <Dialog open onClose={onClose} title="Release commission" description="Record the payout to the General Agent and close the file." wide
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!amount} onClick={submit}>Record payout & close</Button>
      </>}>
      <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-4 py-3 text-sm">
        <span className="text-[var(--color-muted-ink)]">Computed commission</span>
        <span className="ml-2 font-semibold text-[var(--color-success)] tnum">{formatINR(commission.computedAmount)}</span>
        {commission.overrideAmount != null && <span className="ml-2 text-[var(--color-muted-ink)]">· override {formatINR(commission.overrideAmount)}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Payout amount (₹)" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Payment mode"><Select value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>{PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
        <Field label="Payment date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Reference no."><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. NEFT-9920183" /></Field>
        <Field label="TDS (₹, optional)" hint="Informational; does not change totals"><Input type="number" value={tds} onChange={(e) => setTds(e.target.value)} /></Field>
        <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as 'Pending' | 'Paid')}><option>Paid</option><option>Pending</option></Select></Field>
      </div>
      <div className="mt-4"><Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
    </Dialog>
  )
}
