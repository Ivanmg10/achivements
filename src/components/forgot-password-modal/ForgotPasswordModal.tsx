'use client'

import { useState } from 'react'
import { IconMail } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

/**
 * Asks for the address on the account and has a reset link sent to it.
 *
 * The answer is the same whether or not that address is registered, so this
 * cannot be used to find out who has an account. The exception is email not
 * being set up on the server yet, which it says plainly instead of promising
 * a message that will never arrive.
 */
export default function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Closing starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (!isOpen) {
      setEmail('')
      setSent(false)
      setError('')
      setSubmitting(false)
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'email-not-configured') setError(T.passwordReset.notConfigured)
        else if (res.status === 429) setError(T.passwordReset.tooMany)
        else setError(T.passwordReset.failed)
      }
    } catch {
      setError(T.passwordReset.failed)
    }
    setSubmitting(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={T.passwordReset.forgotTitle}
      hint={sent ? undefined : T.passwordReset.forgotIntro}
    >
      {sent ? (
        <p role="status" className="text-sm text-success">
          {T.passwordReset.sent}
        </p>
      ) : (
        <>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <AuthFormField
              label={T.passwordReset.email}
              icon={<IconMail size={18} />}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
              disabled={submitting}
            />
            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? T.passwordReset.sending : T.passwordReset.send}
            </Button>
          </form>
        </>
      )}
    </Modal>
  )
}
