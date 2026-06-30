import { newId, nowIso } from '@/shared/lib/utils'
import type { Application, Issue, IssueType, StatusEvent } from '@/shared/types'

// AD-9: one open issue per application; lifecycle Open → Responded → Resolved.
// Issue changes emit a timeline entry via the store (this returns the patch).

export function hasOpenIssue(app: Application): boolean {
  return app.issues.some((i) => i.state !== 'Resolved')
}

export function openIssue(app: Application): Issue | undefined {
  return app.issues.find((i) => i.state !== 'Resolved')
}

function timelineNote(app: Application, note: string): StatusEvent {
  return { id: newId(), from: app.status, to: app.status, actorRole: 'admin', at: nowIso(), note }
}

export function raiseIssue(
  app: Application,
  input: { type: IssueType; description: string; requestedSlots: string[] },
): { ok: false; message: string } | { ok: true; application: Application } {
  if (hasOpenIssue(app)) return { ok: false, message: 'An issue is already open on this application.' }
  const issue: Issue = {
    id: newId(),
    type: input.type,
    description: input.description,
    requestedSlots: input.requestedSlots,
    state: 'Open',
    raisedAt: nowIso(),
  }
  const ev = timelineNote(app, `Issue raised: ${input.description}`)
  return {
    ok: true,
    application: { ...app, issues: [...app.issues, issue], statusHistory: [...app.statusHistory, ev], updatedAt: nowIso() },
  }
}

export function respondIssue(app: Application, replyNote?: string): Application {
  const issues = app.issues.map((i) =>
    i.state === 'Open' ? { ...i, state: 'Responded' as const, respondedAt: nowIso(), replyNote } : i,
  )
  const ev: StatusEvent = { id: newId(), from: app.status, to: app.status, actorRole: 'general', at: nowIso(), note: 'Field responded to issue' }
  return { ...app, issues, statusHistory: [...app.statusHistory, ev], updatedAt: nowIso() }
}

export function resolveIssue(app: Application): Application {
  const issues = app.issues.map((i) =>
    i.state === 'Responded' ? { ...i, state: 'Resolved' as const, resolvedAt: nowIso() } : i,
  )
  const ev: StatusEvent = { id: newId(), from: app.status, to: app.status, actorRole: 'admin', at: nowIso(), note: 'Issue resolved' }
  return { ...app, issues, statusHistory: [...app.statusHistory, ev], updatedAt: nowIso() }
}
