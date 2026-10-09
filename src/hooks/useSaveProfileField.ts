import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'

/**
 * Saves one plain profile field (description, gender…) and refreshes the
 * session. The error is returned as state so the caller shows it inline;
 * success raises the toast.
 */
export function useSaveProfileField() {
  const { update } = useSession()
  const { T } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(field: string, value: string): Promise<boolean> {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/updateUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? T.editProfileModal.errorGeneric)
        return false
      }
      await update()
      notify.success(T.toast.saved)
      return true
    } catch {
      setError(T.editProfileModal.errorGeneric)
      return false
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, error, clearError: () => setError(null) }
}
