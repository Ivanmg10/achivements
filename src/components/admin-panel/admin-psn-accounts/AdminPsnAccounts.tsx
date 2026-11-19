'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconPlus } from '@tabler/icons-react'
import { useAdminPsnAccounts, type PsnAccountError } from '@/hooks/useAdminPsnAccounts'
import { notify } from '@/lib/notify'
import type { PsnAccountInfo } from '@/types/psnPool'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import Button from '@/components/ui/Button'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { SURFACE } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/Skeleton'
import AdminPsnAccountRow, { type PsnRowAction } from '../admin-psn-account-row/AdminPsnAccountRow'
import AdminPsnPoolSummary from '../admin-psn-pool-summary/AdminPsnPoolSummary'
import AdminPsnPoolMetrics from '../admin-psn-pool-metrics/AdminPsnPoolMetrics'

const AdminPsnRenewModal = dynamic(() => import('../admin-psn-renew-modal/AdminPsnRenewModal'), { loading: () => null })
const DeleteConfirmDialog = dynamic(() => import('@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'), { loading: () => null })

/** Admin panel text is English (exempt from i18n). */
const FAILED: Partial<Record<PsnAccountError, string>> = {
  auth: 'Sony refused its sign-in: renew it.',
  'rate-limited': 'Sony asked to wait: try again in a minute.',
  'not-found': 'That account is gone.',
}
const STATUS_OF = { pause: 'paused', resume: 'active', drain: 'draining' } as const
const DONE = { pause: 'paused', resume: 'back in the pool', drain: 'draining: it finishes what it has and takes no more' } as const

function LoadingRow() {
  return (
    <div role="status" aria-busy="true" className={`${SURFACE} p-4 flex items-center gap-3`}>
      <span className="sr-only">Loading…</span>
      <Skeleton radius="tile" className="size-10 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
      <Skeleton radius="button" className="h-(--h-control-sm) w-20" />
    </div>
  )
}

/**
 * The PlayStation tab (#178): the service accounts the app reads Sony with, one row each, the pool at a glance,
 * and adding, renewing, testing, draining, pausing and removing them. Each sign-in lasts 60 days and only a
 * person signing in to Sony can make a new one, so "Renew" walks through it.
 */
export default function AdminPsnAccounts() {
  const { status, loadedAt, loadError, retry, add, renew, test, update, remove } = useAdminPsnAccounts()
  const [dialog, setDialog] = useState<{ account?: PsnAccountInfo } | null>(null)
  const [removing, setRemoving] = useState<PsnAccountInfo | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const fail = (what: string, error: PsnAccountError) => notify.error(`${what} failed. ${FAILED[error] ?? 'Try again.'}`)

  const handleAction = async (account: PsnAccountInfo, action: PsnRowAction) => {
    if (action === 'renew') return setDialog({ account })
    if (action === 'remove') return setRemoving(account)
    setBusy(account.id)
    if (action === 'test') {
      const result = await test(account.id)
      if (result.ok) notify.success(`${account.label} works: signed in as ${result.data.onlineId}, ${result.data.ms} ms`)
      else fail(`Testing ${account.label}`, result.error)
    } else {
      const result = await update(account.id, { status: STATUS_OF[action] })
      if (result.ok) notify.success(`${account.label} ${DONE[action]}`)
      else fail(`Changing ${account.label}`, result.error)
    }
    setBusy(null)
  }

  const confirmRemove = async () => {
    if (!removing) return
    const account = removing
    setRemoving(null)
    const result = await remove(account.id)
    if (result.ok) notify.success(`${account.label} removed, with its sign-in`)
    else fail(`Removing ${account.label}`, result.error)
  }

  return (
    <section aria-labelledby="admin-psn-title" className="flex flex-col gap-3">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <h3 id="admin-psn-title" className="text-sm font-semibold">PlayStation accounts</h3>
          <p className="text-xs text-text-secondary">The accounts the app reads PlayStation with. Each sign-in lasts 60 days and is renewed here.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setDialog({})}>
          <IconPlus size={14} aria-hidden="true" />
          Add account
        </Button>
      </div>

      {loadError ? (
        <ErrorRetry message="Could not load the PSN accounts." retryLabel="Retry" onRetry={retry} />
      ) : !status ? (
        <LoadingRow />
      ) : (
        <>
          <AdminPsnPoolSummary pool={status.pool} />
          <ul className="flex flex-col gap-2">
            {status.accounts.map((a) => (
              <AdminPsnAccountRow key={a.id} account={a} crowded={status.pool.crowded.includes(a.id)} busy={busy === a.id} now={loadedAt} onAction={(action) => handleAction(a, action)} />
            ))}
          </ul>
          {status.metrics && <AdminPsnPoolMetrics metrics={status.metrics} accounts={status.accounts} switches={status.switches} now={loadedAt} />}
        </>
      )}

      <LazyWhenOpened open={dialog !== null}>
        <AdminPsnRenewModal
          // A new account or another account is a new form.
          key={dialog?.account?.id ?? 'new'}
          isOpen={dialog !== null}
          onClose={() => setDialog(null)}
          account={dialog?.account}
          onAdd={add}
          onRenew={renew}
        />
      </LazyWhenOpened>
      <LazyWhenOpened open={removing !== null}>
        <DeleteConfirmDialog
          isOpen={removing !== null}
          onClose={() => setRemoving(null)}
          onConfirm={confirmRemove}
          message={`Remove ${removing?.label} and its sign-in? Adding it again means signing in to Sony again.`}
          confirmLabel="Remove account"
        />
      </LazyWhenOpened>
    </section>
  )
}
