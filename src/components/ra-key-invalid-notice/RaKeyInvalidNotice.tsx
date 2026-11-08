'use client'

import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import Notice from '@/components/ui/Notice'
import Button from '@/components/ui/Button'

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
    <Notice
      tone="warning"
      alert
      className="m-3"
      action={
        pathname !== '/user' ? (
          <Button href="/user" variant="quiet" size="sm">
            {T.userPage.raKeyInvalidAction}
          </Button>
        ) : undefined
      }
    >
      {T.userPage.raKeyInvalid}
    </Notice>
  )
}
