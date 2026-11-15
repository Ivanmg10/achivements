import { useCallback, useEffect, useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'
import type { PsnAccountPatch, PsnPoolStatus } from '@/types/psnPool'

/** Why an action on a PSN account failed, as /api/admin/psn/accounts says it. */
export type PsnAccountError = 'invalid' | 'invalid-npsso' | 'rejected' | 'failed' | 'save-failed' | 'label-taken' | 'not-found' | 'auth' | 'rate-limited'

const KNOWN: PsnAccountError[] = ['invalid', 'invalid-npsso', 'rejected', 'failed', 'save-failed', 'label-taken', 'not-found', 'auth', 'rate-limited']

export type PsnAccountResult<T> = { ok: true; data: T } | { ok: false; error: PsnAccountError }
export type NewPsnAccountInput = { label: string; hint: string; weight: number; npsso: string }
export type PsnSignInAnswer = { onlineId: string; expiresAt: string }

const BASE = '/api/admin/psn/accounts'

/** One admin call; any answer it does not know is `failed`. */
async function call<T>(url: string, method: string, body?: unknown): Promise<PsnAccountResult<T>> {
  try {
    const res = await adminFetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data: data as T }
    return { ok: false, error: KNOWN.find((e) => e === data?.error) ?? 'failed' }
  } catch (err) {
    console.error('[useAdminPsnAccounts]', method, url, err)
    return { ok: false, error: 'failed' }
  }
}

/**
 * The PSN service accounts for the admin panel (#178): the list and the pool, read when the tab opens, and every
 * action on them. Each action reads the list again when it succeeds; the caller says how it went (toast or inline).
 */
export function useAdminPsnAccounts() {
  const [status, setStatus] = useState<PsnPoolStatus | null>(null)
  /** When the list was read: what "days left" and "resting" are counted from. */
  const [loadedAt, setLoadedAt] = useState(0)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(() => {
    adminFetch(BASE)
      .then(async (res) => {
        if (!res.ok) throw new Error(`PSN accounts ${res.status}`)
        setStatus((await res.json()) as PsnPoolStatus)
        setLoadedAt(Date.now())
        setLoadError(false)
      })
      .catch((err) => {
        console.error('[useAdminPsnAccounts] load', err)
        setLoadError(true)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const then = useCallback(
    <T,>(result: PsnAccountResult<T>) => {
      if (result.ok) load()
      return result
    },
    [load],
  )

  return {
    status,
    loadedAt,
    loadError,
    retry: load,
    add: (input: NewPsnAccountInput) => call<PsnSignInAnswer & { id: number }>(BASE, 'POST', input).then(then),
    renew: (id: number, npsso: string) => call<PsnSignInAnswer>(`${BASE}/${id}/rotate`, 'POST', { npsso }).then(then),
    test: (id: number) => call<{ onlineId: string; ms: number }>(`${BASE}/${id}/test`, 'POST').then(then),
    update: (id: number, patch: PsnAccountPatch) => call<{ ok: true }>(`${BASE}/${id}`, 'PATCH', patch).then(then),
    remove: (id: number) => call<{ ok: true }>(`${BASE}/${id}`, 'DELETE').then(then),
  }
}
