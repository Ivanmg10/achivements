import { useCallback, useState } from 'react'
import { useOpenCardContext } from '@/context/OpenCardContext'

/**
 * Open/closed for one expandable card. Inside an OpenCardProvider, opening it
 * closes whichever other card was open; outside one it is a plain toggle.
 */
export function useExclusiveOpen(key: string) {
  const shared = useOpenCardContext()
  const [local, setLocal] = useState(false)
  const setOpenKey = shared?.setOpenKey

  const open = shared ? shared.openKey === key : local
  const toggle = useCallback(() => {
    if (setOpenKey) setOpenKey(open ? null : key)
    else setLocal((o) => !o)
  }, [setOpenKey, open, key])

  return [open, toggle] as const
}
