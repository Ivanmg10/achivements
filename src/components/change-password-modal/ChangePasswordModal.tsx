'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import PasswordInput from '@/components/ui/PasswordInput'
import { useLanguage } from '@/context/LanguageContext'
import { PASSWORD_MIN } from '@/utils/authValidation'
import Button from '@/components/ui/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const { T } = useLanguage()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm
  const canSubmit = current.length > 0 && next.length >= PASSWORD_MIN && next === confirm && !loading
  const minLength = T.changePassword.minLength.replace('{min}', String(PASSWORD_MIN))

  const handleClose = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/changePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const byCode: Record<string, string> = {
          'wrong-password': T.changePassword.wrongPassword,
          'too-many-attempts': T.changePassword.tooManyAttempts,
          'weak-password': minLength,
        }
        setError(byCode[data.error] ?? T.editProfileModal.errorGeneric)
        return
      }
      // A new password ends every session, this one too: say so, then sign in again.
      setSuccess(true)
      setTimeout(() => signOut({ callbackUrl: '/authPage' }), 1500)
    } catch {
      setError(T.editProfileModal.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold">{T.userConfig.changePassword}</h2>

      <PasswordInput
        label={T.changePassword.current}
        value={current}
        onChange={(v) => { setCurrent(v); setError(null) }}
        disabled={loading || success}
      />
      <PasswordInput
        label={T.changePassword.new}
        autoComplete="new-password"
        value={next}
        onChange={(v) => { setNext(v); setError(null) }}
        disabled={loading || success}
      />
      <PasswordInput
        label={T.changePassword.confirm}
        autoComplete="new-password"
        value={confirm}
        onChange={(v) => { setConfirm(v); setError(null) }}
        disabled={loading || success}
        error={mismatch ? T.editProfileModal.mismatch : undefined}
        hint={next.length > 0 && next.length < PASSWORD_MIN ? minLength : undefined}
      />

      {error && (
        <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
      )}
      {success && (
        <p role="status" className="text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-2">
          {T.changePassword.changedSignIn}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="secondary" size="lg" className="flex-1"
        >
          {T.editProfileModal.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || success}
          size="lg" className="flex-1"
        >
          {loading ? T.editProfileModal.saving : T.editProfileModal.save}
        </Button>
      </div>
    </CommonModal>
  )
}
