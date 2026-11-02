'use client'

import { useEffect } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'

let raRefreshed = false

/** Whether RA's fresh profile says anything the stored one does not (it is a flat object). */
function changed(fresh: Record<string, unknown>, stored: object | null | undefined) {
  const old = (stored ?? {}) as Record<string, unknown>
  return Object.keys(fresh).some((key) => JSON.stringify(fresh[key]) !== JSON.stringify(old[key]))
}

export default function RaUserRefresher() {
  const { data: session, status, update } = useAuthSession()
  const stored = session?.user?.raUser

  useEffect(() => {
    if (status === 'unauthenticated') {
      raRefreshed = false
      return
    }
    if (status !== 'authenticated' || !stored?.User || raRefreshed) return

    raRefreshed = true

    // The server fetches and stores the fresh profile; update() then re-reads it, only when it
    // moved: a session read costs two requests, on every page load (#101).
    fetch('/api/updateRaUser', { method: 'PUT' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to refresh RA profile (${res.status})`)
        return res.json()
      })
      .then((fresh: Record<string, unknown>) => {
        if (changed(fresh, stored)) return update()
      })
      .catch((err) => console.error('[RaUserRefresher]', err))
  }, [status, stored, update])

  return null
}
