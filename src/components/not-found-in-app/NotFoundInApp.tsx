'use client'

import { usePathname } from 'next/navigation'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { gameSourceFromPath } from '@/utils/utils'
import NotFoundScreen from '@/components/not-found-screen/NotFoundScreen'
import NotFoundGame from '@/components/not-found-game/NotFoundGame'

/**
 * The 404 under the header, for someone signed in: a game page says what is
 * missing, anything else gets the hidden achievement.
 */
export default function NotFoundInApp() {
  const pathname = usePathname()
  const xboxEnabled = useXboxEnabled()

  const source = gameSourceFromPath(pathname)
  // Xbox is admin-only: anyone else gets the plain 404, with no word of Xbox.
  if (source && (source !== 'xbox' || xboxEnabled)) return <NotFoundGame source={source} />
  return <NotFoundScreen />
}
