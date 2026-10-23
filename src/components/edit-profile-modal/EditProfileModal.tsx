'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'
import Notice from '@/components/ui/Notice'

/** The avatar has its own modal (`AvatarModal`). */
export type EditProfileField = 'name' | 'email'

interface Props {
  isOpen: boolean
  onClose: () => void
  field: EditProfileField
  currentValue: string
}

const API_FIELD_MAP: Record<EditProfileField, string> = {
  name: 'username',
  email: 'email',
}

export default function EditProfileModal({ isOpen, onClose, field, currentValue }: Props) {
  const { update } = useSession()
  const { T } = useLanguage()

  const [newValue, setNewValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const label = T.editProfileModal.fields[field]
  const mismatch = newValue.length > 0 && confirmValue.length > 0 && newValue !== confirmValue
  // The recovery address is the key to the account, so changing it takes the password.
  const needsPassword = field === 'email'
  const canSubmit =
    newValue.trim().length > 0 && newValue === confirmValue && (!needsPassword || password.length > 0) && !loading

  const handleClose = () => {
    setNewValue('')
    setConfirmValue('')
    setPassword('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/updateUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: API_FIELD_MAP[field],
          value: newValue.trim(),
          ...(needsPassword && { currentPassword: password }),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const byCode: Record<string, string> = {
          'wrong-password': T.changePassword.wrongPassword,
          'too-many-attempts': T.changePassword.tooManyAttempts,
        }
        setError(byCode[data.error] ?? data.error ?? T.editProfileModal.errorGeneric)
        return
      }

      // The server re-reads the saved profile into the session.
      await update()
      setSuccess(true)
      setTimeout(handleClose, 1000)
    } catch {
      setError(T.editProfileModal.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold">
        {T.editProfileModal.title} {label}
      </h2>

      {/* Current value */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary uppercase tracking-wider">
          {T.editProfileModal.current}
        </label>
        <div className="bg-bg-main rounded-xl px-4 py-3 text-text-secondary font-mono text-sm">
          {currentValue || '—'}
        </div>
      </div>

      {/* New value */}
      <div className="flex flex-col gap-1">
        <label htmlFor="edit-new-value" className="text-xs text-text-secondary uppercase tracking-wider">
          {T.editProfileModal.newLabel} {label}
        </label>
        <input
          id="edit-new-value"
          type={field === 'email' ? 'email' : 'text'}
          value={newValue}
          onChange={(e) => { setNewValue(e.target.value); setError(null) }}
          className={fieldClass()}
          disabled={loading || success}
          autoFocus
        />
      </div>

      {/* Confirm value */}
      <div className="flex flex-col gap-1">
        <label htmlFor="edit-confirm-value" className="text-xs text-text-secondary uppercase tracking-wider">
          {T.editProfileModal.confirmLabel} {label}
        </label>
        <input
          id="edit-confirm-value"
          type={field === 'email' ? 'email' : 'text'}
          value={confirmValue}
          onChange={(e) => { setConfirmValue(e.target.value); setError(null) }}
          aria-describedby={mismatch ? 'edit-mismatch-error' : undefined}
          className={fieldClass({ invalid: mismatch })}
          disabled={loading || success}
        />
        {mismatch && (
          <span id="edit-mismatch-error" role="alert" className="text-xs text-danger">{T.editProfileModal.mismatch}</span>
        )}
      </div>

      {needsPassword && (
        <div className="flex flex-col gap-1">
          <label htmlFor="edit-current-password" className="text-xs text-text-secondary uppercase tracking-wider">
            {T.changePassword.current}
          </label>
          <input
            id="edit-current-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null) }}
            className={fieldClass()}
            disabled={loading || success}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <Notice tone="danger">{error}</Notice>
      )}

      {/* Success */}
      {success && (
        <p role="status" className="text-sm text-success bg-success/10 ring-1 ring-inset ring-success/30 rounded-control px-4 py-2">
          {T.editProfileModal.success}
        </p>
      )}

      {/* Actions */}
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
