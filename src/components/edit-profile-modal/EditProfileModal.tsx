'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import Button from '@/components/ui/Button'
import { Field, fieldClass } from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
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
  const { T } = useLanguage()
  const { save, saving, error, clearError } = useSaveProfileField()

  const [newValue, setNewValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [password, setPassword] = useState('')

  const texts = T.editProfileModal.fields[field]
  // Only the address asks to be typed twice: a typo in it locks the account's recovery away.
  const confirmLabel = 'confirmLabel' in texts ? texts.confirmLabel : null
  const mismatch = confirmLabel !== null && newValue.length > 0 && confirmValue.length > 0 && newValue !== confirmValue
  // The recovery address is the key to the account, so changing it takes the password.
  const needsPassword = field === 'email'
  const canSubmit =
    newValue.trim().length > 0 && (confirmLabel === null || newValue === confirmValue) && (!needsPassword || password.length > 0) && !saving

  const handleClose = () => {
    setNewValue('')
    setConfirmValue('')
    setPassword('')
    clearError()
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    // The hook toasts the success and re-reads the session; the dialog closes on it.
    if (await save(API_FIELD_MAP[field], newValue.trim(), needsPassword ? { currentPassword: password } : {})) handleClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title={texts.title}
      footer={
        <>
          <Button onClick={handleClose} disabled={saving} variant="quiet">
            {T.editProfileModal.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={saving}>
            {T.editProfileModal.save}
          </Button>
        </>
      }
    >

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
      <Field label={texts.newLabel}>
        {(control) => (
          <input
            {...control}
            type={field === 'email' ? 'email' : 'text'}
            value={newValue}
            onChange={(e) => { setNewValue(e.target.value); clearError() }}
            className={fieldClass()}
            disabled={saving}
            autoFocus
          />
        )}
      </Field>

      {/* Confirm value */}
      {confirmLabel !== null && (
        <Field label={confirmLabel} error={mismatch ? T.editProfileModal.mismatch : undefined}>
          {(control) => (
            <input
              {...control}
              type="email"
              value={confirmValue}
              onChange={(e) => { setConfirmValue(e.target.value); clearError() }}
              className={fieldClass({ invalid: mismatch })}
              disabled={saving}
            />
          )}
        </Field>
      )}

      {needsPassword && (
        <PasswordInput
          label={T.changePassword.current}
          value={password}
          onChange={(v) => { setPassword(v); clearError() }}
          disabled={saving}
        />
      )}

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  )
}
