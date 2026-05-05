'use client'

import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import CommonModal from '../common-modal/CommonModal'
import type { AdminUser } from '@/types/user'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (user: AdminUser) => void
}

export default function AdminCreateUserModal({ isOpen, onClose, onCreated }: Props) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = username.trim().length >= 3 && password.length >= 6 && !loading

  const handleClose = () => {
    setUsername(''); setEmail(''); setPassword('')
    setIsAdmin(false); setError(null); setShowPass(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() || undefined, password, admin: isAdmin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error creating user'); return }
      onCreated(data)
      handleClose()
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold">Create user</h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="create-username" className="text-xs text-text-secondary uppercase tracking-wider">Username *</label>
          <input id="create-username" value={username} onChange={e => { setUsername(e.target.value); setError(null) }}
            autoFocus
            className="bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="create-email" className="text-xs text-text-secondary uppercase tracking-wider">Email</label>
          <input id="create-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="create-password" className="text-xs text-text-secondary uppercase tracking-wider">Password *</label>
          <div className="relative">
            <input id="create-password" type={showPass ? 'text' : 'password'} value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              className="bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent w-full pr-10" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              aria-pressed={showPass}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main" tabIndex={-1}>
              {showPass ? <IconEyeOff size={16} aria-hidden="true" /> : <IconEye size={16} aria-hidden="true" />}
            </button>
          </div>
          {password.length > 0 && password.length < 6 && (
            <span className="text-xs text-text-secondary">Minimum 6 characters</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isAdmin}
            onClick={() => setIsAdmin(v => !v)}
            aria-label="Admin privileges"
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isAdmin ? 'bg-accent' : 'bg-bg-main'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAdmin ? 'translate-x-4' : 'translate-x-0'}`} aria-hidden="true" />
          </button>
          <span className="text-sm">Admin</span>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-3 mt-2">
        <button onClick={handleClose} className="flex-1 bg-bg-main text-text-secondary rounded-xl py-3 hover:text-text-main transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="flex-1 bg-accent text-bg-main font-bold rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </CommonModal>
  )
}
