'use client'

import { ReactNode, useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconBrandYoutube, IconBook2, IconCheck, IconLock, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { modalOverlay, modalContent } from '@/lib/animations'
import { FadeImage } from '@/components/ui/FadeImage'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import { formatRarity } from '@/utils/steamFeed'
import type { GuideLink } from '@/utils/guideLinks'

const GUIDE_ICON = { youtube: IconBrandYoutube, steamGuides: IconBook2, psnProfiles: IconBook2, trueAchievements: IconBook2 }

/**
 * One Steam achievement or PSN trophy, opened from its game page — the
 * counterpart of RA's AchievementModal, with what those platforms tell:
 * the badge, the text, when it was earned, how rare it is, and where to
 * find a guide. Platform details (grade, DLC, online) come in as `tags`.
 *
 * Rendered inside the caller's AnimatePresence. Focus moves in on open and
 * back to the opener on close; Escape and the backdrop close it.
 */
export default function AchievementDetailModal({
  title,
  description,
  iconUrl,
  earned,
  earnedAt,
  rarity,
  tags,
  guides,
  pinned,
  onTogglePin,
  onClose,
}: {
  title: string
  description: string
  iconUrl: string | null
  earned: boolean
  earnedAt: string | null
  /** Share of players who have it, 0–100. */
  rarity: number | null
  tags?: ReactNode
  /** Empty for a secret one still hidden: a search would give it away. */
  guides: GuideLink[]
  /** Undefined for a signed-out visitor, who cannot pin. */
  pinned?: boolean
  onTogglePin?: () => void
  onClose: () => void
}) {
  const { T, lang } = useLanguage()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => opener?.focus?.()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const when = earnedAt
    ? new Date(earnedAt).toLocaleString(lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null
  const guideLabel = { youtube: T.achievementDetail.youtube, steamGuides: T.achievementDetail.steamGuides, psnProfiles: T.achievementDetail.psnProfiles, trueAchievements: T.achievementDetail.trueAchievements }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-bg-main rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain flex flex-col focus:outline-none"
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-5 sm:p-6 border-b border-bg-header">
          {iconUrl ? (
            <FadeImage
              src={iconUrl}
              alt=""
              width={80}
              height={80}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0 ${earned ? 'ring-2 ring-accent' : ''}`}
              imgClassName={`w-full h-full object-cover ${earned ? '' : 'grayscale opacity-60'}`}
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-ink/10 shrink-0" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {pinned !== undefined && onTogglePin && <SteamPinAchievementButton pinned={pinned} title={title} onToggle={onTogglePin} size={18} />}
              <h2 id={titleId} className="text-lg sm:text-xl font-semibold">
                {title}
              </h2>
            </div>
            <p className="text-sm text-text-secondary">{description}</p>
            {tags && <div className="flex items-center gap-2 flex-wrap text-xs">{tags}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={T.achievementDetail.close}
            className="p-1 rounded-lg text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconX className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="grid grid-cols-2 divide-x divide-bg-header border-b border-bg-header">
          <div className="flex flex-col items-center gap-0.5 py-4 px-2 text-center">
            <dt className="text-xs text-text-secondary order-2">{T.achievementDetail.rarity}</dt>
            <dd className="text-lg font-semibold tabular-nums">{rarity !== null ? `${formatRarity(rarity)}%` : '—'}</dd>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4 px-2 text-center">
            <dt className="text-xs text-text-secondary order-2">{earned ? T.achievementDetail.earned : T.achievementDetail.notEarned}</dt>
            <dd className={`text-sm font-semibold inline-flex items-center gap-1 min-h-7 ${earned ? 'text-success' : 'text-text-secondary'}`}>
              {earned ? <IconCheck size={16} aria-hidden="true" /> : <IconLock size={16} aria-hidden="true" />}
              {earned ? (when ?? '✓') : '—'}
            </dd>
          </div>
        </dl>

        {guides.length > 0 && (
          <div className="flex flex-col gap-2 p-5 sm:p-6">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{T.achievementDetail.findGuide}</h3>
            <ul className="flex flex-wrap gap-2">
              {guides.map((g) => {
                const Icon = GUIDE_ICON[g.kind]
                return (
                  <li key={g.kind}>
                    <a
                      href={g.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/8 hover:bg-ink/12 text-text-secondary hover:text-text-main text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      {guideLabel[g.kind]}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
