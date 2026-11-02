'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useSubject } from '@/context/SubjectContext'

/**
 * Shown when RetroAchievements refuses the saved API key (the person revoked or
 * regenerated it): every RA list would otherwise sit on a generic error. Only on
 * one's own pages — a visitor can do nothing about someone else's key — and with
 * a way to the account page unless that is where they already are.
 */
export default function RaKeyInvalidNotice() {
  const { T } = useLanguage()
  const { keyInvalid } = useGamesData()
  const subject = useSubject()
  const pathname = usePathname()

  if (!keyInvalid || subject) return null

  return (
    <div role="alert" className="flex items-start gap-3 bg-warning/10 ring-1 ring-inset ring-warning/30 rounded-control p-4 m-3">
      <IconAlertTriangle size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm text-text-main">{T.userPage.raKeyInvalid}</p>
        {pathname !== '/user' && (
          <Link href="/user" className="self-start text-xs font-medium text-warning underline underline-offset-2 hover:text-warning rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/70">
            {T.userPage.raKeyInvalidAction}
          </Link>
        )}
      </div>
    </div>
  )
}
