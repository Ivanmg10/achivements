'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'

export const DESCRIPTION_MAX = 280

/** The user's own words about themselves: a textarea that saves on demand. */
export default function UserDescriptionField() {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const { save, saving, error, clearError } = useSaveProfileField()
  const saved = session?.user?.description ?? ''
  const [draft, setDraft] = useState<string | null>(null)

  const text = draft ?? saved
  const dirty = text.trim() !== saved

  async function handleSave() {
    if (await save('description', text)) setDraft(null)
  }

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor="user-description" className="text-xs text-text-secondary">
        {T.userData.description}
      </label>
      <textarea
        id="user-description"
        value={text}
        onChange={(e) => { setDraft(e.target.value); clearError() }}
        maxLength={DESCRIPTION_MAX}
        rows={3}
        placeholder={T.userData.descriptionPlaceholder}
        className="bg-bg-card rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent w-full resize-y"
      />
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary tabular-nums">{text.length}/{DESCRIPTION_MAX}</span>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs rounded-xl bg-accent text-bg-main font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {saving ? T.editProfileModal.saving : T.editProfileModal.save}
          </button>
        )}
      </div>
    </div>
  )
}
