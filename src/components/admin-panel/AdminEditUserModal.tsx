'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import CommonModal from '../common-modal/CommonModal'
import { codeToFlag, findCountry, COUNTRIES } from '@/utils/countries'
import type { Country } from '@/utils/countries'
import type { AdminUser } from '@/types/user'

interface Props {
  isOpen: boolean
  onClose: () => void
  user: AdminUser
  onUpdated: (userId: number, field: string, value: unknown) => void
  currentAdminId: number
}

type Field = 'username' | 'email' | 'avatar' | 'location' | 'admin'

export default function AdminEditUserModal({ isOpen, onClose, user, onUpdated, currentAdminId }: Props) {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    username: user.username,
    email: user.email ?? '',
    avatar: user.avatar ?? '',
    location: user.location ?? '',
    admin: user.admin,
  })
  const [saving, setSaving] = useState<Field | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  useEffect(() => {
    setValues({
      username: user.username,
      email: user.email ?? '',
      avatar: user.avatar ?? '',
      location: user.location ?? '',
      admin: user.admin,
    })
    setErrors({})
    setCountrySearch('')
    setShowCountryPicker(false)
  }, [user.id, isOpen])

  const patch = async (field: Field, value: unknown) => {
    setSaving(field)
    setErrors(e => ({ ...e, [field]: '' }))
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, field, value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(e => ({ ...e, [field]: data.error ?? 'Error' }))
      } else {
        onUpdated(user.id, field, value)
      }
    } catch {
      setErrors(e => ({ ...e, [field]: 'Something went wrong' }))
    } finally {
      setSaving(null)
    }
  }

  const filteredCountries = COUNTRIES.filter((c: Country) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const currentLocation = values.location as string

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-3 mb-1 pt-2">
        {user.avatar ? (
          <Image src={user.avatar} alt={user.username} width={40} height={40}
            className="rounded-full w-10 h-10 object-cover shrink-0" unoptimized />
        ) : (
          <div className="rounded-full w-10 h-10 bg-bg-main flex items-center justify-center shrink-0">
            <span className="text-xs text-text-secondary font-bold">{user.username[0]?.toUpperCase()}</span>
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{user.username}</h2>
          <p className="text-xs text-text-secondary font-mono">ID: {user.id}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* Username */}
        <FieldRow
          label="Username"
          error={errors.username}
          saving={saving === 'username'}
          onSave={() => patch('username', (values.username as string).trim())}
          canSave={(values.username as string).trim().length >= 3 && (values.username as string).trim() !== user.username}
        >
          <input
            value={values.username as string ?? ''}
            onChange={e => setValues(v => ({ ...v, username: e.target.value }))}
            className="bg-bg-main rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent w-full"
          />
        </FieldRow>

        {/* Email */}
        <FieldRow
          label="Email"
          error={errors.email}
          saving={saving === 'email'}
          onSave={() => patch('email', (values.email as string).trim() || null)}
          canSave={(values.email as string) !== (user.email ?? '')}
        >
          <input
            type="email"
            value={values.email as string ?? ''}
            onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
            className="bg-bg-main rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent w-full"
          />
        </FieldRow>

        {/* Avatar */}
        <FieldRow
          label="Avatar URL"
          error={errors.avatar}
          saving={saving === 'avatar'}
          onSave={() => patch('avatar', (values.avatar as string).trim() || null)}
          canSave={(values.avatar as string) !== (user.avatar ?? '')}
        >
          <div className="flex items-center gap-2">
            <input
              value={values.avatar as string ?? ''}
              onChange={e => setValues(v => ({ ...v, avatar: e.target.value }))}
              className="bg-bg-main rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent flex-1"
              placeholder="https://..."
            />
            {(values.avatar as string) && (
              <Image src={values.avatar as string} alt="preview" width={32} height={32}
                className="rounded-full w-8 h-8 object-cover shrink-0" unoptimized
                onError={() => {}} />
            )}
          </div>
        </FieldRow>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary uppercase tracking-wider">Location</span>
          {!showCountryPicker ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCountryPicker(true)}
                className="flex-1 bg-bg-main rounded-xl px-4 py-2.5 text-sm text-left flex items-center gap-2"
              >
                {currentLocation ? (
                  <>
                    <span className="text-base" aria-hidden="true">{codeToFlag(currentLocation)}</span>
                    <span>{findCountry(currentLocation)?.name ?? currentLocation}</span>
                  </>
                ) : (
                  <span className="text-text-secondary italic">Not set</span>
                )}
              </button>
              {currentLocation !== (user.location ?? '') && (
                <SaveButton saving={saving === 'location'} onClick={() => patch('location', currentLocation || null)} />
              )}
              {currentLocation && (
                <button onClick={() => { setValues(v => ({ ...v, location: '' })); patch('location', null) }}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1">Clear</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                className="bg-bg-main rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent w-full"
              />
              <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                {filteredCountries.map((c: Country) => (
                  <button key={c.code}
                    onClick={() => {
                      setValues(v => ({ ...v, location: c.code }))
                      setShowCountryPicker(false)
                      patch('location', c.code)
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-card text-sm text-left"
                  >
                    <span className="text-base" aria-hidden="true">{codeToFlag(c.code)}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowCountryPicker(false)}
                className="text-xs text-text-secondary hover:text-text-main text-left px-1">Cancel</button>
            </div>
          )}
          {errors.location && <span className="text-xs text-red-400">{errors.location}</span>}
        </div>

        {/* Admin toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary uppercase tracking-wider">Admin</span>
          <div className="flex items-center gap-3">
            {user.id === currentAdminId && (
              <span className="text-xs text-text-secondary italic">Can't remove own admin</span>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={values.admin as boolean}
              aria-label="Admin privileges"
              disabled={user.id === currentAdminId}
              onClick={() => {
                const next = !(values.admin as boolean)
                setValues(v => ({ ...v, admin: next }))
                patch('admin', next)
              }}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
                user.id === currentAdminId ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              } ${values.admin ? 'bg-accent' : 'bg-bg-main'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${values.admin ? 'translate-x-4' : 'translate-x-0'}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* RA / Steam info (read-only) */}
        {(user.rausername || user.steamusername) && (
          <div className="bg-bg-main rounded-xl p-3 flex flex-col gap-2">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Connected accounts</span>
            {user.rausername && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary text-xs">RA:</span>
                <span className="font-medium">{user.ra_display ?? user.rausername}</span>
              </div>
            )}
            {user.steamusername && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary text-xs">Steam:</span>
                <span className="font-medium">{user.steamusername}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={onClose}
        className="w-full bg-bg-main text-text-secondary rounded-xl py-3 hover:text-text-main transition-colors text-sm mt-1">
        Close
      </button>
    </CommonModal>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="shrink-0 bg-accent text-bg-main text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-40">
      {saving ? '...' : 'Save'}
    </button>
  )
}

function FieldRow({
  label, children, error, saving, onSave, canSave,
}: {
  label: string
  children: React.ReactNode
  error?: string
  saving: boolean
  onSave: () => void
  canSave: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        {canSave && <SaveButton saving={saving} onClick={onSave} />}
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
