import { useMemo, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useStore } from '@/store/useStore'
import { Icon } from '@/shared/ui/icons'
import { hasOpenIssue } from '@/domain/issues'

export function AppShell({ children }: { children: ReactNode }) {
  const role = useStore((s) => s.ui.role)
  const orgName = useStore((s) => s.data.settings.orgName)

  const nav = [
    { to: '/', label: 'Dashboard', icon: Icon.Dashboard, end: true },
    { to: '/board', label: 'Board', icon: Icon.Board, end: false },
    { to: '/commission', label: 'Commission', icon: Icon.Rupee, end: false },
    ...(role === 'admin' ? [{ to: '/settings', label: 'Settings', icon: Icon.Settings, end: false }] : []),
  ]

  return (
    <div className="grid h-full grid-cols-[230px_1fr]">
      <aside className="flex flex-col border-r border-[var(--color-line)] bg-white px-3 py-5">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400 text-sm font-bold text-white">D</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--color-ink)]">{orgName}</p>
            <p className="text-[11px] text-[var(--color-muted-ink)]">Loan origination</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]' : 'text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)] hover:text-[var(--color-ink)]',
                )
              }
            >
              <n.icon width={17} height={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-4 text-[11px] text-[var(--color-muted-ink)]">Prototype · localStorage</div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

function TopBar() {
  const role = useStore((s) => s.ui.role)
  const switchRole = useStore((s) => s.switchRole)
  const agents = useStore((s) => s.data.agents)
  const activeAgentId = useStore((s) => s.ui.activeAgentId)
  const setActiveAgent = useStore((s) => s.setActiveAgent)
  const navigate = useNavigate()

  const apps = useStore((s) => s.data.applications)
  const notifCount = useMemo(() => {
    if (role === 'admin') return apps.filter((a) => a.status === 'Submitted').length
    return apps.filter((a) => a.createdBy === activeAgentId && hasOpenIssue(a)).length
  }, [apps, role, activeAgentId])

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-line)] bg-white px-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', role === 'admin' ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]' : 'bg-emerald-50 text-emerald-700')}>
          {role === 'admin' ? <Icon.Shield width={14} height={14} /> : <Icon.User width={14} height={14} />}
          {role === 'admin' ? 'Admin Agent' : 'General Agent'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {role === 'general' && (
          <label className="flex items-center gap-2 text-xs text-[var(--color-muted-ink)]">
            <span className="hidden sm:inline">Signed in as</span>
            <select
              value={activeAgentId ?? ''}
              onChange={(e) => setActiveAgent(e.target.value)}
              className="h-8 rounded-md border border-[var(--color-line)] bg-white px-2 text-[13px] font-medium text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
        )}
        <button className="relative rounded-md p-2 text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)]" title="Notifications" aria-label="Notifications">
          <Icon.Bell width={18} height={18} />
          {notifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-warn)] px-1 text-[10px] font-bold text-white">{notifCount}</span>
          )}
        </button>
        <button onClick={() => { switchRole(); navigate('/') }} className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)] hover:text-[var(--color-ink)]">
          <Icon.Logout width={16} height={16} /> Switch role
        </button>
      </div>
    </header>
  )
}
