'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useWhenChanged } from '@/hooks/useWhenChanged'

/** What following a verification link ended in, as the route reports it. */
export type VerificationOutcome = 'verified' | 'expired' | 'mismatch'

export type ResendState = 'idle' | 'sending' | 'sent' | 'failed'

const OUTCOMES: VerificationOutcome[] = ['verified', 'expired', 'mismatch']

/**
 * The state behind the "confirm your email" notice: what came back from
 * following a link, and sending a new one.
 *
 * The address itself is never sent — the endpoint reads it off the account —
 * so this cannot be turned into a way to mail strangers from our domain.
 */
export function useEmailVerification() {
  const { data: session, update } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const handled = useRef(false)

  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null)
  const [resendState, setResendState] = useState<ResendState>('idle')

  const param = searchParams.get('email')

  // What the link ended in is state, so it is read while rendering; the rest is the effect.
  useWhenChanged([param], () => {
    if (param && OUTCOMES.includes(param as VerificationOutcome)) setOutcome(param as VerificationOutcome)
  })

  useEffect(() => {
    if (!param || handled.current) return
    handled.current = true

    // The address was confirmed in the database; pull the fresh row in.
    if (param === 'verified') update()
    // Drop ?email= so a refresh does not replay the message.
    router.replace(pathname)
  }, [param, pathname, router, update])

  const resend = useCallback(async () => {
    setResendState('sending')
    try {
      const res = await fetch('/api/auth/resendVerification', { method: 'POST' })
      if (!res.ok) throw new Error(`Resend failed (${res.status})`)
      setResendState('sent')
    } catch (err) {
      console.error('[useEmailVerification]', err)
      setResendState('failed')
    }
  }, [])

  const email = session?.user?.email
  const verified = session?.user?.emailVerified === true

  return {
    /** There is an address on the account and it has not been confirmed. */
    unverified: Boolean(email) && !verified,
    outcome,
    resendState,
    resend,
  }
}
