'use client'

import { IconUserOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** A user page that could not open: nobody by that name (or private), or a failure worth retrying. */
export default function PublicUserError({ username, error, onRetry }: { username: string; error: 'missing' | 'failed'; onRetry: () => void }) {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-secondary text-center px-4">
      <IconUserOff className="w-10 h-10" aria-hidden="true" />
      <p role="alert" className="text-sm">
        {error === 'missing' ? T.publicProfile.userNotFound.replace('{u}', username) : T.publicProfile.userLoadError}
      </p>
      {error === 'failed' && (
        <button onClick={onRetry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
          {T.publicProfile.retry}
        </button>
      )}
    </div>
  )
}
