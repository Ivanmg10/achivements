'use client'

import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function PasswordInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-secondary uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent w-full pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main transition-colors"
          tabIndex={-1}
        >
          {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        </button>
      </div>
    </div>
  )
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
  const canSubmit = current.length > 0 && next.length >= 6 && next === confirm && !loading

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
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? T.editProfileModal.errorGeneric)
        return
      }
      setSuccess(true)
      setTimeout(handleClose, 1200)
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
        value={next}
        onChange={(v) => { setNext(v); setError(null) }}
        disabled={loading || success}
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary uppercase tracking-wider">
          {T.changePassword.confirm}
        </label>
        <div className="relative">
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null) }}
            disabled={loading || success}
            className={`bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 w-full transition-colors ${
              mismatch ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-accent'
            }`}
          />
        </div>
        {mismatch && <span className="text-xs text-red-400">{T.editProfileModal.mismatch}</span>}
        {next.length > 0 && next.length < 6 && (
          <span className="text-xs text-text-secondary">{T.changePassword.minLength}</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-2">
          {T.editProfileModal.success}
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
