'use client'

import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import MainPageProfileNowPlaying from '../../main-page-profile-now-playing/MainPageProfileNowPlaying'

export default function MainPageProfileRaGame({
  game,
  richPresenceMsg,
}: {
  game: RetroAchievementsGameWithAchievements
  richPresenceMsg?: string
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  const scPct = parseFloat(game.UserCompletion ?? '0') || 0
  const hcPct = parseFloat(game.UserCompletionHardcore ?? '0') || 0
  const icon = game.ImageIcon ? `https://retroachievements.org${game.ImageIcon}` : null

  return (
    <MainPageProfileNowPlaying
      href={gameHref('ra', game.ID ?? 0, subject)}
      tintSrc={icon}
      kicker={richPresenceMsg ? `${T.profileRa.playingNow} · ${richPresenceMsg}` : T.profileRa.playingNow}
      icon={icon ? <Image src={icon} alt="" width={52} height={52} className="w-full h-full object-cover" /> : null}
      title={game.Title ?? ''}
      sub={game.ConsoleName}
      share={scPct > 0 || hcPct > 0 ? `${Math.max(hcPct, scPct).toLocaleString(lang, { maximumFractionDigits: 1 })} %` : null}
      done={Math.max(hcPct, scPct) >= 100}
      bar={scPct > 0 || hcPct > 0 ? <ProgressBar pct={hcPct} softPct={scPct} label={game.Title ?? ''} /> : null}
    />
  )
}
