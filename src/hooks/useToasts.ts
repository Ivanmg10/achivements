import { useSyncExternalStore } from 'react'
import { getServerToasts, getToasts, subscribeToasts } from '@/lib/notify'

/** The toasts on screen right now (see lib/notify). */
export function useToasts() {
  return useSyncExternalStore(subscribeToasts, getToasts, getServerToasts)
}
