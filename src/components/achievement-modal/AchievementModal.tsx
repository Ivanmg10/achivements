'use client'

import { RetroAchievement } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { useAchievementDetail } from '@/hooks/useAchievementDetail'
import { gameHref } from '@/utils/gameRef'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { raShowcaseEntry } from '@/utils/showcase'
import ShowcaseToggleButton from '@/components/showcase-toggle-button/ShowcaseToggleButton'
import Modal from '@/components/ui/Modal'
import Tag from '@/components/ui/Tag'
import ToggleButton from '@/components/ui/ToggleButton'
import { SkeletonRow } from '@/components/ui/SkeletonList'
import { formatDateTime } from '@/utils/dates'
import { raTypeTag, TYPE_TAG } from '@/components/ui/dataTable'
import { raBadgeUrl } from '@/utils/raAssets'
import AchievementModalFigures from './achievement-modal-figures/AchievementModalFigures'
import AchievementModalUnlocks from './achievement-modal-unlocks/AchievementModalUnlocks'
import AchievementModalComments from './achievement-modal-comments/AchievementModalComments'

/**
 * An RA achievement's window (`lg`): its head is the Modal's (badge as the icon, name, what it asks for), then what
 * marks it (type, hardcore, when it was earned, favourite and showcase), the six figures in a row, the recent unlocks
 * folded in an accordion and the last comments with "See all". What comes from the detail read holds its place
 * as a skeleton until it arrives.
 */
export default function AchievementModal({
  achievement,
  numDistinctPlayers,
  onClose,
  gameId,
  gameTitle,
  isFavorited = false,
  onToggleFavorite,
}: {
  achievement: RetroAchievement
  numDistinctPlayers: number
  onClose: () => void
  gameId?: number | null
  /** With `gameId`, lets an earned achievement go into the showcase. */
  gameTitle?: string | null
  isFavorited?: boolean
  onToggleFavorite?: () => void
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()
  const { detail, loading, error } = useAchievementDetail(achievement.ID)

  const typeBadge = raTypeTag(achievement.Type, T.achievement)
  const earned = !!achievement.DateEarned
  const earnedHardcore = !!achievement.DateEarnedHardcore
  const earnedDate = achievement.DateEarned ? formatDateTime(achievement.DateEarned, lang) : null
  const showcaseEntry = gameId && gameTitle ? raShowcaseEntry(achievement, gameId, gameTitle) : null
  const hasMarks = !!(onToggleFavorite || showcaseEntry || typeBadge || earnedHardcore || earnedDate)

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      className="gap-5"
      icon={
        achievement.BadgeName ? (
          <Image
            src={raBadgeUrl(achievement.BadgeName)!}
            alt=""
            width={40}
            height={40}
            unoptimized
            className={`w-full h-full object-cover rounded-control ${earned ? '' : 'grayscale opacity-60'}`}
          />
        ) : undefined
      }
      title={
        gameId ? (
          <Link href={gameHref('ra', gameId, subject)} onClick={onClose} className="hover:underline underline-offset-2">
            {achievement.Title}
          </Link>
        ) : (
          achievement.Title
        )
      }
      hint={achievement.Description}
    >
      {hasMarks && (
        <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
          {onToggleFavorite && (
            <ToggleButton
              pressed={isFavorited}
              onToggle={onToggleFavorite}
              label={isFavorited ? T.favorites.removeFavorite : T.favorites.addFavorite}
              icon={IconStar}
              pressedIcon={IconStarFilled}
              size={20}
            />
          )}
          {showcaseEntry && <ShowcaseToggleButton entry={showcaseEntry} size={20} />}
          {typeBadge && <span className={`${TYPE_TAG} ${typeBadge.className}`}>{typeBadge.label}</span>}
          {earnedHardcore && <Tag tone="hardcore" size="sm">{T.achievement.hardcoreShort}</Tag>}
          {earnedDate && (
            <span className="text-xs text-text-secondary">
              {T.achievement.earnedOn} {earnedDate}
            </span>
          )}
        </div>
      )}

      <AchievementModalFigures
        points={achievement.Points}
        players={achievement.NumAwarded}
        numDistinctPlayers={numDistinctPlayers}
        meta={detail?.unlocks?.Achievement ?? null}
        loading={loading}
      />

      {loading && (
        <div role="status" aria-busy="true" className="flex flex-col gap-2 border border-bg-header rounded-tile p-4">
          <span className="sr-only">{T.loadingPage.title}</span>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} icon="w-7 h-7" radius="circle" figure />
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger text-center">{T.achievement.loadError}</p>}

      {detail && (
        <>
          {detail.unlocks?.Unlocks && detail.unlocks.Unlocks.length > 0 && (
            <AchievementModalUnlocks unlocks={detail.unlocks.Unlocks} count={detail.unlocks.UnlocksCount} total={detail.unlocks.TotalPlayers} />
          )}
          <AchievementModalComments comments={detail.comments?.Results ?? []} total={detail.comments?.Total ?? 0} />
        </>
      )}
    </Modal>
  )
}
