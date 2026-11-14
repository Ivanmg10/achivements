'use client'

import { useId, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { GameGroup, GameGroupItem } from '@/types/types'
import type { GameCandidate } from '@/utils/gameCandidates'
import { GROUP_DESCRIPTION_MAX, GROUP_TITLE_MAX } from '@/utils/groupValidation'
import { plural } from '@/utils/utils'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import GroupModalGamePicker from '@/components/groups/group-modal-game-picker/GroupModalGamePicker'
import GroupModalPreview from '@/components/groups/group-modal-preview/GroupModalPreview'
import GroupModalIconPicker from '@/components/groups/group-modal-icon-picker/GroupModalIconPicker'
import GroupModalVisibility from '@/components/groups/group-modal-visibility/GroupModalVisibility'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { kickerClass } from '@/components/ui/Kicker'
import { groupError } from '@/utils/apiErrors'


type Props = {
  isOpen: boolean
  onClose: () => void
  group?: GameGroup & { items?: GameGroupItem[] }
  onSave: (data: {
    title: string
    description: string
    icon: string
    is_public: boolean
    initialGames?: GameCandidate[]
  }) => Promise<void>
}

/** A field's label with how much of its limit is used. */
function Counter({ htmlFor, label, length, max }: { htmlFor: string; label: string; length: number; max: number }) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className={kickerClass()}>{label}</label>
      <span aria-hidden="true" className={`text-[10px] tabular-nums ${length >= max ? 'text-danger' : 'text-text-secondary'}`}>{length}/{max}</span>
    </div>
  )
}

/**
 * Create or edit a group. Creating is two columns: a live preview, name,
 * description, icon and who sees it on one side, the games to start with on
 * the other; editing is the first column only.
 */
export default function GroupModal({ isOpen, onClose, group, onSave }: Props) {
  const { T, lang } = useLanguage()
  const titleId = useId()
  const descriptionId = useId()
  const formId = useId()
  const titleErrorId = useId()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [titleMissing, setTitleMissing] = useState(false)
  const [error, setError] = useState('')
  const [selectedGames, setSelectedGames] = useState<GameCandidate[]>([])

  const isEditing = !!group
  // An existing group shows its own games in the preview.
  const ownCovers = group ? (group.covers ?? group.items ?? []).map(coverSrc).filter((s): s is string => !!s) : undefined
  const ownCount = group ? (group.items?.length ?? group.game_count) : undefined

  // Opening (or switching to another group) fills the form; state, so while rendering.
  useWhenChanged([isOpen, group], () => {
    if (isOpen) {
      setTitle(group?.title ?? '')
      setDescription(group?.description ?? '')
      setIcon(group?.icon ?? '')
      setIsPublic(group?.is_public ?? false)
      setTitleMissing(false)
      setError('')
      setSelectedGames([])
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleMissing(true)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ title: title.trim(), description, icon, is_public: isPublic, initialGames: isEditing ? undefined : selectedGames })
      onClose()
    } catch (err: unknown) {
      setError(groupError(err instanceof Error ? err.message : null, T))
    } finally {
      setSaving(false)
    }
  }

  const submitLabel = isEditing
    ? T.groups.save
    : selectedGames.length > 0
      ? T.groups.createWith.replace('{games}', plural(selectedGames.length, T.plurals.games, lang))
      : T.groups.create

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isEditing ? 'md' : 'xl'}
      title={isEditing ? T.groups.editGroup : T.groups.newGroup}
      className="gap-4"
      footer={
        <>
          {error && <p role="alert" className="text-xs text-danger w-full text-right">{error}</p>}
          <Button type="button" onClick={onClose} variant="quiet">
            {T.groups.cancel}
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <div className={`grid gap-6 ${isEditing ? '' : 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'}`}>
          <div className="flex flex-col gap-4">
            <GroupModalPreview title={title} icon={icon} isPublic={isPublic} games={selectedGames} covers={ownCovers} gameCount={ownCount} />

            <div className="flex flex-col gap-1">
              <Counter htmlFor={titleId} label={T.groups.groupTitle} length={title.length} max={GROUP_TITLE_MAX} />
              <input
                id={titleId}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (e.target.value.trim()) setTitleMissing(false)
                }}
                placeholder={T.groups.groupTitlePlaceholder}
                maxLength={GROUP_TITLE_MAX}
                aria-invalid={titleMissing || undefined}
                aria-describedby={titleMissing ? titleErrorId : undefined}
                className={fieldClass({ size: 'sm', invalid: titleMissing })}
                autoFocus
              />
              {titleMissing && (
                <p id={titleErrorId} role="alert" className="text-xs text-danger">{T.groups.titleRequired}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Counter htmlFor={descriptionId} label={T.groups.description} length={description.length} max={GROUP_DESCRIPTION_MAX} />
              <textarea
                id={descriptionId}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={T.groups.descriptionPlaceholder}
                maxLength={GROUP_DESCRIPTION_MAX}
                rows={2}
                className={fieldClass({ size: 'sm', multiline: true }, 'h-auto! py-2 resize-none')}
              />
            </div>

            <GroupModalIconPicker value={icon} onChange={setIcon} />
            <GroupModalVisibility isPublic={isPublic} onChange={setIsPublic} />
          </div>

          {!isEditing && (
            <div className="md:border-l md:border-ink/5 md:pl-6">
              <GroupModalGamePicker enabled={isOpen} selected={selectedGames} onChange={setSelectedGames} />
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
