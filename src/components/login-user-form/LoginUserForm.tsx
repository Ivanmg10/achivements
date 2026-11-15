'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { IconUser, IconLock, IconArrowRight } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import AuthTitle from '@/components/auth-title/AuthTitle'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'

export default function LoginUserForm({
  setIsLogin,
  isRegister,
  next = null,
  onForgot,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
  isRegister: boolean
  /** The own-site path the visitor was going to (see `safeNext`): said above the form, and where to go after signing in. */
  next?: string | null
  /** Opens the forgot-password dialog, which the page holds: this form is unmounted when the layout changes width. */
  onForgot: () => void
}) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { T } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Says what is actually missing, rather than "wrong credentials".
    if (!username.trim() || !password) {
      setError(T.loginForm.missingFields)
      return
    }

    setSubmitting(true)
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError(result?.error === 'too-many-attempts' ? T.loginForm.tooManyAttempts : T.loginForm.invalidCredentials)
        setSubmitting(false)
        return
      }

      router.push(next ?? '/')
      router.refresh()
    } catch {
      setError(T.loginForm.invalidCredentials)
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <AuthTitle>{T.loginForm.title}</AuthTitle>

      {next && !isRegister && (
        <Notice className="mb-5">{T.loginForm.needsAccount}</Notice>
      )}
      {isRegister && (
        <div role="status" className="mb-5 bg-success/20 border border-success/40 rounded-tile p-3">
          <p className="text-sm text-success">{T.loginForm.accountCreated}</p>
        </div>
      )}
      {error && (
        <Notice tone="danger" className="mb-5">{error}</Notice>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <AuthFormField
          label={T.loginForm.username}
          icon={<IconUser size={18} />}
          value={username}
          onChange={setUsername}
          autoComplete="username"
          required
          disabled={submitting}
        />

        <AuthFormField
          label={T.loginForm.password}
          icon={<IconLock size={18} />}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
          disabled={submitting}
        />

        <Button
          type="submit"
          loading={submitting}
          size="lg" className="w-full mt-2"
        >
          {submitting ? (T.loginForm.signingIn) : (
            <>
              {T.loginForm.signIn}
              <IconArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center mt-4">
        <button
          type="button"
          onClick={onForgot}
          className="relative tap-target text-text-secondary hover:text-text-main text-sm underline underline-offset-2 transition-colors rounded focus-ring"
        >
          {T.passwordReset.forgotLink}
        </button>
      </p>

      <p className="text-text-secondary text-sm text-center mt-3 sm:any-pointer-coarse:mt-6">
        {T.loginForm.noAccountLead}{' '}
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className="relative tap-target text-accent underline underline-offset-2 hover:text-accent-hover transition-colors rounded focus-ring"
        >
          {T.loginForm.noAccountAction}
        </button>
      </p>
    </div>
  )
}
