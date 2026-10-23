'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { IconUser, IconLock, IconMail, IconArrowRight } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
import SteamSignInDivider from '@/components/steam-sign-in-divider/SteamSignInDivider'
import WelcomeEntryCurtain from '@/components/welcome-entry-curtain/WelcomeEntryCurtain'
import RegisterUserFormRa from '@/components/register-user-form/register-user-form-ra/RegisterUserFormRa'
import RaLogo from '@/components/ra-logo/RaLogo'
import { useWelcomeEntry } from '@/hooks/useWelcomeEntry'
import type { RaSignupAccount } from '@/hooks/useRaSignupCheck'
import { checkEmail, checkPassword, checkUsername, PASSWORD_MIN, suggestUsername, USERNAME_MAX, USERNAME_MIN } from '@/utils/authValidation'
import Button from '@/components/ui/Button'

export default function RegisterUserForm({
  setIsLogin,
  setIsRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
  setIsRegister: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string; email?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  // Signing up with RetroAchievements: the section is open, and the account it checked.
  const [raOpen, setRaOpen] = useState(false)
  const [raAccount, setRaAccount] = useState<RaSignupAccount | null>(null)
  const { T } = useLanguage()
  const entry = useWelcomeEntry()
  const [entering, setEntering] = useState(false)

  const usernameRule = T.registerForm.usernameRule
    .replace('{min}', String(USERNAME_MIN))
    .replace('{max}', String(USERNAME_MAX))
  const passwordRule = T.registerForm.passwordRule.replace('{min}', String(PASSWORD_MIN))

  /** The server checks all of this again; this only saves a failed round trip. */
  function validate() {
    const next: typeof fieldErrors = {}
    const name = checkUsername(username)
    if (name === 'empty') next.username = T.registerForm.required
    else if (name === 'shape') next.username = usernameRule

    const pass = checkPassword(password)
    if (pass === 'empty') next.password = T.registerForm.required
    else if (pass === 'shape') next.password = passwordRule

    const address = checkEmail(email)
    if (address === 'empty') next.email = T.registerForm.required
    else if (address === 'shape') next.email = T.passwordReset.emailInvalid

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          email: email.trim(),
          ...(raAccount ? { ra: { username: raAccount.username, apiKey: raAccount.apiKey } } : {}),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const byCode: Record<string, string> = {
          'email-taken': T.registerForm.emailTaken,
          'key-in-use': T.raLoginModal.keyInUse,
          'ra-invalid': T.raLoginModal.invalid,
          'ra-unavailable': T.registerForm.raUnavailable,
        }
        setError(byCode[data.error] ?? (data.error || T.registerForm.errorCreating))
        setSubmitting(false)
        return
      }

      // Signed in at once and on to the welcome; if that sign-in fails, the account
      // exists all the same, so the login form says so and asks for it.
      const signedIn = await signIn('credentials', { username: username.trim(), password, redirect: false }).catch(() => null)
      if (signedIn?.ok) {
        // Into the welcome under the curtain; the button stays busy until the page goes.
        setEntering(true)
        entry.go()
        return
      }
      setIsLogin(true)
      setIsRegister(true)
    } catch {
      setError(T.registerForm.errorCreating)
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {entering && entry.animate && <WelcomeEntryCurtain phase="leaving" />}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{T.registerForm.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {error && (
        <div role="alert" className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {raOpen && (
        <RegisterUserFormRa
          account={raAccount}
          onChange={(account) => {
            setRaAccount(account)
            // RA's name as the username, unless one was already typed.
            if (account && !username.trim()) setUsername(suggestUsername(account.user))
          }}
          onClose={() => {
            setRaOpen(false)
            setRaAccount(null)
          }}
          disabled={submitting}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <AuthFormField
          label={T.registerForm.username}
          icon={<IconUser size={18} />}
          value={username}
          onChange={(v) => {
            setUsername(v)
            setFieldErrors((f) => ({ ...f, username: undefined }))
          }}
          hint={usernameRule}
          error={fieldErrors.username}
          autoComplete="username"
          required
          disabled={submitting}
        />

        <AuthFormField
          label={T.passwordReset.email}
          icon={<IconMail size={18} />}
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v)
            setFieldErrors((f) => ({ ...f, email: undefined }))
          }}
          hint={T.passwordReset.emailWhy}
          error={fieldErrors.email}
          autoComplete="email"
          required
          disabled={submitting}
        />

        <AuthFormField
          label={T.registerForm.password}
          icon={<IconLock size={18} />}
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v)
            setFieldErrors((f) => ({ ...f, password: undefined }))
          }}
          hint={passwordRule}
          error={fieldErrors.password}
          autoComplete="new-password"
          required
          disabled={submitting}
        />

        <Button
          type="submit"
          // With the RA section open, its account is checked first (or the section closed).
          disabled={submitting || (raOpen && !raAccount)}
          size="lg" className="w-full mt-2"
        >
          {submitting ? (
            <>
              <Spinner size={16} />
              {T.registerForm.creating}
            </>
          ) : (
            <>
              {T.registerForm.createAccount}
              <IconArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <SteamSignInDivider />

      {!raOpen && (
        <button
          type="button"
          onClick={() => setRaOpen(true)}
          className="mt-3 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-bg-card text-text-main border border-ink/15 hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <RaLogo height={16} />
          {T.registerForm.raCta}
        </button>
      )}

      <p className="text-text-secondary text-xs text-center mt-4">
        {T.registerForm.acceptTerms.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
          part === '{terms}' ? (
            <Link key={i} href="/terms" className="text-accent underline underline-offset-2">{T.terms.link}</Link>
          ) : part === '{privacy}' ? (
            <Link key={i} href="/privacy" className="text-accent underline underline-offset-2">{T.privacy.link}</Link>
          ) : (
            part
          ),
        )}
      </p>

      <p className="text-text-secondary text-sm text-center mt-5">
        {T.registerForm.alreadyHaveAccountLead}{' '}
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.registerForm.alreadyHaveAccountAction}
        </button>
      </p>
    </div>
  )
}
