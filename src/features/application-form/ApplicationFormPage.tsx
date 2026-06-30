import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { useApplication } from '@/store/selectors'
import { cn, newId, nowIso } from '@/shared/lib/utils'
import { Button, Card, Field, Input, ProgressMeter, Select } from '@/shared/ui/primitives'
import { Icon } from '@/shared/ui/icons'
import { useToast } from '@/shared/ui/toast'
import {
  aadhaarSchema, emailSchema, gstSchema, ifscSchema, mobileSchema, panSchema, pinSchema, validateField,
  slotsForLoanType, LOAN_TYPES, APPLICANT_CATEGORIES,
  type Application, type DocumentMeta, type LoanType,
} from '@/shared/types'
import { requirements, completeness } from './completeness'

const STEPS = ['Applicant & KYC', 'Contact & Address', 'Employment & Income', 'Loan Details', 'Bank & Financials', 'Co-applicant', 'Documents']

export function ApplicationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const banks = useStore((s) => s.data.banks)
  const docSlots = useStore((s) => s.data.docSlots)
  const createDraft = useStore((s) => s.createDraft)
  const updateApplication = useStore((s) => s.updateApplication)
  const submit = useStore((s) => s.submitApplication)
  const deleteDraft = useStore((s) => s.deleteDraft)

  const createdRef = useRef(false)
  const [draftId, setDraftId] = useState<string | null>(id ?? null)
  useEffect(() => {
    if (!draftId && !createdRef.current) {
      createdRef.current = true
      setDraftId(createDraft('Personal'))
    }
  }, [draftId, createDraft])
  const app = useApplication(draftId ?? undefined)
  const [step, setStep] = useState(0)
  const [showMissing, setShowMissing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadSlot, setUploadSlot] = useState<string>('')

  const reqs = useMemo(() => (app ? requirements(app, docSlots) : []), [app, docSlots])
  const { pct, missing } = completeness(reqs)
  const ready = missing.length === 0

  if (!app) return null

  const patchApplicant = (p: Partial<Application['applicant']>) => updateApplication(app.id, { applicant: { ...app.applicant, ...p } })
  const patchEmployment = (p: Partial<Application['employment']>) => updateApplication(app.id, { employment: { ...app.employment, ...p } })
  const patchLoan = (p: Partial<Application['loan']>) => updateApplication(app.id, { loan: { ...app.loan, ...p } })
  const patchBank = (p: Partial<Application['bank']>) => updateApplication(app.id, { bank: { ...app.bank, ...p } })

  function setLoanType(lt: LoanType) {
    updateApplication(app!.id, { loanType: lt })
  }

  function addDocs(files: FileList | null, slot: string) {
    if (!files) return
    const docs: DocumentMeta[] = Array.from(files).map((f) => ({ id: newId(), slot, name: f.name, mime: f.type || 'application/octet-stream', size: f.size, uploadedAt: nowIso(), uploadedByRole: 'general' }))
    updateApplication(app!.id, { documents: [...app!.documents, ...docs] })
  }

  function doSubmit() {
    if (!ready) { setShowMissing(true); return }
    submit(app!.id)
    toast({ tone: 'success', title: 'Submitted to the back-office', body: "We'll take it from here." })
    navigate('/board')
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-7">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]">← Back</button>
        <button onClick={() => setConfirmDelete(true)} className="text-sm text-[var(--color-danger)] hover:underline">Delete draft</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Form column */}
        <div>
          {/* Stepper */}
          <div className="mb-5 flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => setStep(i)} className={cn('rounded-full px-3 py-1 text-[12px] font-medium transition-colors', i === step ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-muted)] text-[var(--color-muted-ink)] hover:bg-slate-200')}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          <Card className="p-6">
            {step === 0 && (
              <Grid>
                <Field label="Loan type" required><Select value={app.loanType} onChange={(e) => setLoanType(e.target.value as LoanType)}>{LOAN_TYPES.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field>
                <Field label="Applicant category" required><Select value={app.applicant.category} onChange={(e) => patchApplicant({ category: e.target.value as Application['applicant']['category'] })}>{APPLICANT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
                <Field label="Full name (as per PAN)" required><Input value={app.applicant.fullName} onChange={(e) => patchApplicant({ fullName: e.target.value })} /></Field>
                <Field label="Date of birth" required><Input type="date" value={app.applicant.dob ?? ''} onChange={(e) => patchApplicant({ dob: e.target.value })} /></Field>
                <Field label="PAN" required error={validateField(panSchema, app.applicant.pan?.toUpperCase(), { required: false })}><Input value={app.applicant.pan ?? ''} onChange={(e) => patchApplicant({ pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" /></Field>
                <Field label="Aadhaar" required error={validateField(aadhaarSchema, app.applicant.aadhaar, { required: false })}><Input value={app.applicant.aadhaar ?? ''} onChange={(e) => patchApplicant({ aadhaar: e.target.value })} placeholder="1234 5678 9012" /></Field>
              </Grid>
            )}

            {step === 1 && (
              <Grid>
                <Field label="Mobile" required error={validateField(mobileSchema, app.applicant.mobile, { required: false })}><Input value={app.applicant.mobile ?? ''} onChange={(e) => patchApplicant({ mobile: e.target.value })} placeholder="98XXXXXXXX" /></Field>
                <Field label="Email" error={validateField(emailSchema, app.applicant.email, { required: false })}><Input value={app.applicant.email ?? ''} onChange={(e) => patchApplicant({ email: e.target.value })} /></Field>
                <Field label="Address line"><Input value={app.applicant.addressLine ?? ''} onChange={(e) => patchApplicant({ addressLine: e.target.value })} /></Field>
                <Field label="City" required><Input value={app.applicant.city ?? ''} onChange={(e) => patchApplicant({ city: e.target.value })} /></Field>
                <Field label="State"><Input value={app.applicant.state ?? ''} onChange={(e) => patchApplicant({ state: e.target.value })} /></Field>
                <Field label="PIN" required error={validateField(pinSchema, app.applicant.pin, { required: false })}><Input value={app.applicant.pin ?? ''} onChange={(e) => patchApplicant({ pin: e.target.value })} /></Field>
              </Grid>
            )}

            {step === 2 && (
              app.applicant.category === 'Salaried' ? (
                <Grid>
                  <Field label="Employer name" required><Input value={app.employment.employerName ?? ''} onChange={(e) => patchEmployment({ employerName: e.target.value })} /></Field>
                  <Field label="Designation"><Input value={app.employment.designation ?? ''} onChange={(e) => patchEmployment({ designation: e.target.value })} /></Field>
                  <Field label="Total experience (yrs)"><Input type="number" value={app.employment.experienceYears ?? ''} onChange={(e) => patchEmployment({ experienceYears: Number(e.target.value) })} /></Field>
                  <Field label="Net monthly salary (₹)" required><Input type="number" value={app.employment.netMonthlySalary ?? ''} onChange={(e) => patchEmployment({ netMonthlySalary: Number(e.target.value) })} /></Field>
                  <Field label="Existing EMIs (₹)"><Input type="number" value={app.employment.existingObligations ?? ''} onChange={(e) => patchEmployment({ existingObligations: Number(e.target.value) })} /></Field>
                </Grid>
              ) : (
                <Grid>
                  <Field label="Business name" required><Input value={app.employment.businessName ?? ''} onChange={(e) => patchEmployment({ businessName: e.target.value })} /></Field>
                  <Field label="Nature of business"><Input value={app.employment.businessNature ?? ''} onChange={(e) => patchEmployment({ businessNature: e.target.value })} /></Field>
                  <Field label="Years in business"><Input type="number" value={app.employment.vintageYears ?? ''} onChange={(e) => patchEmployment({ vintageYears: Number(e.target.value) })} /></Field>
                  <Field label="Annual turnover (₹)" required><Input type="number" value={app.employment.annualTurnover ?? ''} onChange={(e) => patchEmployment({ annualTurnover: Number(e.target.value) })} /></Field>
                  <Field label="GSTIN" error={validateField(gstSchema, app.employment.gstNumber?.toUpperCase(), { required: false })}><Input value={app.employment.gstNumber ?? ''} onChange={(e) => patchEmployment({ gstNumber: e.target.value.toUpperCase() })} /></Field>
                </Grid>
              )
            )}

            {step === 3 && (
              <Grid>
                <Field label="Loan amount (₹)" required><Input type="number" value={app.loan.amount ?? ''} onChange={(e) => patchLoan({ amount: Number(e.target.value) })} /></Field>
                <Field label="Tenure (months)" required><Input type="number" value={app.loan.tenureMonths ?? ''} onChange={(e) => patchLoan({ tenureMonths: Number(e.target.value) })} /></Field>
                <Field label="Purpose"><Input value={app.loan.purpose ?? ''} onChange={(e) => patchLoan({ purpose: e.target.value })} /></Field>
                <Field label="Preferred bank" required><Select value={app.loan.bankId ?? ''} onChange={(e) => patchLoan({ bankId: e.target.value })}><option value="">Select…</option>{banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
                {(app.loanType === 'Home' || app.loanType === 'Auto') && (
                  <>
                    <Field label="Asset / property value (₹)" required><Input type="number" value={app.loan.assetValue ?? ''} onChange={(e) => patchLoan({ assetValue: Number(e.target.value) })} /></Field>
                    <Field label="Down payment (₹)" required><Input type="number" value={app.loan.downPayment ?? ''} onChange={(e) => patchLoan({ downPayment: Number(e.target.value) })} /></Field>
                  </>
                )}
              </Grid>
            )}

            {step === 4 && (
              <Grid>
                <Field label="Bank account number" required><Input value={app.bank.accountNumber ?? ''} onChange={(e) => patchBank({ accountNumber: e.target.value })} /></Field>
                <Field label="IFSC" required error={validateField(ifscSchema, app.bank.ifsc?.toUpperCase(), { required: false })}><Input value={app.bank.ifsc ?? ''} onChange={(e) => patchBank({ ifsc: e.target.value.toUpperCase() })} placeholder="HDFC0001234" /></Field>
                <Field label="Bank / branch name"><Input value={app.bank.bankName ?? ''} onChange={(e) => patchBank({ bankName: e.target.value })} /></Field>
                <Field label="CIBIL score (optional)"><Input type="number" value={app.bank.cibil ?? ''} onChange={(e) => patchBank({ cibil: Number(e.target.value) })} /></Field>
              </Grid>
            )}

            {step === 5 && (
              <div>
                <p className="mb-3 text-sm text-[var(--color-muted-ink)]">{app.loanType === 'Home' ? 'A co-applicant is recommended for home loans (optional).' : 'Add a co-applicant or guarantor to strengthen eligibility (optional).'}</p>
                <Grid>
                  <Field label="Type"><Select value={app.coApplicant?.kind ?? 'Co-applicant'} onChange={(e) => updateApplication(app.id, { coApplicant: { ...app.coApplicant, kind: e.target.value as 'Co-applicant' | 'Guarantor' } })}><option>Co-applicant</option><option>Guarantor</option></Select></Field>
                  <Field label="Name"><Input value={app.coApplicant?.name ?? ''} onChange={(e) => updateApplication(app.id, { coApplicant: { ...(app.coApplicant ?? { kind: 'Co-applicant' }), name: e.target.value } })} /></Field>
                  <Field label="Relationship"><Input value={app.coApplicant?.relationship ?? ''} onChange={(e) => updateApplication(app.id, { coApplicant: { ...(app.coApplicant ?? { kind: 'Co-applicant' }), relationship: e.target.value } })} /></Field>
                  <Field label="Income (₹/mo)"><Input type="number" value={app.coApplicant?.income ?? ''} onChange={(e) => updateApplication(app.id, { coApplicant: { ...(app.coApplicant ?? { kind: 'Co-applicant' }), income: Number(e.target.value) } })} /></Field>
                </Grid>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { addDocs(e.target.files, uploadSlot); if (fileRef.current) fileRef.current.value = '' }} />
                {slotsForLoanType(docSlots, app.loanType).map((slot) => {
                  const docs = app.documents.filter((d) => d.slot === slot.key)
                  return (
                    <div key={slot.key} className="flex items-center gap-3 rounded-md border border-[var(--color-line)] px-3 py-2.5">
                      <Icon.Doc width={18} height={18} className={docs.length ? 'text-[var(--color-success)]' : 'text-slate-400'} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{slot.label} {slot.mandatory && <span className="text-[var(--color-danger)]">*</span>}</p>
                        {docs.length > 0 && <p className="truncate text-[11px] text-[var(--color-muted-ink)]">{docs.map((d) => d.name).join(', ')}</p>}
                      </div>
                      <Button size="sm" variant={docs.length ? 'ghost' : 'outline'} className="ml-auto" onClick={() => { setUploadSlot(slot.key); setTimeout(() => fileRef.current?.click(), 0) }}>
                        <Icon.Upload width={14} height={14} /> {docs.length ? 'Replace' : 'Upload'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-[var(--color-line)] pt-4">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next</Button>
              ) : (
                <Button disabled={!ready} onClick={doSubmit}>Submit application</Button>
              )}
            </div>
          </Card>
        </div>

        {/* Completeness sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Completeness</span>
              <span className={cn('tnum text-sm font-bold', ready ? 'text-[var(--color-success)]' : 'text-[var(--color-brand)]')}>{Math.round(pct)}%</span>
            </div>
            <ProgressMeter value={pct} done={ready} />
            {ready ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]"><Icon.Check width={15} height={15} /> Ready to submit</p>
            ) : (
              <button onClick={() => setShowMissing((v) => !v)} className="mt-3 text-sm text-[var(--color-brand)] hover:underline">{missing.length} item{missing.length > 1 ? 's' : ''} left {showMissing ? '▲' : '▼'}</button>
            )}
            {showMissing && (
              <ul className="mt-2 space-y-1">
                {missing.map((m) => (
                  <li key={m.key}>
                    <button onClick={() => setStep(m.step)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-[13px] text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)]" /> {m.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <p className="mt-3 px-1 text-[11px] text-[var(--color-muted-ink)]">Saved automatically as a draft.</p>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={() => setConfirmDelete(false)}>
          <Card className="max-w-sm p-5" >
            <h3 className="font-semibold">Delete this draft?</h3>
            <p className="mt-1 text-sm text-[var(--color-muted-ink)]">This permanently removes the draft. This can't be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteDraft(app.id); navigate('/') }}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}
