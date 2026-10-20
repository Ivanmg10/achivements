'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconArrowLeft, IconBooks, IconDeviceGamepad2 } from '@tabler/icons-react'
import type { GameSource } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { useGoBack } from '@/hooks/useGoBack'
import { useRise } from '@/hooks/useRise'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { STATUS_BUTTON, STATUS_SCREEN } from '@/components/status-badge/statusScreen'

const PLATFORM_NAMES: Record<GameSource, string> = { ra: 'RetroAchievements', steam: 'Steam', psn: 'PlayStation', xbox: 'Xbox' }

/**
 * The 404 of a game page, inside the app: an empty cover with the platform's
 * logo, what probably happened, and the way to the library.
 */
export default function NotFoundGame({ source }: { source: GameSource }) {
  const { T } = useLanguage()
  const rise = useRise()
  const handleBack = useGoBack()

  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-center px-6 py-16 text-text-main ${STATUS_SCREEN.inApp}`}>
      <motion.div
        {...rise(0)}
        aria-hidden="true"
        className="relative w-28 aspect-[3/4] rounded-xl grid place-items-center text-text-secondary bg-ink/5 border-2 border-dashed border-ink/20"
      >
        <span className="absolute top-2 left-2 p-1 rounded-md bg-bg-card">
          <PlatformLogo source={source} size={14} />
        </span>
        <IconDeviceGamepad2 size={36} stroke={1.5} />
      </motion.div>
      <motion.div {...rise(0.06)} className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-accent">{T.notFound.gameEyebrow}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">{T.notFound.gameTitle}</h1>
        <p className="text-sm text-text-secondary max-w-sm">
          {T.notFound.gameSubtitle.replace('{platform}', PLATFORM_NAMES[source])}
        </p>
      </motion.div>
      <motion.div {...rise(0.12)} className="mt-1 flex flex-wrap justify-center gap-2.5">
        <Link href="/playing" className={STATUS_BUTTON.primary}>
          <IconBooks size={18} aria-hidden="true" />
          {T.notFound.library}
        </Link>
        <button type="button" onClick={handleBack} className={STATUS_BUTTON.secondary}>
          <IconArrowLeft size={18} aria-hidden="true" />
          {T.notFound.back}
        </button>
      </motion.div>
    </div>
  )
}
