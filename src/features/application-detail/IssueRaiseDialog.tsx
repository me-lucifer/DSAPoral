import { useState } from 'react'
import { Dialog } from '@/shared/ui/Dialog'
import { Button, Field, Select, Textarea } from '@/shared/ui/primitives'
import { useStore } from '@/store/useStore'
import { slotsForLoanType, ISSUE_TYPES, type Application, type IssueType } from '@/shared/types'
import { useToast } from '@/shared/ui/toast'

export function IssueRaiseDialog({ app, onClose }: { app: Application; onClose: () => void }) {
  const raise = useStore((s) => s.raiseIssue)
  const allSlots = useStore((s) => s.data.docSlots)
  const { toast } = useToast()
  const [type, setType] = useState<IssueType>('Pending Document')
  const [description, setDescription] = useState('')
  const [slot, setSlot] = useState('')

  const slots = slotsForLoanType(allSlots, app.loanType)

  function submit() {
    const r = raise(app.id, { type, description, requestedSlots: type === 'Pending Document' && slot ? [slot] : [] })
    if (!r.ok) { toast({ tone: 'danger', title: 'Could not raise issue', body: r.message }); return }
    toast({ tone: 'info', title: 'Issue raised', body: 'The General Agent has been notified.' })
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title="Raise an issue" description="Ask the field for a document or information."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!description} onClick={submit}>Raise issue</Button></>}>
      <div className="space-y-4">
        <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as IssueType)}>{ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        {type === 'Pending Document' && (
          <Field label="Requested document"><Select value={slot} onChange={(e) => setSlot(e.target.value)}><option value="">Select a document…</option>{slots.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</Select></Field>
        )}
        <Field label="Description" required><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Bank requires the latest 6-month bank statement." /></Field>
      </div>
    </Dialog>
  )
}
