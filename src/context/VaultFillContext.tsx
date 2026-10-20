'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useVaultFill } from '@/hooks/useVaultFill'
import type { FillStatus } from '@/lib/scoreRefresh'
import { fillProgress, type FillProgress } from '@/utils/vaultFill'

export type VaultFillValue = FillProgress & {
  status: FillStatus | null
  /** Grows after every pass that ran: what shows points reads them again. */
  version: number
}

const Ctx = createContext<VaultFillValue | null>(null)

/**
 * The signed-in user's Vault Points fill, driven once for the whole app: the
 * header, the account page, the platform cards and the rankings all show the
 * same progress.
 */
export function VaultFillProvider({ children }: { children: ReactNode }) {
  const { status, version } = useVaultFill()
  const value = useMemo(() => ({ ...fillProgress(status), status, version }), [status, version])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** The fill; null outside the app's providers (a signed-out page). */
export const useVaultFillState = () => useContext(Ctx)
