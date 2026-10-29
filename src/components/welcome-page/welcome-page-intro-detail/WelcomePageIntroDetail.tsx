import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconArrowRight, IconCheck, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import WelcomePageIntroArt from '@/components/welcome-page/welcome-page-intro-art/WelcomePageIntroArt'
import { PRIMARY_BUTTON, QUIET_BUTTON } from '@/components/welcome-page/welcomeArt'

export type IntroPerk = { title: string; text: string; detail: string; highlights: string[] }

const ICON_BUTTON =
  'w-11 h-11 rounded-tile flex items-center justify-center ring-1 ring-inset ring-ink/15 text-text-main hover:bg-ink/5 disabled:opacity-30 disabled:cursor-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * One of the intro's points, opened over the whole step: its card grows into
 * this (`layoutId`), with room for the full explanation, its highlights and a
 * sketch of what it looks like. The ✕, "Back" or Escape shrink it back into
 * its card; the arrows go through the other points; "Start" goes on.
 */
export default function WelcomePageIntroDetail({
  index,
  total,
  perk,
  layoutId,
  onClose,
  onGo,
  onStart,
}: {
  index: number
  total: number
  perk: IntroPerk
  layoutId?: string
  onClose: () => void
  onGo: (index: number) => void
  onStart: () => void
}) {
  const { T } = useLanguage()
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [index])

  return (
    <motion.section
      layoutId={layoutId}
      aria-labelledby="welcome-perk-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      className="relative rounded-card bg-bg-card ring-1 ring-accent/30 shadow-2xl shadow-black/30 overflow-hidden"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={T.editProfileModal.close}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-10 h-10 rounded-tile flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconX size={20} aria-hidden="true" />
      </button>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
        className="grid gap-8 lg:gap-12 p-5 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center"
      >
        <div className="flex flex-col gap-5 min-w-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className={`${QUIET_BUTTON} -ml-2`}>
              <IconChevronLeft size={16} aria-hidden="true" />
              {T.welcome.back}
            </button>
            <span aria-hidden="true" className="w-px h-4 bg-ink/15" />
            <span className="text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-accent">
              {T.welcome.pointCount.replace('{n}', String(index + 1)).replace('{total}', String(total))}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="w-14 h-14 shrink-0 rounded-card bg-accent/15 text-accent flex items-center justify-center font-display italic font-extrabold text-3xl">
              {index + 1}
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <h2
                id="welcome-perk-title"
                ref={titleRef}
                tabIndex={-1}
                className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[0.95] outline-none break-words"
              >
                {perk.title}
              </h2>
              <p className="text-base text-text-secondary">{perk.text}</p>
            </div>
          </div>

          <p className="text-base sm:text-lg leading-relaxed text-text-main/90">{perk.detail}</p>

          <ul className="flex flex-col gap-2.5">
            {perk.highlights.map((line) => (
              <li key={line} className="flex items-center gap-3 text-[0.9375rem]">
                <span aria-hidden="true" className="w-6 h-6 shrink-0 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                  <IconCheck size={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2.5 mt-1">
            <button type="button" onClick={() => onGo(index - 1)} disabled={index === 0} aria-label={T.welcome.prevPoint} className={ICON_BUTTON}>
              <IconChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onGo(index + 1)} disabled={index === total - 1} aria-label={T.welcome.nextPoint} className={ICON_BUTTON}>
              <IconChevronRight size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={onStart} className={`${PRIMARY_BUTTON} ml-auto`}>
              {T.welcome.start}
              <IconArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <figure className="flex flex-col gap-2.5 min-w-0">
          <div className="rounded-3xl bg-bg-main ring-1 ring-ink/[0.06] p-4 sm:p-6">
            <WelcomePageIntroArt index={index} />
          </div>
          <figcaption className="text-xs text-text-secondary">{T.welcome.artNote}</figcaption>
        </figure>
      </motion.div>
    </motion.section>
  )
}
