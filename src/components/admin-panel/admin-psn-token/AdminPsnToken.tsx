'use client'

import { useAdminPsnToken } from '@/hooks/useAdminPsnToken'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { SURFACE } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/Skeleton'
import AdminPsnAccountRow from '../admin-psn-account-row/AdminPsnAccountRow'

/**
 * The PlayStation tab: the app's PlayStation accounts, one row each (today the one NPSSO). Sony fixes an NPSSO at
 * 60 days, so each is renewed here every ~2 months; the admins get an email a week before it runs out.
 */
export default function AdminPsnToken() {
  const { status, loadError, saving, saveError, save, retry } = useAdminPsnToken()

  return (
    <section aria-labelledby="admin-psn-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 id="admin-psn-title" className="text-sm font-semibold">PlayStation accounts</h3>
        <p className="text-xs text-text-secondary">The accounts the app reads PlayStation with. Each sign-in lasts 60 days and is renewed here.</p>
      </div>

      {loadError ? (
        <ErrorRetry message="Could not load the PSN status." retryLabel="Retry" onRetry={retry} />
      ) : !status ? (
        <div role="status" aria-busy="true" className={`${SURFACE} p-4 flex items-center gap-3`}>
          <span className="sr-only">Loading…</span>
          <Skeleton radius="tile" className="size-10 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-64 max-w-full" />
          </div>
          <Skeleton radius="button" className="h-(--h-control-sm) w-20" />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          <AdminPsnAccountRow name="App account" status={status} saving={saving} saveError={saveError} onSave={save} />
        </ul>
      )}
    </section>
  )
}
