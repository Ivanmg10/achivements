'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { useGameInsights } from '@/hooks/useGameInsights'
import { homeHeroOf } from '@/utils/homeHero'
import { gameHref } from '@/utils/gameRef'
import { nextTargets } from '@/utils/gameInsights'
import { decimal, plural, relativeTime } from '@/utils/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'

/**
 * The top of the home in its "cover" layout (Preferences → General): the game
 * played last, in big, over its own art, with its console, how far along it
 * is, the easiest achievement left in it, and the ways into it. Draws nothing
 * until the feed has answered, or when there is no game.
 */
export default function MainPagePortada() {
  const { T, lang } = useLanguage()
  const { feed, loading } = useRecentFeed(1)
  const [artFailed, setArtFailed] = useState(false)
  const hero = loading ? null : homeHeroOf(feed[0])
  const { items, loading: reading } = useGameInsights(hero?.source ?? null, hero?.id ?? null)
  if (!hero) return null

  const art = hero.image && !artFailed ? hero.image : null
  const when = hero.lastPlayed ? relativeTime(hero.lastPlayed, lang) : null
  const next = nextTargets(items, 1)[0]
  const left = hero.total - hero.earned

  return (
    <section aria-labelledby="home-cover-title" className="relative mx-3 mt-3 rounded-card overflow-hidden ring-1 ring-ink/[0.08] bg-bg-card min-h-64 sm:min-h-[23.75rem] flex">
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

      <div className="relative flex flex-col gap-3 p-6 sm:p-12 max-w-3xl justify-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {T.homeLayout.continueKicker}
          {when && <span className="text-text-secondary"> · {when}</span>}
        </p>
        <h2 id="home-cover-title" className="font-display italic font-extrabold text-5xl sm:text-[5rem] leading-[0.9] text-text-main line-clamp-2 pr-2">
          {hero.title}
        </h2>
        {hero.console && (
          <span className="self-start inline-flex items-center h-[1.375rem] px-2 rounded-[0.375rem] text-xs font-bold bg-black/50 text-text-main">
            {hero.console}
          </span>
        )}
        {hero.total > 0 && (
          <div className="flex items-center gap-3.5 max-w-lg mt-2">
            <ProgressBar pct={hero.pct} label={hero.title} className="flex-1" />
            <span className={`text-lg font-extrabold tabular-nums ${hero.pct >= 100 ? 'text-success' : 'text-text-main'}`}>
              {hero.earned} / {hero.total}
            </span>
          </div>
        )}
        {/* Its line's room is kept while the game is read, so the hero does not jump when it comes. */}
        {reading && <span aria-hidden="true" className="h-5" />}
        {next && (
          <p className="text-sm text-text-main">
            {T.homeLayout.nextEasiest} <strong className="font-bold">{next.title}</strong>
            {next.rarity !== null && (
              <span className="text-text-secondary"> · {T.homeLayout.ownedBy.replace('{pct}', `${decimal(next.rarity, lang)} %`)}</span>
            )}
          </p>
        )}
        <div className="flex flex-wrap gap-2.5 mt-5">
          <Button href={gameHref(hero.source, hero.id)}>{T.homeLayout.openGame}</Button>
          {left > 0 && (
            <Button variant="secondary" href={gameHref(hero.source, hero.id)}>
              {plural(left, T.plurals.seeLeft, lang)}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
