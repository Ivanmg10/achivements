import { useCallback, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

/** An RA account the sign-up will link: what was typed, and what RA answered. */
export type RaSignupAccount = { username: string; apiKey: string; user: string; avatar: string }

/**
 * Checks an RA username and Web API key before signing up with them
 * (`POST /api/auth/ra/check`): RA's own name and picture come back for the
 * form. A refusal is kept as `error`, for the RA fields to show.
 */
export function useRaSignupCheck() {
  const { T } = useLanguage()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = useCallback(
    async (username: string, apiKey: string): Promise<RaSignupAccount | null> => {
      setChecking(true)
      setError(null)
      try {
        const res = await fetch('/api/auth/ra/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, apiKey }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const byCode: Record<string, string> = {
            invalid: T.raLoginModal.invalid,
            'ra-invalid': T.raLoginModal.invalid,
            'key-in-use': T.raLoginModal.keyInUse,
            'too-many': T.registerForm.raTooMany,
            'ra-unavailable': T.registerForm.raUnavailable,
          }
          setError(byCode[data.error] ?? T.raLoginModal.error)
          return null
        }
        return { username, apiKey, user: data.user, avatar: data.avatar }
      } catch (err) {
        console.error('[useRaSignupCheck]', err)
        setError(T.raLoginModal.error)
        return null
      } finally {
        setChecking(false)
      }
    },
    [T],
  )

  return { check, checking, error, clearError: useCallback(() => setError(null), []) }
}
