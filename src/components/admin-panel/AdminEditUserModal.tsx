'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import AdminLinkedAccounts from './admin-linked-accounts/AdminLinkedAccounts'
import { adminFetch } from '@/utils/adminFetch'
import { codeToFlag, findCountry, COUNTRIES } from '@/utils/countries'
import type { Country } from '@/utils/countries'
import type { AdminUser } from '@/types/user'
import { notify } from '@/lib/notify'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'
import Switch from '@/components/ui/Switch'
import Kicker from '@/components/ui/Kicker'
import Avatar from '@/components/ui/Avatar'

interface Props {
  isOpen: boolean
  onClose: () => void
  user: AdminUser
  onUpdated: (userId: number, field: string, value: unknown) => void
  onChanged: (userId: number, changes: Partial<AdminUser>) => void
  currentAdminId: number
}

type Field = 'username' | 'email' | 'avatar' | 'location' | 'admin'

export default function AdminEditUserModal({ isOpen, onClose, user, onUpdated, onChanged, currentAdminId }: Props) {
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

  const patch = async (field: Field, value: unknown) => {
    setSaving(field)
    setErrors(e => ({ ...e, [field]: '' }))
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, field, value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(e => ({ ...e, [field]: data.error ?? 'Error' }))
      } else {
        onUpdated(user.id, field, value)
        notify.success(`${user.username}: ${field} saved`)
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
    <Modal isOpen={isOpen} onClose={onClose} icon={<Avatar src={user.avatar} name={user.username} />} title={user.username} hint={`ID: ${user.id}`}>
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
            className={fieldClass({ size: 'sm' })}
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
            className={fieldClass({ size: 'sm' })}
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
              className={fieldClass({ size: 'sm' }, 'flex-1')}
              placeholder="https://..."
            />
            {(values.avatar as string) && (
              <Avatar src={values.avatar as string} name={user.username} size={32} />
            )}
          </div>
        </FieldRow>

        {/* Location */}
        <div className="flex flex-col gap-1">
          <Kicker as="span" size="md">Location</Kicker>
          {!showCountryPicker ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCountryPicker(true)}
                className="flex-1 bg-bg-main rounded-tile px-4 py-2.5 text-sm text-left flex items-center gap-2"
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
                  className="text-xs text-danger hover:text-danger px-2 py-1">Clear</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                className={fieldClass({ size: 'sm' })}
              />
              <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                {filteredCountries.map((c: Country) => (
                  <button key={c.code}
                    onClick={() => {
                      setValues(v => ({ ...v, location: c.code }))
                      setShowCountryPicker(false)
                      patch('location', c.code)
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-box hover:bg-bg-card text-sm text-left"
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
          {errors.location && <span className="text-xs text-danger">{errors.location}</span>}
        </div>

        {/* Admin toggle */}
        <div className="flex items-center justify-between">
          <Kicker as="span" size="md">Admin</Kicker>
          <div className="flex items-center gap-3">
            {user.id === currentAdminId && (
              <span className="text-xs text-text-secondary italic">Can&apos;t remove own admin</span>
            )}
            <Switch
              checked={values.admin as boolean}
              aria-label="Admin privileges"
              disabled={user.id === currentAdminId}
              onChange={(next) => {
                setValues(v => ({ ...v, admin: next }))
                patch('admin', next)
              }}
            />
          </div>
        </div>

        <AdminLinkedAccounts user={user} onUpdated={onChanged} />
      </div>
    </Modal>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={saving}
      size="sm" className="shrink-0">
      {saving ? '...' : 'Save'}
    </Button>
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
      <Kicker as="span" size="md">{label}</Kicker>
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        {canSave && <SaveButton saving={saving} onClick={onSave} />}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
