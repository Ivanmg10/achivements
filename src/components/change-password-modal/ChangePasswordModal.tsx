'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import PasswordInput from '@/components/password-input/PasswordInput'
import { useLanguage } from '@/context/LanguageContext'
import { PASSWORD_MIN } from '@/utils/authValidation'

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
        id="pw-current"
        label={T.changePassword.current}
        value={current}
        onChange={(v) => { setCurrent(v); setError(null) }}
        disabled={loading || success}
      />
      <PasswordInput
        id="pw-new"
        label={T.changePassword.new}
        autoComplete="new-password"
        value={next}
        onChange={(v) => { setNext(v); setError(null) }}
        disabled={loading || success}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="pw-confirm" className="text-xs text-text-secondary uppercase tracking-wider">
          {T.changePassword.confirm}
        </label>
        <div className="relative">
          <input
            id="pw-confirm"
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null) }}
            disabled={loading || success}
            aria-describedby={mismatch ? 'pw-mismatch-error' : undefined}
            className={`bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 w-full transition-colors ${
              mismatch ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-accent'
            }`}
          />
        </div>
        {mismatch && <span id="pw-mismatch-error" role="alert" className="text-xs text-red-400">{T.editProfileModal.mismatch}</span>}
        {next.length > 0 && next.length < PASSWORD_MIN && (
          <span className="text-xs text-text-secondary">{minLength}</span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
      )}
      {success && (
        <p role="status" className="text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-2">
          {T.changePassword.changedSignIn}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={handleClose}
          disabled={loading}
          className="flex-1 bg-bg-main text-text-secondary rounded-xl py-3 hover:text-text-main transition-colors disabled:opacity-50"
        >
          {T.editProfileModal.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || success}
          className="flex-1 bg-accent text-bg-main font-bold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? T.editProfileModal.saving : T.editProfileModal.save}
        </button>
      </div>
    </CommonModal>
  )
}
