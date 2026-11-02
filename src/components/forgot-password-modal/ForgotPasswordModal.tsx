'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconMail, IconX } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
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

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

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
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} aria-label={T.passwordReset.forgotTitle} size="sm" showClose={false} className="gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold">{T.passwordReset.forgotTitle}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-chip text-text-secondary hover:text-text-main transition-colors"
              >
                <IconX className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <p role="status" className="text-sm text-success">
                {T.passwordReset.sent}
              </p>
            ) : (
              <>
                <p className="text-sm text-text-secondary">{T.passwordReset.forgotIntro}</p>

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
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Spinner size={16} />
                        {T.passwordReset.sending}
                      </>
                    ) : (
                      T.passwordReset.send
                    )}
                  </Button>
                </form>
              </>
            )}
          </Modal>
      )}
    </AnimatePresence>
  )
}
