'use client'

import { ReactNode } from 'react'
import { IconBrandYoutube, IconBook2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import AchievementWindow from '@/components/achievement-window/AchievementWindow'
import PinAchievementButton from '@/components/pin-achievement-button/PinAchievementButton'
import ShowcaseToggleButton from '@/components/showcase-toggle-button/ShowcaseToggleButton'
import type { ShowcaseEntry } from '@/utils/showcase'
import { formatRarity } from '@/utils/steamFeed'
import type { GuideLink } from '@/utils/guideLinks'
import Button from '@/components/ui/Button'
import Figure from '@/components/ui/Figure'
import Kicker from '@/components/ui/Kicker'
import { formatUnlock } from '@/utils/steamFeed'

const GUIDE_ICON = { youtube: IconBrandYoutube, steamGuides: IconBook2, psnProfiles: IconBook2, trueAchievements: IconBook2 }

/**
 * One Steam achievement, PSN trophy or Xbox achievement, opened from its game page: the `AchievementWindow` shell, as RA's
 * AchievementModal is, with what those platforms tell: the badge, the text, how rare it is (when it is known), when it
 * was earned, and where to find a guide. Platform details (grade, DLC, online) come in as `tags`.
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
  showcase,
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
  /** The achievement as the showcase would keep it, when earned; null or absent otherwise. */
  showcase?: ShowcaseEntry | null
  onClose: () => void
}) {
  const { T, lang } = useLanguage()

  const when = earnedAt ? formatUnlock(earnedAt, lang) : null
  const guideLabel = { youtube: T.achievementDetail.youtube, steamGuides: T.achievementDetail.steamGuides, psnProfiles: T.achievementDetail.psnProfiles, trueAchievements: T.achievementDetail.trueAchievements }

  return (
    <AchievementWindow
      onClose={onClose}
      iconUrl={iconUrl}
      earned={earned}
      title={title}
      description={description}
      marks={
        <>
          {pinned !== undefined && onTogglePin && <PinAchievementButton pinned={pinned} title={title} onToggle={onTogglePin} size={20} />}
          {earned && <ShowcaseToggleButton entry={showcase ?? null} size={20} />}
          {tags}
        </>
      }
      // A rarity nobody can tell is left out, not drawn as a dash.
      figureColumns={rarity !== null ? 2 : 1}
      figures={
        <>
          {rarity !== null && <Figure term look="tile" label={T.achievementDetail.rarity} value={`${formatRarity(rarity, lang)}%`} className="justify-between" />}
          <Figure
            term
            look="tile"
            label={earned ? T.achievementDetail.earned : T.achievementDetail.notEarned}
            value={earned ? (when ?? '✓') : '—'}
            tone={earned ? 'success' : 'muted'}
            className="justify-between"
          />
        </>
      }
    >
      {guides.length > 0 && (
        <div className="flex flex-col gap-2">
          <Kicker as="h3" size="md">{T.achievementDetail.findGuide}</Kicker>
          <ul className="flex flex-wrap gap-2">
            {guides.map((g) => {
              const Icon = GUIDE_ICON[g.kind]
              return (
                <li key={g.kind}>
                  <Button href={g.href} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {guideLabel[g.kind]}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </AchievementWindow>
  )
}
