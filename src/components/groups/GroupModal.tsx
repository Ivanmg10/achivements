'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
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

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const contentVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
}

const LABEL = 'text-[10px] uppercase tracking-widest text-text-secondary'
const FIELD = 'bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70'

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
      <label htmlFor={htmlFor} className={LABEL}>{label}</label>
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
  const headingId = useId()
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

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

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
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const submitLabel = isEditing
    ? T.groups.save
    : selectedGames.length > 0
      ? T.groups.createWith.replace('{games}', plural(selectedGames.length, T.plurals.games, lang))
      : T.groups.create

  // On <body>, so an animated (transformed) page wrapper does not become its frame.
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className={`bg-bg-card w-full h-full sm:h-auto sm:max-h-[88vh] sm:rounded-2xl flex flex-col text-text-main shadow-2xl ring-1 ring-ink/5 overflow-hidden ${isEditing ? 'sm:max-w-md' : 'sm:max-w-4xl'}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 shrink-0">
              <h2 id={headingId} className="text-lg font-bold">
                {isEditing ? T.groups.editGroup : T.groups.newGroup}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -m-1 rounded-lg hover:bg-ink/5 transition-colors text-text-secondary hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                aria-label={T.groups.close}
              >
                <IconX className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className={`flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 pb-5 grid gap-6 ${isEditing ? '' : 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'}`}>
                <div className="flex flex-col gap-4">
                  <GroupModalPreview title={title} icon={icon} isPublic={isPublic} games={selectedGames} />

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
                      className={`${FIELD} ${titleMissing ? 'ring-2 ring-danger' : ''}`}
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
                      className={`${FIELD} resize-none`}
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

              <div className="border-t border-ink/5 px-5 sm:px-6 py-3 flex flex-col gap-2 shrink-0">
                {error && (
                  <p role="alert" className="text-xs text-danger">{error}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-xl text-text-secondary text-sm hover:text-text-main hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {T.groups.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 px-5 rounded-xl bg-accent text-bg-main text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {saving ? '…' : submitLabel}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
