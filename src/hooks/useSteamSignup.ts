'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/** What the Steam sign-up form starts from (GET /api/auth/steam/register). */
export type SteamSignupProfile = { persona: string; avatar: string | null; username: string }

export type SteamSignupState =
  | { status: 'loading' }
  | { status: 'signed-in' }
  | { status: 'form'; profile: SteamSignupProfile }
  /** A server error code (`expired`, `failed`, `unavailable`…), shown by the form. */
  | { status: 'error'; error: string }

async function signInWithSteam(): Promise<boolean> {
  const result = await signIn('steam', { redirect: false })
  return Boolean(result?.ok)
}

/** After Steam sends the user back: sign in when the account exists, otherwise offer the sign-up. */
async function loadSteamSignup(): Promise<SteamSignupState> {
  try {
    const res = await fetch('/api/auth/steam/register')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { status: 'error', error: data.error ?? 'failed' }
    if (!data.registered) return { status: 'form', profile: data as SteamSignupProfile }
    return (await signInWithSteam()) ? { status: 'signed-in' } : { status: 'error', error: 'failed' }
  } catch {
    return { status: 'error', error: 'failed' }
  }
}

/**
 * The page /authPage?steam=<outcome> lands on from the Steam callback: `1` when
 * Steam confirmed the account, or why it did not (`failed`, `unavailable`).
 */
export function useSteamSignup(outcome: string) {
  const router = useRouter()
  const [state, setState] = useState<SteamSignupState>(() =>
    outcome === '1' ? { status: 'loading' } : { status: 'error', error: outcome },
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (outcome !== '1' || hasFetched.current) return
    hasFetched.current = true
    loadSteamSignup().then(setState)
  }, [outcome])

  useEffect(() => {
    if (state.status !== 'signed-in') return
    router.push('/')
    router.refresh()
  }, [state.status, router])

  async function register(username: string, email: string) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/auth/steam/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? 'failed')
        setSubmitting(false)
        return
      }
      if (await signInWithSteam()) {
        setState({ status: 'signed-in' })
      } else {
        setSubmitError('failed')
        setSubmitting(false)
      }
    } catch {
      setSubmitError('failed')
      setSubmitting(false)
    }
  }

  return { state, submitting, submitError, register }
}
