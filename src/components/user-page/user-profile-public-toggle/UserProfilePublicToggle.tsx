'use client'

import { useId } from 'react'
import { useSession } from 'next-auth/react'
import { IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSaveProfileField } from '@/hooks/useSaveProfileField'

/**
 * Whether other users can find and open this profile. A switch, saved on the
 * spot: the state is written out ("Only you can see it"), not just coloured.
 */
export default function UserProfilePublicToggle() {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const { save, saving, error } = useSaveProfileField()
  const labelId = useId()
  const isPublic = session?.user?.profilePublic !== false

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 rounded-xl px-2 -mx-1 py-1.5">
        <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
          <IconWorld size={18} />
        </span>
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span id={labelId} className="text-xs text-text-secondary">{T.userData.profilePublic}</span>
          <span className="text-sm font-medium">{isPublic ? T.userData.profilePublicOn : T.userData.profilePublicOff}</span>
        </span>
        <button
          role="switch"
          aria-checked={isPublic}
          aria-labelledby={labelId}
          disabled={saving}
          onClick={() => save('profilePublic', String(!isPublic))}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
            isPublic ? 'bg-accent' : 'bg-ink/20'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-400 px-2">{error}</p>}
    </div>
  )
}
