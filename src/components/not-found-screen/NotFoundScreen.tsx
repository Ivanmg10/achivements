'use client'

import Link from 'next/link'
import { IconArrowLeft, IconHome, IconLock, IconQuestionMark } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGoBack } from '@/hooks/useGoBack'
import StatusBadge from '@/components/status-badge/StatusBadge'
import NotFoundProgress from '@/components/not-found-progress/NotFoundProgress'
import { STATUS_BUTTON, STATUS_SCREEN } from '@/components/status-badge/statusScreen'

/**
 * The 404, drawn as a hidden achievement nobody has unlocked, in the theme's
 * accent. The root not-found shows it full screen, as the page's <main>;
 * inside the app it fills the space under the header, in the layout's <main>.
 */
export default function NotFoundScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  const Root = fullScreen ? 'main' : 'div'
  const { T } = useLanguage()
  const handleBack = useGoBack()

  return (
    <Root
      className={`enter-rows flex flex-col items-center justify-center gap-4 text-center px-6 py-16 text-text-main ${fullScreen ? STATUS_SCREEN.fullScreen : STATUS_SCREEN.inApp}`}
    >
      <div>
        <StatusBadge icon={<IconQuestionMark size={44} stroke={1.75} />} corner={<IconLock size={16} stroke={2.25} />} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-accent">{T.notFound.eyebrow}</p>
        <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1] pr-1 text-balance">{T.notFound.title}</h1>
        <p className="text-sm text-text-secondary max-w-sm">{T.notFound.subtitle}</p>
      </div>
      <div className="w-full flex justify-center">
        <NotFoundProgress />
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2.5">
        <Link href="/" className={STATUS_BUTTON.primary}>
          <IconHome size={18} aria-hidden="true" />
          {T.notFound.home}
        </Link>
        <button type="button" onClick={handleBack} className={STATUS_BUTTON.secondary}>
          <IconArrowLeft size={18} aria-hidden="true" />
          {T.notFound.back}
        </button>
      </div>
    </Root>
  )
}
