'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

/** A game the user does not have on that platform: your banner, and a line saying there is nothing of theirs to show. */
export default function UserGameNotInList({ banner, username }: { banner: ReactNode; username: string }) {
  const { T } = useLanguage()
  return (
    <>
      {banner}
      <p role="alert" className="relative mt-10 text-sm text-text-secondary">{T.userGame.notInTheirList.replace('{u}', username)}</p>
    </>
  )
}
