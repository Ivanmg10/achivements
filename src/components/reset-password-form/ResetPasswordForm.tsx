'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { IconArrowRight, IconLock } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import { useLanguage } from '@/context/LanguageContext'
import { checkPassword, PASSWORD_MIN } from '@/utils/authValidation'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'

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
      else setError(data.error === 'invalid-token' ? T.passwordReset.invalidToken : T.passwordReset.saveFailed)
    } catch {
      setError(T.passwordReset.saveFailed)
    }
    setSubmitting(false)
  }

  return (
    <div className="w-full max-w-sm mx-auto enter-card">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{T.passwordReset.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {!token ? (
        <Notice tone="danger" className="mb-5">{T.passwordReset.missingToken}</Notice>
      ) : done ? (
        <Notice tone="success" className="mb-5">{T.passwordReset.done}</Notice>
      ) : (
        <>
          {error && (
            <Notice tone="danger" className="mb-5">{error}</Notice>
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

            <Button
              type="submit"
              loading={submitting}
              size="lg" className="w-full mt-2"
            >
              {submitting ? (T.passwordReset.saving) : (
                <>
                  {T.passwordReset.save}
                  <IconArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </>
      )}

      <p className="text-center mt-5">
        <Link
          href="/authPage"
          className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors text-sm rounded focus-ring"
        >
          {T.passwordReset.backToSignIn}
        </Link>
      </p>
    </div>
  )
}
