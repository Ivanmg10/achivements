'use client'

import Link from 'next/link'
import { IconInfoCircle } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

/**
 * Why your side of the comparison is empty: no account on that platform (with
 * the way to link one), or a game you do not have or that could not be read.
 */
export default function UserGamePageNotice({ source, linked, onRetry }: { source: GameSource; linked: boolean; onRetry: () => void }) {
  const { T } = useLanguage()
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary bg-bg-main rounded-box px-3 py-2">
      <IconInfoCircle size={14} className="shrink-0" aria-hidden="true" />
      {linked ? (
        <>
          {T.userGame.mineMissing}
          <button type="button" onClick={onRetry} className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
            {T.publicProfile.retry}
          </button>
        </>
      ) : (
        <>
          {T.userGame.linkToCompare.replace('{platform}', PLATFORM_NAME[source])}
          <Link href="/user" className="text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
            {T.userGame.linkAccount}
          </Link>
        </>
      )}
    </p>
  )
}
