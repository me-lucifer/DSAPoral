import type { Root } from '@/shared/types'

// AD-1 / AD-12: the ONLY module that touches localStorage. One versioned root
// key; one whole-root atomic writer. No per-collection writes.

const ROOT_KEY = 'dsa-portal:v1'

export function loadRoot(): Root | null {
  try {
    const raw = localStorage.getItem(ROOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Root
  } catch {
    return null
  }
}

export function persist(root: Root): void {
  try {
    localStorage.setItem(ROOT_KEY, JSON.stringify(root))
  } catch {
    // storage full / unavailable — non-fatal for a demo prototype
  }
}

export function clearRoot(): void {
  try {
    localStorage.removeItem(ROOT_KEY)
  } catch {
    /* ignore */
  }
}
