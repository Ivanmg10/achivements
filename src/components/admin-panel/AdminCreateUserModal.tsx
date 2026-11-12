'use client'

import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import Modal from '@/components/ui/Modal'
import type { AdminUser } from '@/types/user'
import { adminFetch } from '@/utils/adminFetch'
import { notify } from '@/lib/notify'
import { PASSWORD_MIN } from '@/utils/authValidation'
import Button from '@/components/ui/Button'
import { Field, fieldClass } from '@/components/ui/Input'
import Switch from '@/components/ui/Switch'
import Notice from '@/components/ui/Notice'

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

  const canSubmit = username.trim().length >= 3 && password.length >= PASSWORD_MIN && !loading

  const handleClose = () => {
    setUsername(''); setEmail(''); setPassword('')
    setIsAdmin(false); setError(null); setShowPass(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true); setError(null)
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() || undefined, password, admin: isAdmin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error creating user'); return }
      onCreated(data)
      notify.success(`${data.username} created`)
      handleClose()
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create user"
      footer={
        <>
          <Button onClick={handleClose} variant="quiet">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Username *">
          {(control) => (
            <input {...control} value={username} onChange={e => { setUsername(e.target.value); setError(null) }}
              autoFocus
              className={fieldClass()} />
          )}
        </Field>
        <Field label="Email">
          {(control) => (
            <input {...control} type="email" value={email} onChange={e => setEmail(e.target.value)}
              className={fieldClass()} />
          )}
        </Field>
        <Field label="Password *" hint={password.length > 0 && password.length < PASSWORD_MIN ? `Minimum ${PASSWORD_MIN} characters` : undefined}>
          {(control) => (
            <div className="relative">
              <input {...control} type={showPass ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                className={fieldClass({}, 'pr-10')} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                aria-pressed={showPass}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main" tabIndex={-1}>
                {showPass ? <IconEyeOff size={16} aria-hidden="true" /> : <IconEye size={16} aria-hidden="true" />}
              </button>
            </div>
          )}
        </Field>
        <div className="flex items-center gap-3">
          <Switch checked={isAdmin} onChange={setIsAdmin} aria-label="Admin privileges" />
          <span className="text-sm">Admin</span>
        </div>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  )
}
