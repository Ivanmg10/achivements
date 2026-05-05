'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'

export type EditProfileField = 'name' | 'email' | 'avatar'

interface Props {
  isOpen: boolean
  onClose: () => void
  field: EditProfileField
  currentValue: string
}

const API_FIELD_MAP: Record<EditProfileField, string> = {
  name: 'username',
  email: 'email',
  avatar: 'avatar',
}

export default function EditProfileModal({ isOpen, onClose, field, currentValue }: Props) {
  const { update } = useSession()
  const { T } = useLanguage()

  const [newValue, setNewValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const label = T.editProfileModal.fields[field]
  const mismatch = newValue.length > 0 && confirmValue.length > 0 && newValue !== confirmValue
  const canSubmit = newValue.trim().length > 0 && newValue === confirmValue && !loading

  const handleClose = () => {
    setNewValue('')
    setConfirmValue('')
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
        body: JSON.stringify({ field: API_FIELD_MAP[field], value: newValue.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? T.editProfileModal.errorGeneric)
        return
      }

      await update({ [field]: newValue.trim() })
      setSuccess(true)
      setTimeout(handleClose, 1000)
    } catch {
      setError(T.editProfileModal.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const showAvatarPreview =
    field === 'avatar' &&
    newValue.trim().startsWith('http') &&
    newValue === confirmValue

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
        {field === 'avatar' && currentValue ? (
          <div className="flex items-center gap-3">
            <Image
              src={currentValue}
              alt="current avatar"
              width={48}
              height={48}
              className="rounded-full w-12 h-12 object-cover"
              unoptimized
            />
            <span className="text-sm text-text-secondary font-mono break-all">{currentValue}</span>
          </div>
        ) : (
          <div className="bg-bg-main rounded-xl px-4 py-3 text-text-secondary font-mono text-sm">
            {currentValue || '—'}
          </div>
        )}
      </div>

      {/* New value */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary uppercase tracking-wider">
          {T.editProfileModal.newLabel} {label}
        </label>
        <input
          type={field === 'email' ? 'email' : 'text'}
          value={newValue}
          onChange={(e) => { setNewValue(e.target.value); setError(null) }}
          placeholder={field === 'avatar' ? 'https://...' : ''}
          className="bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent w-full"
          disabled={loading || success}
        />
      </div>

      {/* Confirm value */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary uppercase tracking-wider">
          {T.editProfileModal.confirmLabel} {label}
        </label>
        <input
          type={field === 'email' ? 'email' : 'text'}
          value={confirmValue}
          onChange={(e) => { setConfirmValue(e.target.value); setError(null) }}
          placeholder={field === 'avatar' ? 'https://...' : ''}
          className={`bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 w-full transition-colors ${
            mismatch ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-accent'
          }`}
          disabled={loading || success}
        />
        {mismatch && (
          <span className="text-xs text-red-400">{T.editProfileModal.mismatch}</span>
        )}
      </div>

      {/* Avatar preview */}
      {showAvatarPreview && (
        <div className="flex items-center gap-3 bg-bg-main rounded-xl p-3">
          <Image
            src={newValue.trim()}
            alt="preview"
            width={48}
            height={48}
            className="rounded-full w-12 h-12 object-cover"
            unoptimized
            onError={() => setError(T.editProfileModal.errorAvatarLoad)}
          />
          <span className="text-xs text-text-secondary">{T.editProfileModal.avatarPreview}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
      )}

      {/* Success */}
      {success && (
        <p className="text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-2">
          {T.editProfileModal.success}
        </p>
      )}

      {/* Actions */}
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
