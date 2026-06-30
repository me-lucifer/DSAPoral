import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn, newId } from '@/shared/lib/utils'
import { Icon } from './icons'

type Tone = 'success' | 'info' | 'danger'
interface Toast { id: string; tone: Tone; title: string; body?: string }

interface ToastApi { toast: (t: { tone?: Tone; title: string; body?: string }) => void }
const ToastCtx = createContext<ToastApi>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

const toneStyle: Record<Tone, { bar: string; icon: ReactNode }> = {
  success: { bar: 'bg-[var(--color-success)]', icon: <Icon.Check width={16} height={16} className="text-[var(--color-success)]" /> },
  info: { bar: 'bg-[var(--color-info)]', icon: <Icon.Bell width={16} height={16} className="text-[var(--color-info)]" /> },
  danger: { bar: 'bg-[var(--color-danger)]', icon: <Icon.Alert width={16} height={16} className="text-[var(--color-danger)]" /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((t: { tone?: Tone; title: string; body?: string }) => {
    const id = newId()
    setToasts((cur) => [...cur, { id, tone: t.tone ?? 'success', title: t.title, body: t.body }])
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 4200)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="flex animate-fade-in overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white shadow-lg">
            <div className={cn('w-1 shrink-0', toneStyle[t.tone].bar)} />
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5">{toneStyle[t.tone].icon}</div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[13px] text-[var(--color-muted-ink)]">{t.body}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
