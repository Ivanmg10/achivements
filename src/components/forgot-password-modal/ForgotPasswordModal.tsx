'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IconMail, IconX } from '@tabler/icons-react'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
import { useLanguage } from '@/context/LanguageContext'

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const contentVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
}

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

  useEffect(() => {
    if (isOpen) return
    setEmail('')
    setSent(false)
    setError('')
    setSubmitting(false)
  }, [isOpen])

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
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-24 px-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={T.passwordReset.forgotTitle}
            className="bg-bg-card rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl border border-ink/5"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold">{T.passwordReset.forgotTitle}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors"
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
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-accent text-bg-main w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {submitting ? (
                      <>
                        <Spinner size={16} />
                        {T.passwordReset.sending}
                      </>
                    ) : (
                      T.passwordReset.send
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
