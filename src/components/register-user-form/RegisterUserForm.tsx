'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { IconUser, IconLock, IconMail, IconArrowRight } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import AuthTitle from '@/components/auth-title/AuthTitle'
import WelcomeEntryCurtain from '@/components/welcome-entry-curtain/WelcomeEntryCurtain'
import { useWelcomeEntry } from '@/hooks/useWelcomeEntry'
import { signupError } from '@/utils/apiErrors'
import { checkEmail, checkPassword, checkUsername, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@/utils/authValidation'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'

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
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(signupError(data.error, T))
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
      <AuthTitle>{T.registerForm.title}</AuthTitle>

      {error && (
        <Notice tone="danger" className="mb-5">{error}</Notice>
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
          loading={submitting}
          size="lg" className="w-full mt-2"
        >
          {submitting ? (T.registerForm.creating) : (
            <>
              {T.registerForm.createAccount}
              <IconArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

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
          className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors rounded focus-ring"
        >
          {T.registerForm.alreadyHaveAccountAction}
        </button>
      </p>
    </div>
  )
}
