'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamSignup } from '@/hooks/useSteamSignup'
import { USERNAME_MAX, USERNAME_MIN } from '@/utils/authValidation'
import Spinner from '@/components/main-spinner/Spinner'
import SteamSignInButton from '@/components/steam-sign-in-button/SteamSignInButton'
import SteamSignupFormFields from '@/components/steam-signup-form-fields/SteamSignupFormFields'
import WelcomeEntryCurtain from '@/components/welcome-entry-curtain/WelcomeEntryCurtain'

/**
 * Where the Steam callback lands (/authPage?steam=…): signs in a known Steam
 * account straight away, or asks a new one for a username and an email.
 */
export default function SteamSignupForm({ outcome }: { outcome: string }) {
  const { T } = useLanguage()
  const { state, submitting, submitError, register, entering } = useSteamSignup(outcome)

  const s = T.steamAuth
  const messages: Record<string, string> = {
    failed: s.failed,
    unavailable: s.unavailable,
    expired: s.expired,
    'not-configured': s.notConfigured,
    'steam-taken': s.steamTaken,
    'username-taken': s.usernameTaken,
    'email-taken': T.registerForm.emailTaken,
    closed: s.closed,
    'too-many': s.tooMany,
    'invalid-username': T.registerForm.usernameRule
      .replace('{min}', String(USERNAME_MIN))
      .replace('{max}', String(USERNAME_MAX)),
    'invalid-email': T.passwordReset.emailInvalid,
  }
  const messageOf = (code: string) => messages[code] ?? s.failed

  return (
    <div className="w-full max-w-sm mx-auto">
      {entering && <WelcomeEntryCurtain phase="leaving" />}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{s.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {(state.status === 'loading' || state.status === 'signed-in') && (
        <div role="status" className="flex flex-col items-center gap-3 py-6 text-text-secondary text-sm">
          <Spinner size={28} />
          {s.checking}
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex flex-col gap-3">
          <div role="alert" className="bg-danger/10 ring-1 ring-inset ring-danger/30 rounded-control p-3">
            <p className="text-sm text-danger">{messageOf(state.error)}</p>
          </div>
          <SteamSignInButton label={s.tryAgain} />
        </div>
      )}

      {state.status === 'form' && (
        <SteamSignupFormFields
          profile={state.profile}
          submitting={submitting}
          error={submitError ? messageOf(submitError) : ''}
          onSubmit={register}
        />
      )}

      <p className="text-center mt-5">
        <Link
          href="/authPage"
          className="text-text-secondary hover:text-text-main text-sm underline underline-offset-2 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {s.back}
        </Link>
      </p>
    </div>
  )
}
