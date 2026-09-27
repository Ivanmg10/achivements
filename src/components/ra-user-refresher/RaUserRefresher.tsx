'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

let raRefreshed = false

export default function RaUserRefresher() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      raRefreshed = false
      return
    }
    if (status !== 'authenticated' || !session?.user?.raUser?.User || raRefreshed) return

    raRefreshed = true

    // The server fetches and stores the fresh profile; update() then re-reads it.
    fetch('/api/updateRaUser', { method: 'PUT' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to refresh RA profile (${res.status})`)
        return update()
      })
      .catch((err) => console.error('[RaUserRefresher]', err))
  }, [status])

  return null
}
