'use client'

import { useEffect, useId, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { IconPhotoUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { AvatarReadError, resizeToAvatar } from '@/lib/resizeAvatar'
import Spinner from '@/components/main-spinner/Spinner'

/**
 * Pick a picture from the device, see it as it will look (square, round),
 * and use it. The resizing happens here, before anything is sent; the server
 * checks it all again. Errors are shown in place, since the modal stays open;
 * success closes it with a toast.
 */
export default function AvatarUpload({ onDone }: { onDone: () => void }) {
  const { T } = useLanguage()
  const { update } = useSession()
  const inputId = useId()
  const [blob, setBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // The preview is an object URL: let it go when it is replaced or the modal closes.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function handlePick(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      const resized = await resizeToAvatar(file)
      setBlob(resized)
      setPreview(URL.createObjectURL(resized))
    } catch (err) {
      setBlob(null)
      setPreview(null)
      setError(err instanceof AvatarReadError ? T.editProfileModal.errorNotImage : T.editProfileModal.errorGeneric)
    }
  }

  async function handleSave() {
    if (!blob || busy) return
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', blob, 'avatar')
      const res = await fetch('/api/avatar', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const byCode: Record<string, string> = {
          'not-an-image': T.editProfileModal.errorNotImage,
          'too-large': T.editProfileModal.errorTooLarge,
          'too-many-attempts': T.editProfileModal.errorTooMany,
        }
        setError(byCode[data.error] ?? T.editProfileModal.errorGeneric)
        return
      }
      // Saved in the database; the session re-reads it from there.
      await update()
      notify.success(T.toast.saved)
      onDone()
    } catch {
      setError(T.editProfileModal.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {preview ? (
          <Image src={preview} alt={T.editProfileModal.avatarPreview} width={72} height={72} unoptimized className="w-18 h-18 rounded-full object-cover ring-2 ring-accent/40" />
        ) : (
          <span aria-hidden="true" className="w-18 h-18 rounded-full bg-bg-main ring-1 ring-ink/10 flex items-center justify-center text-text-secondary">
            <IconPhotoUp size={26} />
          </span>
        )}
        <div className="flex flex-col gap-1.5 min-w-0">
          <label
            htmlFor={inputId}
            className="self-start cursor-pointer px-3 py-2 rounded-xl bg-bg-main ring-1 ring-ink/10 text-sm font-medium hover:ring-ink/25 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70"
          >
            {preview ? T.editProfileModal.uploadChoose : T.editProfileModal.uploadButton}
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                handlePick(e.target.files?.[0])
                // Picking the same file again should still fire a change.
                e.target.value = ''
              }}
            />
          </label>
          <span className="text-xs text-text-secondary">{T.editProfileModal.uploadHint}</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {blob && (
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-bg-main text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {busy && <Spinner size={16} />}
          {busy ? T.editProfileModal.saving : T.editProfileModal.uploadSave}
        </button>
      )}
    </div>
  )
}
