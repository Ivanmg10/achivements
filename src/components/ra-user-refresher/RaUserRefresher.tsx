'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

let raRefreshed = false

export default function RaUserRefresher() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.raUser?.User || raRefreshed) return

    raRefreshed = true

    fetch('/api/getUserProfile')
      .then((res) => res.json())
      .then((freshUser) => {
        if (freshUser && !freshUser.message) {
          update({ raUser: freshUser })
        }
      })
  }, [status])

  return null
}
