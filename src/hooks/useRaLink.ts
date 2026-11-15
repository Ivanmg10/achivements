import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Links a RetroAchievements account by username and Web API key: the server
 * asks RA for the profile itself and stores what RA answers, then the session
 * is read again. A refusal is returned as `error`, for the form to show next
 * to the fields; success is the caller's to announce.
 */
export function useRaLink() {
  const { update } = useSession()
  const { T } = useLanguage()
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const link = useCallback(
    async (username: string, apiKey: string): Promise<boolean> => {
      if (!username || !apiKey) return false
      setIsLinking(true)
      setError(null)
      try {
        const res = await fetch('/api/updateRaUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, apiKey }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const byCode: Record<string, string> = {
            'ra-invalid': T.raLoginModal.invalid,
            'key-in-use': T.raLoginModal.keyInUse,
          }
          setError(byCode[data.error] ?? T.raLoginModal.error)
          return false
        }
        await update()
        return true
      } catch (err) {
        console.error('[useRaLink]', err)
        setError(T.raLoginModal.error)
        return false
      } finally {
        setIsLinking(false)
      }
    },
    [update, T],
  )

  return { link, isLinking, error, clearError: () => setError(null) }
}
