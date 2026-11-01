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
      <span className="flex items-center justify-between gap-3">
        <label htmlFor="user-description" className="text-[0.8125rem] font-semibold text-text-secondary">
          {T.userData.description}
        </label>
        <span className="text-[0.8125rem] text-text-secondary tabular-nums">{text.length} / {DESCRIPTION_MAX}</span>
      </span>
      <textarea
        id="user-description"
        value={text}
        onChange={(e) => { setDraft(e.target.value); clearError() }}
        maxLength={DESCRIPTION_MAX}
        rows={3}
        placeholder={T.userData.descriptionPlaceholder}
        className={fieldClass({ multiline: true }, 'h-auto! py-3 flex-1 min-h-16 [resize:var(--area-resize)]')}
      />
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-3 empty:hidden">
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
