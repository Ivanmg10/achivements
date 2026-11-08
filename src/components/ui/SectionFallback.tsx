'use client'

import { IconRefresh } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Button from './Button'
import Kicker from './Kicker'

export function SectionFallback({
  error,
  onRefresh,
  children,
}: {
  error: boolean
  onRefresh: () => void
  children: React.ReactNode
}) {
  const { T } = useLanguage()

  if (!error) return <>{children}</>
  return (
    <div className="relative flex-1 flex flex-col min-h-[80px]">
      <div className="blur-sm opacity-25 pointer-events-none flex-1 flex flex-col select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Kicker role="alert">{T.charts.failedToLoad}</Kicker>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          <IconRefresh size={12} aria-hidden="true" />
          {T.gameInfoPage.retry}
        </Button>
      </div>
    </div>
  )
}
