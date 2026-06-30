import { useRef, useState } from 'react'
import { Sheet } from '@/shared/ui/Sheet'
import { Button, Card, Chip, Field, Input } from '@/shared/ui/primitives'
import { StatusPill } from '@/shared/ui/StatusPill'
import { Icon } from '@/shared/ui/icons'
import { Dialog } from '@/shared/ui/Dialog'
import { useStore } from '@/store/useStore'
import { useApplication, useBankName } from '@/store/selectors'
import { openIssue } from '@/domain/issues'
import { formatDate, formatINR, newId, nowIso, relativeAge } from '@/shared/lib/utils'
import type { AnyStatus, DocumentMeta } from '@/shared/types'
import { BankLoginDialog, DisbursementDialog, ReasonDialog, SanctionDialog } from '@/features/board/transitionDialogs'
import { PayoutDialog } from '@/features/commission/PayoutDialog'
import { IssueRaiseDialog } from './IssueRaiseDialog'
import { Timeline } from './Timeline'
import { useToast } from '@/shared/ui/toast'

type DialogKind = null | 'login' | 'sanction' | 'disburse' | 'payout' | 'issue' | 'hold' | 'reject' | 'override'

export function DetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const app = useApplication(id)
  const role = useStore((s) => s.ui.role)
  const move = useStore((s) => s.moveStatus)
  const verify = useStore((s) => s.verifyApplication)
  const resume = useStore((s) => s.resumeApplication)
  const respond = useStore((s) => s.respondIssue)
  const resolve = useStore((s) => s.resolveIssue)
  const setOverride = useStore((s) => s.setCommissionOverride)
  const updateApp = useStore((s) => s.updateApplication)
  const bank = useBankName(app?.loan.bankId)
  const { toast } = useToast()
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [overrideVal, setOverrideVal] = useState('')
  const [noRule, setNoRule] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!app) return null
  const issue = openIssue(app)
  const isAdmin = role === 'admin'
  const terminal = app.status === 'Closed' || app.status === 'Rejected'

  function simpleMove(to: AnyStatus) {
    const r = move(app!.id, to)
    if (r.ok) toast({ tone: 'info', title: `Moved to ${to}` })
  }

  function uploadRequested(files: FileList | null) {
    if (!files || !issue) return
    const docs: DocumentMeta[] = Array.from(files).map((f) => ({ id: newId(), slot: issue.requestedSlots[0] ?? 'other', name: f.name, mime: f.type || 'application/octet-stream', size: f.size, uploadedAt: nowIso(), uploadedByRole: 'general' }))
    updateApp(app!.id, { documents: [...app!.documents, ...docs] })
    toast({ tone: 'success', title: 'Document uploaded' })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={app.applicant.fullName || 'Untitled applicant'}
      subtitle={<><StatusPill status={app.status} /><Chip>{app.loanType}</Chip><span className="tnum font-semibold text-[var(--color-ink)]">{formatINR(app.loan.amount)}</span>{bank !== '—' && <span>· {bank}</span>}</>}
    >
      {/* Action bar */}
      {isAdmin && !terminal && (
        <div className="mb-5 flex flex-wrap gap-2">
          {!app.verified && (app.status === 'Submitted' || app.status === 'Under Review') && (
            <Button size="sm" onClick={() => { verify(app.id); if (app.status === 'Submitted') simpleMove('Under Review'); toast({ tone: 'success', title: 'Verified' }) }}><Icon.Check width={15} height={15} /> Verify</Button>
          )}
          {(app.status === 'Submitted' || app.status === 'Under Review') && <Button size="sm" variant="outline" onClick={() => setDialog('login')}>Log in to bank</Button>}
          {app.status === 'Submitted to Bank' && <Button size="sm" variant="outline" onClick={() => simpleMove('Bank Processing')}>Mark bank processing</Button>}
          {app.status === 'Bank Processing' && <Button size="sm" variant="outline" onClick={() => setDialog('sanction')}>Record sanction</Button>}
          {app.status === 'Sanctioned' && <Button size="sm" variant="outline" onClick={() => setDialog('disburse')}>Record disbursement</Button>}
          {app.status === 'Disbursed' && <Button size="sm" onClick={() => setDialog('payout')}><Icon.Rupee width={15} height={15} /> Release commission</Button>}
          {app.status === 'On Hold' ? (
            <Button size="sm" variant="outline" onClick={() => { resume(app.id); toast({ tone: 'info', title: 'Resumed' }) }}>Resume</Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setDialog('hold')}>Hold</Button>
          )}
          {!issue && <Button size="sm" variant="ghost" onClick={() => setDialog('issue')}><Icon.Alert width={15} height={15} /> Raise issue</Button>}
          <Button size="sm" variant="ghost" className="text-[var(--color-danger)]" onClick={() => setDialog('reject')}>Reject</Button>
        </div>
      )}

      {/* Issue panel */}
      {issue && (
        <Card className="mb-5 border-amber-200 bg-[var(--color-warn-soft)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-warn)]"><Icon.Alert width={16} height={16} /><span className="text-sm font-semibold">{issue.state === 'Responded' ? 'Responded — awaiting Admin' : 'Action needed'}</span></div>
          <p className="mt-1.5 text-sm text-[var(--color-ink)]">{issue.description}</p>
          {issue.requestedSlots.length > 0 && <p className="mt-1 text-xs text-[var(--color-muted-ink)]">Requested: {issue.requestedSlots.join(', ')}</p>}
          {issue.replyNote && <p className="mt-2 rounded bg-white/70 px-2 py-1 text-xs">Field note: {issue.replyNote}</p>}

          {role === 'general' && issue.state === 'Open' && (
            <div className="mt-3 flex gap-2">
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => uploadRequested(e.target.files)} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Icon.Upload width={15} height={15} /> Upload</Button>
              <Button size="sm" onClick={() => { respond(app.id); toast({ tone: 'info', title: 'Marked as responded' }) }}>Mark as responded</Button>
            </div>
          )}
          {isAdmin && issue.state === 'Responded' && (
            <Button size="sm" className="mt-3" onClick={() => { resolve(app.id); toast({ tone: 'success', title: 'Issue resolved' }) }}><Icon.Check width={15} height={15} /> Confirm resolved</Button>
          )}
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-5">
        <Section title="Applicant & KYC">
          <Grid rows={[['Full name', app.applicant.fullName], ['Category', app.applicant.category], ['PAN', app.applicant.pan], ['Aadhaar', app.applicant.aadhaar], ['Mobile', app.applicant.mobile], ['Email', app.applicant.email], ['City', app.applicant.city], ['PIN', app.applicant.pin]]} />
        </Section>
        <Section title="Loan details">
          <Grid rows={[['Type', app.loanType], ['Amount', formatINR(app.loan.amount)], ['Tenure', app.loan.tenureMonths ? `${app.loan.tenureMonths} mo` : undefined], ['Purpose', app.loan.purpose], ['Bank', bank]]} />
        </Section>
        {(app.bankLogin || app.sanction || app.disbursement) && (
          <Section title="Bank events">
            <Grid rows={[
              app.bankLogin ? ['Bank login', `${app.bankLogin.reference} · ${formatDate(app.bankLogin.date)}`] : ['Bank login', undefined],
              app.sanction ? ['Sanctioned', `${formatINR(app.sanction.amount)} @ ${app.sanction.interestRate}% · ${app.sanction.tenureMonths}mo`] : ['Sanctioned', undefined],
              app.disbursement ? ['Disbursed', `${formatINR(app.disbursement.amount)} · ${formatDate(app.disbursement.date)}`] : ['Disbursed', undefined],
              app.disbursedToApplicant ? ['Sent to applicant', `${formatINR(app.disbursedToApplicant.amount)} · ${formatDate(app.disbursedToApplicant.date)}`] : ['Sent to applicant', undefined],
            ]} />
          </Section>
        )}
        {app.commission && (
          <Section title="Commission">
            <Grid rows={[
              ['Basis', `${app.commission.basis} (${app.commission.rate}${app.commission.basis === 'Percentage' ? '%' : ' flat'})`],
              ['Computed', formatINR(app.commission.computedAmount)],
              app.commission.overrideAmount != null ? ['Override', `${formatINR(app.commission.overrideAmount)} — ${app.commission.overrideReason}`] : ['Effective', formatINR(app.commission.effectiveAmount)],
            ]} />
            {isAdmin && app.status === 'Disbursed' && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => { setOverrideVal(String(app.commission!.effectiveAmount)); setDialog('override') }}>Override amount</Button>
            )}
          </Section>
        )}
        <Section title={`Documents (${app.documents.length})`}>
          {app.documents.length === 0 ? <p className="text-sm text-[var(--color-muted-ink)]">No documents.</p> : (
            <div className="flex flex-col gap-2">
              {app.documents.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5 rounded-md border border-[var(--color-line)] px-3 py-2">
                  <Icon.Doc width={16} height={16} className="text-[var(--color-muted-ink)]" />
                  <span className="text-sm">{d.name}</span>
                  <Chip className="ml-1">{d.slot}</Chip>
                  <span className="ml-auto text-[11px] text-[var(--color-muted-ink)]">{Math.round(d.size / 1024)} KB</span>
                </div>
              ))}
            </div>
          )}
        </Section>
        <Section title="Status history">
          <Timeline events={app.statusHistory} />
        </Section>
        {app.holdReason && <p className="text-xs text-[var(--color-muted-ink)]">On hold: {app.holdReason}</p>}
        {app.rejectionReason && <p className="text-xs text-[var(--color-danger)]">Rejected: {app.rejectionReason}</p>}
        {role === 'general' && app.status === 'Draft' && (
          <Button variant="outline" onClick={() => { onClose(); location.assign(`/application/${app.id}/edit`) }}>Continue editing draft</Button>
        )}
        <p className="pt-2 text-[11px] text-[var(--color-muted-ink)]">Created {relativeAge(app.createdAt)} ago</p>
      </div>

      {/* Dialogs */}
      {dialog === 'login' && <BankLoginDialog app={app} onClose={() => setDialog(null)} onDone={() => { setDialog(null); toast({ tone: 'info', title: 'Logged in to bank' }) }} />}
      {dialog === 'sanction' && <SanctionDialog app={app} onClose={() => setDialog(null)} onDone={() => { setDialog(null); toast({ tone: 'success', title: 'Sanction recorded' }) }} />}
      {dialog === 'disburse' && <DisbursementDialog app={app} onClose={() => setDialog(null)} onNoRule={(m) => { setDialog(null); setNoRule(m) }} onDone={(c) => { setDialog(null); toast({ tone: 'success', title: 'Disbursed', body: c != null ? `Commission: ${formatINR(c)}` : undefined }) }} />}
      {dialog === 'payout' && <PayoutDialog app={app} onClose={() => setDialog(null)} onDone={() => setDialog(null)} />}
      {dialog === 'issue' && <IssueRaiseDialog app={app} onClose={() => setDialog(null)} />}
      {(dialog === 'hold' || dialog === 'reject') && <ReasonDialog app={app} to={dialog === 'hold' ? 'On Hold' : 'Rejected'} onClose={() => setDialog(null)} onDone={() => { setDialog(null); toast({ tone: dialog === 'reject' ? 'danger' : 'info', title: dialog === 'reject' ? 'Rejected' : 'On hold' }) }} />}
      {dialog === 'override' && (
        <Dialog open onClose={() => setDialog(null)} title="Override commission" footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={() => { setOverride(app.id, Number(overrideVal), 'Manual override'); setDialog(null); toast({ tone: 'info', title: 'Commission overridden' }) }}>Save</Button></>}>
          <Field label="Override amount (₹)"><Input type="number" value={overrideVal} onChange={(e) => setOverrideVal(e.target.value)} /></Field>
        </Dialog>
      )}
      {noRule && (
        <Dialog open onClose={() => setNoRule(null)} title="No commission rule" footer={<Button onClick={() => setNoRule(null)}>Got it</Button>}>
          <p className="text-sm text-[var(--color-muted-ink)]">{noRule} Set a rate in Settings → Commission rules, then disburse again.</p>
        </Dialog>
      )}
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-muted-ink)]">{title}</h3>
      {children}
    </div>
  )
}

function Grid({ rows }: { rows: Array<[string, string | undefined]> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] text-[var(--color-muted-ink)]">{k}</dt>
          <dd className="text-sm font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
