'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IconArrowRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { homeHeroOf } from '@/utils/homeHero'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import { relativeTime } from '@/utils/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'

/**
 * The top of the home in its "cover" layout (Preferences → General): the game
 * played last, in big, over its own art, with how far along it is and a way into
 * it. Draws nothing until the feed has answered, or when there is no game.
 */
export default function MainPagePortada() {
  const { T, lang } = useLanguage()
  const { feed, loading } = useRecentFeed(1)
  const [artFailed, setArtFailed] = useState(false)
  const hero = loading ? null : homeHeroOf(feed[0])
  if (!hero) return null

  const art = hero.image && !artFailed ? hero.image : null
  const when = hero.lastPlayed ? relativeTime(hero.lastPlayed, lang) : null

  return (
    <section aria-labelledby="home-cover-title" className="relative mx-3 mt-3 rounded-card overflow-hidden ring-1 ring-ink/[0.08] bg-bg-card min-h-56 sm:min-h-72 flex">
      {art && (
        <Image
          src={art}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          priority
          onError={() => setArtFailed(true)}
          className="object-cover object-[70%_30%]"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-bg-main via-bg-main/85 to-bg-main/10" />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg-main/80 to-transparent to-50%" />

      <div className="relative flex flex-col gap-3 p-6 sm:p-10 max-w-2xl justify-end">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {T.homeLayout.continueKicker}
          {when && <span className="text-text-secondary"> · {when}</span>}
        </p>
        <h2 id="home-cover-title" className="font-display italic font-extrabold text-4xl sm:text-6xl leading-[0.9] text-text-main line-clamp-2">
          {hero.title}
        </h2>
        <p className="text-sm text-text-secondary">
          {PLATFORM_NAME[hero.source]} · {hero.console}
        </p>
        {hero.total > 0 && (
          <div className="flex items-center gap-3 max-w-md">
            <ProgressBar pct={hero.pct} label={hero.title} className="flex-1" />
            <span className={`text-base font-extrabold tabular-nums ${hero.pct >= 100 ? 'text-success' : 'text-text-main'}`}>
              {hero.earned} / {hero.total}
            </span>
          </div>
        )}
        <div className="mt-1">
          <Button href={gameHref(hero.source, hero.id)}>
            {T.homeLayout.openGame}
            <IconArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}
