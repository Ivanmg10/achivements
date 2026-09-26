'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { IconUser, IconLock, IconArrowRight } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
import ForgotPasswordModal from '@/components/forgot-password-modal/ForgotPasswordModal'

export default function LoginUserForm({
  setIsLogin,
  isRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
  isRegister: boolean
}) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
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
        setError(T.loginForm.invalidCredentials)
        setSubmitting(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError(T.loginForm.invalidCredentials)
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{T.loginForm.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {isRegister && (
        <div role="status" className="mb-5 bg-success/20 border border-success/40 rounded-xl p-3">
          <p className="text-sm text-success">{T.loginForm.accountCreated}</p>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
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

        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg-main w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
        >
          {submitting ? (
            <>
              <Spinner size={16} />
              {T.loginForm.signingIn}
            </>
          ) : (
            <>
              {T.loginForm.signIn}
              <IconArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="text-center mt-4">
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-text-secondary hover:text-text-main text-sm underline underline-offset-2 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.passwordReset.forgotLink}
        </button>
      </p>

      <p className="text-text-secondary text-sm text-center mt-3">
        {T.loginForm.noAccountLead}{' '}
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.loginForm.noAccountAction}
        </button>
      </p>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  )
}
