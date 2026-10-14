import { useEffect, useRef } from 'react'
import { useBackRegistry } from '@/context/BackInterceptContext'

/**
 * While `handler` is given, the back button of the top bar runs it instead of
 * leaving the page. Pass null when there is nothing to undo. The handler may
 * change on every render; the one registered always calls the latest.
 */
export function useBackIntercept(handler: (() => void) | null) {
  const { register } = useBackRegistry()
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })

  const active = handler !== null
  useEffect(() => {
    if (!active) return
    return register(() => latest.current?.())
  }, [active, register])
}
