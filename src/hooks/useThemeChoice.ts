import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import type { Theme } from '@/types/types'

/**
 * Shows a theme at once and saves it on the account. If the save fails the
 * old theme comes back (rather than one that would vanish on reload) and
 * `saveError` says so, for the picker to show in place.
 */
export function useThemeChoice() {
  const { theme, setTheme } = useTheme()
  const { update } = useSession()
  const [saveError, setSaveError] = useState(false)

  async function choose(id: Theme): Promise<boolean> {
    const previous = theme
    setTheme(id)
    setSaveError(false)
    try {
      const res = await fetch('/api/updateTheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: id }),
      })
      if (!res.ok) throw new Error(`updateTheme ${res.status}`)
      await update()
      return true
    } catch (err) {
      console.error('[useThemeChoice]', err)
      setTheme(previous)
      setSaveError(true)
      return false
    }
  }

  return { theme, choose, saveError }
}
