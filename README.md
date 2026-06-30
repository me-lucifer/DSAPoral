# DSA Portal — clickable prototype

A two-sided loan-origination demo for Direct Selling Agents. **No backend** — all data lives in your browser (`localStorage`). Built for a client presentation.

## Run it

```bash
cd dsa-portal
npm install     # first time only
npm run dev     # → http://localhost:5173
```

`npm run build` type-checks and produces a production bundle in `dist/`. `npm run preview` serves that build.

## What to try (the golden path)

1. On the landing screen pick **General Agent**.
2. **New application** → pick *Personal Loan* → fill the steps (watch the completeness meter) → upload documents → **Submit**.
3. **Switch role** (top right) → **Admin Agent**. The new card is on the **Board** under *Submitted*.
4. Open it → **Verify** → drag it across **Submitted to Bank** (enter a login ref) → **Bank Processing**.
5. **Raise issue** (e.g. request a bank statement). Switch to **General Agent** → the card shows **Action needed** → open it, **Upload**, **Mark as responded**.
6. Switch to **Admin** → **Confirm resolved** → drag to **Sanctioned** (enter sanction) → **Disbursed** (commission auto-computes) → **Release commission** (record payout) → the card lands in **Closed**.
7. Switch to **General Agent** → **Commission** shows the entry in the ledger.

**Settings → Reset demo data** restores the seeded sample data at any time.

## Stack

React 19 · Vite 7 · TypeScript · Tailwind 4 · Zustand · Zod · @dnd-kit · react-hook-form · react-router.

## Architecture (one-liner per the spine)

Feature-sliced SPA over a single `localStorage` boundary: `features/` → `store/` (Zustand, single source of truth) → `domain/` (pure transition/commission/issue logic) → `data/` (the only code touching storage). See `_bmad-output/planning-artifacts/` for the PRD, UX spines, and architecture spine that drove this build.
