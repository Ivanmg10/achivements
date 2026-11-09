'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/context/LanguageContext'
import { COUNTRIES, codeToFlag } from '@/utils/countries'
import { notify } from '@/lib/notify'
import { fieldClass } from '@/components/ui/Input'
import Notice from '@/components/ui/Notice'
import { profileFieldError } from '@/utils/apiErrors'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentCode?: string | null
}

export default function LocationModal({ isOpen, onClose, currentCode }: Props) {
  const { update } = useSession()
  const { T } = useLanguage()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (code: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/updateUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'location', value: code }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(profileFieldError(data.error, T))
        return
      }
      await update()
      setSearch('')
      notify.success(T.toast.saved)
      onClose()
    } catch {
      setError(T.editProfileModal.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearch('')
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title={T.userData.location}>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={T.userData.searchCountry}
        aria-label={T.userData.searchCountry}
        className={fieldClass({ size: 'sm' })}
        autoFocus
      />

      {error && (
        <Notice tone="danger">{error}</Notice>
      )}

      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-80">
        {filtered.length === 0 ? (
          <p className="col-span-3 text-sm text-text-secondary text-center py-4">
            {T.userData.noResults}
          </p>
        ) : (
          filtered.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelect(country.code)}
              disabled={loading}
              aria-pressed={currentCode === country.code}
              className={`flex items-center gap-2 px-3 py-3 rounded-tile transition-all disabled:opacity-50 ${
                currentCode === country.code
                  ? 'bg-accent text-bg-main'
                  : 'bg-bg-main hover:bg-bg-card text-text-main'
              }`}
            >
              <span className="text-xl shrink-0" aria-hidden="true">
                {codeToFlag(country.code)}
              </span>
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {country.name}
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}