'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useLanguage } from '@/context/LanguageContext'
import { COUNTRIES, codeToFlag } from '@/utils/countries'

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

  const filtered = COUNTRIES.filter((c) =>
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
        const data = await res.json()
        setError(data.error ?? T.editProfileModal.errorGeneric)
        return
      }
      await update({ location: code })
      setSearch('')
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
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <h2 className="text-xl font-bold">{T.userData.location}</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={T.userData.searchCountry}
        aria-label={T.userData.searchCountry}
        className="bg-bg-main rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent w-full"
        autoFocus
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="flex flex-col gap-1 overflow-y-auto max-h-72">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">{T.userData.noResults}</p>
        ) : (
          filtered.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelect(country.code)}
              disabled={loading}
              aria-pressed={currentCode === country.code}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors disabled:opacity-50 ${
                currentCode === country.code
                  ? 'bg-accent text-bg-main'
                  : 'hover:bg-bg-main text-text-main'
              }`}
            >
              <span className="text-xl" aria-hidden="true">{codeToFlag(country.code)}</span>
              <span className="text-sm font-medium">{country.name}</span>
              <span className="text-xs text-current opacity-50 ml-auto" aria-hidden="true">{country.code}</span>
            </button>
          ))
        )}
      </div>
    </CommonModal>
  )
}
