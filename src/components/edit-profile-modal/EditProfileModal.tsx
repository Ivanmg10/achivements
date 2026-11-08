'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
import { Field, fieldClass } from '@/components/ui/Input'
import Notice from '@/components/ui/Notice'
import Kicker from '@/components/ui/Kicker'

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
        <Kicker as="span" size="md">
          {T.editProfileModal.current}
        </Kicker>
        <div className="bg-bg-main rounded-tile px-4 py-3 text-text-secondary font-mono text-sm">
          {currentValue || '—'}
        </div>
      </div>

      {/* New value */}
      <Field label={`${T.editProfileModal.newLabel} ${label}`}>
        {(control) => (
          <input
            {...control}
            type={field === 'email' ? 'email' : 'text'}
            value={newValue}
            onChange={(e) => { setNewValue(e.target.value); setError(null) }}
            className={fieldClass()}
            disabled={loading || success}
            autoFocus
          />
        )}
      </Field>

      {/* Confirm value */}
      <Field label={`${T.editProfileModal.confirmLabel} ${label}`} error={mismatch ? T.editProfileModal.mismatch : undefined}>
        {(control) => (
          <input
            {...control}
            type={field === 'email' ? 'email' : 'text'}
            value={confirmValue}
            onChange={(e) => { setConfirmValue(e.target.value); setError(null) }}
            className={fieldClass({ invalid: mismatch })}
            disabled={loading || success}
          />
        )}
      </Field>

      {needsPassword && (
        <Field label={T.changePassword.current}>
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              className={fieldClass()}
              disabled={loading || success}
            />
          )}
        </Field>
      )}

      {/* Error */}
      {error && (
        <Notice tone="danger">{error}</Notice>
      )}

      {/* Success */}
      {success && (
        <Notice tone="success">{T.editProfileModal.success}</Notice>
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
