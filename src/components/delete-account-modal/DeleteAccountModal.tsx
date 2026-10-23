'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import CommonModal from '@/components/common-modal/CommonModal'
import PasswordInput from '@/components/ui/PasswordInput'
import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'

/** Asks for the password once more, then deletes the account and signs out. */
export default function DeleteAccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const D = T.deleteAccount

  const handleClose = () => {
    setPassword('')
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    if (!password || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const byCode: Record<string, string> = {
          'wrong-password': D.wrongPassword,
          'too-many-attempts': D.tooManyAttempts,
          'last-admin': D.lastAdmin,
        }
        setError(byCode[data.error] ?? T.editProfileModal.errorGeneric)
        setLoading(false)
        return
      }
      // The account is gone, so is the session: back to the landing page.
      await signOut({ callbackUrl: '/' })
    } catch {
      setError(T.editProfileModal.errorGeneric)
      setLoading(false)
    }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold">{D.title}</h2>
      <p className="text-sm text-text-secondary">{D.confirmText}</p>

      <PasswordInput
        label={D.password}
        value={password}
        onChange={(v) => { setPassword(v); setError(null) }}
        disabled={loading}
      />

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="flex gap-3 mt-2">
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="secondary" size="lg" className="flex-1"
        >
          {T.editProfileModal.cancel}
        </Button>
        <Button
          onClick={handleDelete}
          disabled={!password || loading}
          variant="danger" size="lg" className="flex-1"
        >
          {loading ? D.deleting : D.confirm}
        </Button>
      </div>
    </CommonModal>
  )
}
