import { useStore } from '@/store/useStore'
import { Icon } from '@/shared/ui/icons'

export function RoleSelect() {
  const setRole = useStore((s) => s.setRole)
  const orgName = useStore((s) => s.data.settings.orgName)

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--color-canvas)] px-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-400 text-2xl font-bold text-white shadow-lg shadow-indigo-200">
            D
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)]">{orgName}</h1>
          <p className="mt-2 text-[var(--color-muted-ink)]">Loan origination for Direct Selling Agents. Choose how you'll sign in.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard
            icon={<Icon.Shield width={26} height={26} />}
            title="Admin Agent"
            desc="Review applications, drive the bank, manage commissions and settings."
            onClick={() => setRole('admin')}
          />
          <RoleCard
            icon={<Icon.User width={26} height={26} />}
            title="General Agent"
            desc="Capture applications with your applicant, submit, and track status."
            onClick={() => setRole('general')}
          />
        </div>
        <p className="mt-8 text-center text-xs text-[var(--color-muted-ink)]">Prototype · no sign-in required · your data stays in this browser</p>
      </div>
    </div>
  )
}

function RoleCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand)] transition-colors group-hover:bg-[var(--color-brand)] group-hover:text-white">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-ink)]">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)]">
        Enter <Icon.Chevron width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}
