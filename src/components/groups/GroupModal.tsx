'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import Image from 'next/image'
import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { GameGroup, GameGroupItem } from '@/types/types'
import type { GameCandidate } from '@/utils/gameCandidates'
import GroupModalGamePicker from '@/components/groups/group-modal-game-picker/GroupModalGamePicker'

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

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

export default function GroupModal({ isOpen, onClose, group, onSave }: Props) {
  const { T } = useLanguage()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedGames, setSelectedGames] = useState<GameCandidate[]>([])

  const isEditing = !!group

  useEffect(() => {
    if (isOpen) {
      setTitle(group?.title ?? '')
      setDescription(group?.description ?? '')
      setIcon(group?.icon ?? '')
      setIsPublic(group?.is_public ?? false)
      setError('')
      setSelectedGames([])
    }
  }, [isOpen, group])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError(T.groups.groupTitle); return }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-16 px-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-bg-card rounded-2xl w-full max-w-md flex flex-col text-text-main shadow-xl max-h-[80vh] overflow-hidden"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-base font-semibold">
                {isEditing ? T.groups.editGroup : T.groups.newGroup}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main"
                aria-label="Close"
              >
                <IconX className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-5 overflow-y-auto">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.groupTitle}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={T.groups.groupTitlePlaceholder}
                  maxLength={60}
                  className="bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.description}</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={T.groups.descriptionPlaceholder}
                  maxLength={200}
                  className="bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                />
              </div>

              {/* Icon */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.icon}</label>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-bg-main flex items-center justify-center shrink-0 overflow-hidden">
                    {icon ? (
                      isImageUrl(icon) ? (
                        <Image src={icon} alt="icon" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <span className="text-xl leading-none">{icon}</span>
                      )
                    ) : (
                      <span className="text-xl leading-none">📁</span>
                    )}
                  </div>
                  <input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder={T.groups.iconPlaceholder}
                    className="flex-1 bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                  />
                </div>
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between bg-bg-main rounded-lg px-3 py-2.5">
                <span className="text-sm text-text-main">{T.groups.isPublic}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic((p) => !p)}
                  className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-accent/70 ${isPublic ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Game search — only when creating */}
              {!isEditing && (
                <GroupModalGamePicker enabled={isOpen} selected={selectedGames} onChange={setSelectedGames} />
              )}

              {error && (
                <p role="alert" className="text-xs text-red-400">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg bg-bg-main text-text-secondary text-sm hover:text-text-main transition-colors"
                >
                  {T.groups.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? '…' : isEditing ? T.groups.save : T.groups.create}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
