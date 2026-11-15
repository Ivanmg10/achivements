import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { AvatarReadError, resizeToAvatar } from '@/lib/resizeAvatar'

/**
 * A picture from the device as the avatar: `pick` resizes it here (square,
 * small) and shows it as it will look (`preview`); `save` uploads it and
 * re-reads the session. Errors come back as `error`, for the modal to show in
 * place; success toasts. The server checks everything again.
 */
export function useAvatarUpload() {
  const { T } = useLanguage()
  const { update } = useSession()
  const [blob, setBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // The preview is an object URL: let it go when it is replaced or the modal closes.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function pick(file: File | undefined) {
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

  async function save(): Promise<boolean> {
    if (!blob || busy) return false
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
        return false
      }
      // Saved in the database; the session re-reads it from there.
      await update()
      notify.success(T.toast.saved)
      return true
    } catch {
      setError(T.editProfileModal.errorGeneric)
      return false
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setBlob(null)
    setPreview(null)
    setError(null)
  }

  return { pick, save, reset, preview, picked: blob !== null, error, busy }
}
