'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { IconChevronDown, IconLink, IconPhotoUp, IconUser, IconX } from '@tabler/icons-react'
import CommonModal from '@/components/common-modal/CommonModal'
import Spinner from '@/components/main-spinner/Spinner'
import { useAvatarUpload } from '@/hooks/useAvatarUpload'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'
import { useLanguage } from '@/context/LanguageContext'
import { buttonClass } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'

const BUTTON = 'flex-1'
const PRIMARY = buttonClass('primary', 'md', BUTTON)
const SECONDARY = buttonClass('secondary', 'md', `${BUTTON} cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70`)

/**
 * The profile picture, on its own: the picture as it will look, big and
 * round; a picture from the device (picked or dropped on it), shown before
 * it is used; and, folded away, a link to one. Errors stay in the modal, next
 * to what caused them; using a picture toasts and closes.
 */
export default function AvatarModal({ isOpen, onClose, current }: { isOpen: boolean; onClose: () => void; current?: string | null }) {
  const { T } = useLanguage()
  const t = T.editProfileModal
  const inputId = useId()
  const upload = useAvatarUpload()
  const link = useSaveProfileField()
  const [dragging, setDragging] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [linkBroken, setLinkBroken] = useState(false)

  const linkValid = url.trim().startsWith('https://')
  const shown = upload.preview ?? (linkValid && !linkBroken ? url.trim() : current) ?? null
  const error = upload.error ?? (linkBroken ? t.errorAvatarLoad : link.error)

  function close() {
    upload.reset()
    setUrl('')
    setLinkOpen(false)
    setLinkBroken(false)
    link.clearError()
    onClose()
  }

  async function saveUpload() {
    if (await upload.save()) close()
  }

  async function saveLink() {
    if (!linkValid || linkBroken) return
    if (await link.save('avatar', url.trim())) close()
  }

  return (
    <CommonModal isOpen={isOpen} onClose={close} showClose={false}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{t.avatarTitle}</h2>
          <p className="text-sm text-text-secondary">{t.avatarHint}</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t.close}
          className="w-9 h-9 -mr-1 -mt-1 shrink-0 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconX size={18} aria-hidden="true" />
        </button>
      </div>

      <label
        htmlFor={inputId}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          upload.pick(e.dataTransfer.files?.[0])
        }}
        className={`group flex flex-col items-center gap-3 rounded-2xl p-5 cursor-pointer transition ring-1 ring-inset has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70 ${
          dragging ? 'bg-accent/10 ring-accent' : 'bg-bg-main ring-ink/10 hover:ring-ink/25'
        }`}
      >
        <span className="relative">
          {shown ? (
            <Image
              src={shown}
              alt={t.avatarPreview}
              width={128}
              height={128}
              unoptimized
              onError={() => { if (shown === url.trim()) setLinkBroken(true) }}
              className={`w-32 h-32 rounded-full object-cover ring-4 ${upload.picked ? 'ring-accent/50' : 'ring-bg-card'}`}
            />
          ) : (
            <span aria-hidden="true" className="w-32 h-32 rounded-full bg-bg-card ring-4 ring-bg-card flex items-center justify-center text-text-secondary">
              <IconUser size={44} />
            </span>
          )}
          <span aria-hidden="true" className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-accent text-bg-main flex items-center justify-center ring-4 ring-bg-header group-hover:scale-105 transition-transform">
            <IconPhotoUp size={18} />
          </span>
        </span>
        <span className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm font-semibold">{dragging ? t.avatarDrop : upload.picked ? t.uploadChoose : t.uploadButton}</span>
          <span className="text-xs text-text-secondary">{t.uploadHint}</span>
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          className="sr-only"
          disabled={upload.busy}
          onChange={(e) => {
            upload.pick(e.target.files?.[0])
            // Picking the same file again should still fire a change.
            e.target.value = ''
          }}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {upload.picked && (
        <div className="flex gap-2.5">
          <button type="button" onClick={saveUpload} disabled={upload.busy} className={PRIMARY}>
            {upload.busy && <Spinner size={16} />}
            {upload.busy ? t.saving : t.uploadSave}
          </button>
          <button type="button" onClick={upload.reset} disabled={upload.busy} className={SECONDARY}>
            {t.cancel}
          </button>
        </div>
      )}

      {!upload.picked && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setLinkOpen((o) => !o)}
            aria-expanded={linkOpen}
            aria-controls={`${inputId}-link`}
            className="flex items-center gap-3 text-xs text-text-secondary hover:text-text-main transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
            <IconLink size={14} aria-hidden="true" />
            {t.uploadOr}
            <IconChevronDown size={14} aria-hidden="true" className={`transition-transform ${linkOpen ? 'rotate-180' : ''}`} />
            <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
          </button>
          {linkOpen && (
            <form id={`${inputId}-link`} onSubmit={(e) => { e.preventDefault(); saveLink() }} className="flex flex-col gap-2">
              <label htmlFor={`${inputId}-url`} className="text-xs text-text-secondary">{t.avatarLinkLabel}</label>
              <div className="flex gap-2">
                <input
                  id={`${inputId}-url`}
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setLinkBroken(false); link.clearError() }}
                  className={fieldClass({ size: 'sm' }, 'flex-1 min-w-0')}
                />
                <button type="submit" disabled={!linkValid || linkBroken || link.saving} className={`${PRIMARY} flex-none`}>
                  {link.saving ? t.saving : t.avatarLinkSave}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </CommonModal>
  )
}
