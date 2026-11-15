import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Asks the server to send a reset link to an address. The answer is the same whether or not the address has an
 * account; the exceptions it tells plainly are email not being set up and being throttled.
 */
export function useForgotPassword() {
  const { T } = useLanguage()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send(email: string): Promise<boolean> {
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
        return true
      }
      const data = await res.json().catch(() => ({}))
      if (data.error === 'email-not-configured') setError(T.passwordReset.notConfigured)
      else if (res.status === 429) setError(T.passwordReset.tooMany)
      else setError(T.passwordReset.failed)
      return false
    } catch {
      setError(T.passwordReset.failed)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setSent(false)
    setError('')
    setSubmitting(false)
  }

  return { send, submitting, sent, error, reset }
}
