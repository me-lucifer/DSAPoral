import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Central id generator (AD-7). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** ISO-8601 UTC timestamp (AD-7). */
export function nowIso(): string {
  return new Date().toISOString()
}

/** Indian-format rupees: ₹4,00,000 (FR-J3). Amounts are integer rupees. */
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
export function formatINR(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return '₹' + inr.format(Math.round(amount))
}

/** Short date, e.g. "30 Jun 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Relative age, e.g. "just now", "3d", "2w". */
export function relativeAge(iso: string | null | undefined): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  const wks = Math.floor(days / 7)
  if (wks < 5) return `${wks}w`
  const mos = Math.floor(days / 30)
  return `${mos}mo`
}

/** Days/weeks ago helper for back-dated seed timestamps. */
export function daysAgoIso(days: number, hourOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - hourOffset)
  return d.toISOString()
}
