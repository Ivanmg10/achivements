import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { ICON_BUTTON } from '@/components/welcome-page/welcomeArt'

/**
 * One look choice, opened: its row grows into this (`layoutId`), as the intro's
 * points do, and the arrows go through the others. The ✕ or Escape shrink it
 * back into its row.
 */
export default function WelcomePagePreferencesDetail({
  index,
  total,
  label,
  layoutId,
  onClose,
  onGo,
  children,
}: {
  index: number
  total: number
  label: string
  layoutId?: string
  onClose: () => void
  onGo: (index: number) => void
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
      className="relative flex flex-col lg:min-h-[23rem] rounded-card bg-bg-card ring-1 ring-accent/30 shadow-2xl shadow-black/30"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={T.editProfileModal.close}
        className="absolute top-2.5 right-2.5 z-10 w-10 h-10 rounded-tile flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconX size={20} aria-hidden="true" />
      </button>
      <motion.div
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        className="flex-1 flex flex-col gap-3 p-4 min-w-0"
      >
        <div className="flex items-center gap-3 pr-10">
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

        <div className="flex-1 min-w-0 [&_legend]:sr-only [&_legend]:mb-0">{children}</div>

        <div className="flex items-center justify-end gap-2.5">
          <button type="button" onClick={() => onGo(index - 1)} disabled={index === 0} aria-label={T.welcome.prevPoint} className={ICON_BUTTON}>
            <IconChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onGo(index + 1)} disabled={index === total - 1} aria-label={T.welcome.nextPoint} className={ICON_BUTTON}>
            <IconChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </motion.section>
  )
}
