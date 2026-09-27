'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { IconArrowRight, IconLock } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
import { useLanguage } from '@/context/LanguageContext'
import { checkPassword, PASSWORD_MIN } from '@/utils/authValidation'

/**
 * The page the reset link opens: a new password, typed twice, plus the token
 * from the link. The token is checked on the server, so a stale or spent link
 * is only found out on submit — which is what it says then.
 */
export default function ResetPasswordForm() {
  const { T } = useLanguage()
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const passwordRule = T.registerForm.passwordRule.replace('{min}', String(PASSWORD_MIN))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const next: typeof fieldErrors = {}
    const rule = checkPassword(password)
    if (rule === 'empty') next.password = T.registerForm.required
    else if (rule === 'shape') next.password = passwordRule
    if (confirm !== password) next.confirm = T.passwordReset.mismatch
    setFieldErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/resetPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) setDone(true)
      else setError(data.error === 'invalid-token' ? T.passwordReset.invalidToken : T.registerForm.errorCreating)
    } catch {
      setError(T.registerForm.errorCreating)
    }
    setSubmitting(false)
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{T.passwordReset.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {!token ? (
        <p role="alert" className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3 text-sm text-danger">
          {T.passwordReset.missingToken}
        </p>
      ) : done ? (
        <p role="status" className="mb-5 bg-success/20 border border-success/40 rounded-xl p-3 text-sm text-success">
          {T.passwordReset.done}
        </p>
      ) : (
        <>
          {error && (
            <p role="alert" className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <AuthFormField
              label={T.passwordReset.newPassword}
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

            <AuthFormField
              label={T.passwordReset.confirm}
              icon={<IconLock size={18} />}
              type="password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v)
                setFieldErrors((f) => ({ ...f, confirm: undefined }))
              }}
              error={fieldErrors.confirm}
              autoComplete="new-password"
              required
              disabled={submitting}
            />

            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-bg-main w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {submitting ? (
                <>
                  <Spinner size={16} />
                  {T.passwordReset.saving}
                </>
              ) : (
                <>
                  {T.passwordReset.save}
                  <IconArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <p className="text-center mt-5">
        <Link
          href="/authPage"
          className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors text-sm rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.passwordReset.backToSignIn}
        </Link>
      </p>
    </div>
  )
}
