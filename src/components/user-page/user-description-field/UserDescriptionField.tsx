'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'

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
    <div className="flex flex-col gap-2 min-w-0 flex-1">
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
        className={fieldClass({}, 'h-auto! py-2.5 text-sm flex-1 min-h-20 resize-y')}
      />
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary tabular-nums">{text.length}/{DESCRIPTION_MAX}</span>
        {dirty && (
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
          >
            {saving ? T.editProfileModal.saving : T.editProfileModal.save}
          </Button>
        )}
      </div>
    </div>
  )
}
