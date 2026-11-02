import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { ICON_BUTTON, PRIMARY_BUTTON } from '@/components/welcome-page/welcomeArt'

/**
 * One look choice, opened: its row grows into this (`layoutId`), as the intro's
 * points do, and the arrows go through the others. The ✕ or Escape shrink it
 * back into its row.
 *
 * With `stage`, it opens over the whole step instead, for a choice that needs
 * the room: what it changes on one side, the choice on the other, and `onNext`
 * to go on, since the step's own buttons are under it.
 */
export default function WelcomePagePreferencesDetail({
  index,
  total,
  label,
  layoutId,
  onClose,
  onGo,
  stage,
  onNext,
  children,
}: {
  index: number
  total: number
  label: string
  layoutId?: string
  onClose: () => void
  onGo: (index: number) => void
  stage?: ReactNode
  onNext?: () => void
  children: ReactNode
}) {
  const { T } = useLanguage()
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [index])

  return (
    <motion.section
      layoutId={layoutId}
      aria-labelledby="welcome-choice-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      className={`relative flex flex-col rounded-card bg-bg-card ring-1 ring-accent/30 shadow-2xl shadow-black/30 ${stage ? 'lg:-mt-6' : 'lg:min-h-[23rem]'}`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={T.editProfileModal.close}
        className="absolute top-2.5 right-2.5 z-20 w-10 h-10 rounded-tile flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconX size={20} aria-hidden="true" />
      </button>
      <motion.div
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        className={`flex-1 flex flex-col gap-3 p-4 min-w-0 ${
          stage ? 'lg:flex-none lg:p-6 lg:grid lg:gap-x-8 lg:gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:h-[min(calc(100dvh-14.5rem),46rem)]' : ''
        }`}
      >
        <div className="flex items-center gap-3 pr-10 lg:col-start-1">
          <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-tile bg-accent/15 text-accent flex items-center justify-center font-display italic font-extrabold text-xl">
            {index + 1}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
              {T.welcome.shortCount.replace('{n}', String(index + 1)).replace('{total}', String(total))}
            </span>
            <h2 id="welcome-choice-title" ref={titleRef} tabIndex={-1} className="font-display italic font-extrabold text-3xl leading-none outline-none break-words">
              {label}
            </h2>
          </div>
        </div>

        {stage && <div className="sticky top-[5.25rem] z-10 h-60 py-2 min-w-0 bg-bg-card lg:static lg:h-auto lg:min-h-0 lg:p-0 lg:col-start-1">{stage}</div>}

        <div className={`flex-1 min-w-0 [&_legend]:sr-only [&_legend]:mb-0 ${stage ? 'lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:min-h-0 lg:overflow-y-auto lg:mt-8 lg:pr-2 lg:[scrollbar-width:thin]' : ''}`}>
          {children}
        </div>

        <div className={`flex items-center gap-2.5 lg:col-start-1 ${stage ? '' : 'justify-end'}`}>
          <button type="button" onClick={() => onGo(index - 1)} disabled={index === 0} aria-label={T.welcome.prevPoint} className={ICON_BUTTON}>
            <IconChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onGo(index + 1)} disabled={index === total - 1} aria-label={T.welcome.nextPoint} className={ICON_BUTTON}>
            <IconChevronRight size={18} aria-hidden="true" />
          </button>
          {onNext && (
            <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} ml-auto`}>
              {T.welcome.next}
              <IconArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.section>
  )
}
