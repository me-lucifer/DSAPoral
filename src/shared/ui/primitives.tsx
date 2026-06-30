import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--color-brand)] text-white hover:brightness-110 shadow-sm',
  secondary: 'bg-[var(--color-muted)] text-[var(--color-ink)] hover:bg-slate-200',
  ghost: 'text-[var(--color-muted-ink)] hover:bg-[var(--color-muted)] hover:text-[var(--color-ink)]',
  danger: 'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-sm',
  outline: 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-muted)]',
}
const sizes: Record<Size, string> = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm' }

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white shadow-sm', className)}>{children}</div>
}

export function Label({ children, htmlFor, required }: { children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]">
      {children}
      {required && <span className="text-[var(--color-danger)]"> *</span>}
    </label>
  )
}

const fieldClass =
  'w-full h-10 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white px-3 text-sm text-[var(--color-ink)] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:border-[var(--color-brand)]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string | null }>(
  ({ className, error, ...props }, ref) => (
    <input ref={ref} aria-invalid={!!error} className={cn(fieldClass, error && 'border-[var(--color-danger)] focus-visible:ring-red-200', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClass, 'h-auto py-2 min-h-[80px]', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, 'pr-8 cursor-pointer', className)} {...props}>
    {children}
  </select>
))
Select.displayName = 'Select'

export function Field({ label, required, error, children, hint }: { label: string; required?: boolean; error?: string | null; children: ReactNode; hint?: string }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p> : hint ? <p className="mt-1 text-xs text-[var(--color-muted-ink)]">{hint}</p> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] bg-white/50 px-6 py-14 text-center">
      <h3 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-ink)]">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ProgressMeter({ value, done }: { value: number; done?: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.round(value))}%`, background: done ? 'var(--color-success)' : 'var(--color-brand)' }}
      />
    </div>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-md bg-[var(--color-slate-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-slate-ink)]', className)}>{children}</span>
}
