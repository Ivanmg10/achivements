'use client'

import { useSession } from 'next-auth/react'

/**
 * Whether the viewer has a usable RetroAchievements link: a username AND the
 * API key every RA call is signed with. One answer for the whole app — a
 * section, a search tab, a fetch — so the UI cannot show RA while the hooks
 * refuse to fetch it, or the other way round.
 *
 * A username without a key counts as not linked: no RA call can succeed
 * without the key, so showing RA data would only promise what it cannot fetch.
 * The server works that out (raLinked = username && key) because the key
 * itself never reaches the browser.
 */
export function useRaLinked(): boolean {
  const { data: session } = useSession()
  return session?.user?.raLinked === true
}
