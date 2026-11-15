import type { PsnAccountPatch, PsnAccountStatus } from '@/types/psnPool'

/**
 * What the admin API accepts for a PSN service account (#178). Anything else is `invalid` (400): the routes
 * answer codes, never sentences.
 */

/** An NPSSO is 64 letters and digits. */
const NPSSO = /^[A-Za-z0-9]{64}$/
/** "PSN-2", "reserve 1": short, plain, unique (the database refuses a repeat). */
const LABEL = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,31}$/
const HINT_MAX = 80
/** What an admin may set by hand; quarantine is the pool's to decide. */
const SETTABLE: PsnAccountStatus[] = ['active', 'paused', 'draining']

type Body = Record<string, unknown>
const asBody = (value: unknown): Body => (value && typeof value === 'object' ? (value as Body) : {})

const intIn = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null)

export function readNpsso(body: unknown): string | null {
  const v = asBody(body).npsso
  const npsso = typeof v === 'string' ? v.trim() : ''
  return NPSSO.test(npsso) ? npsso : null
}

/** The hint: trimmed, empty is none; undefined when it is not a string of at most 80 characters. */
function readHint(v: unknown): string | null | undefined {
  if (v === null) return null
  if (typeof v !== 'string' || v.trim().length > HINT_MAX) return undefined
  return v.trim() || null
}

export type NewPsnAccount = { label: string; hint: string | null; weight: number; npsso: string }

export function readNewAccount(value: unknown): NewPsnAccount | 'invalid' | 'invalid-npsso' {
  const body = asBody(value)
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const hint = body.hint === undefined ? null : readHint(body.hint)
  const weight = body.weight === undefined ? 1 : intIn(body.weight, 1, 10)
  if (!LABEL.test(label) || hint === undefined || weight === null) return 'invalid'
  const npsso = readNpsso(body)
  return npsso ? { label, hint, weight, npsso } : 'invalid-npsso'
}

/** A change to an account; 'invalid' for any field out of range, or for nothing to change. */
export function readAccountPatch(value: unknown): PsnAccountPatch | 'invalid' {
  const body = asBody(value)
  const patch: PsnAccountPatch = {}
  if (body.status !== undefined) {
    if (!SETTABLE.includes(body.status as PsnAccountStatus)) return 'invalid'
    patch.status = body.status as PsnAccountStatus
  }
  const ranges: Record<'weight' | 'concurrency' | 'ratePerMin', [number, number]> = { weight: [1, 10], concurrency: [1, 16], ratePerMin: [1, 200] }
  for (const key of Object.keys(ranges) as (keyof typeof ranges)[]) {
    if (body[key] === undefined) continue
    const n = intIn(body[key], ranges[key][0], ranges[key][1])
    if (n === null) return 'invalid'
    patch[key] = n
  }
  if (body.hint !== undefined) {
    const hint = readHint(body.hint)
    if (hint === undefined) return 'invalid'
    patch.hint = hint
  }
  return Object.keys(patch).length ? patch : 'invalid'
}
