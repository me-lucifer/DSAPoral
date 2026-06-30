import { z } from 'zod'

// Zod schemas for the form's validated fields (AD-6). The form validates
// against the same field rules the store persists.

export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must be 10 chars, e.g. ABCDE1234F')

export const aadhaarSchema = z
  .string()
  .regex(/^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/, 'Aadhaar must be 12 digits')

export const mobileSchema = z.string().regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit mobile')

export const emailSchema = z.string().email('Enter a valid email')

export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC must be 11 chars, e.g. HDFC0001234')

export const pinSchema = z.string().regex(/^[1-9][0-9]{5}$/, 'PIN must be 6 digits')

export const gstSchema = z
  .string()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, 'Enter a valid 15-char GSTIN')

/** Validate a single optional field; returns an error string or null. */
export function validateField(
  schema: z.ZodTypeAny,
  value: string | undefined,
  { required }: { required: boolean },
): string | null {
  if (!value) return required ? 'Required' : null
  const r = schema.safeParse(value)
  return r.success ? null : (r.error.issues[0]?.message ?? 'Invalid')
}
