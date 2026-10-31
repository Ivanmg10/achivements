'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { useGameInsights } from '@/hooks/useGameInsights'
import { NEUTRAL_TINT, useImageTint } from '@/hooks/useImageTint'
import { homeHeroOf } from '@/utils/homeHero'
import { gameHref } from '@/utils/gameRef'
import { nextTargets, type InsightAchievement } from '@/utils/gameInsights'
import { guideLinks } from '@/utils/guideLinks'
import { decimal, relativeTime } from '@/utils/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import GameHeroChip from '@/components/game-hero/game-hero-chip/GameHeroChip'
import AchievementDetailModal from '@/components/achievement-detail-modal/AchievementDetailModal'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import { TOOLTIP_SURFACE } from '@/components/ui/tooltip'
import MainPagePortadaSkeleton from '../main-page-portada-skeleton/MainPagePortadaSkeleton'

/**
 * The top of the home in its "cover" layout (Preferences → General): the game
 * played last, in big, over its own wide art, with its console, how far along
 * it is, the easiest achievement left in it, and the ways into it. The art is
 * the best one the game has (each platform's own, tried in turn when one does
 * not load); a game with none shows its own picture as a poster over its
 * colour, so the cover is never an empty box. Draws nothing until the feed has
 * answered, or when there is no game.
 */
export default function MainPagePortada() {
  const { T, lang } = useLanguage()
  const { feed, loading } = useRecentFeed(1)
  const [failed, setFailed] = useState<string[]>([])
  const [selected, setSelected] = useState<InsightAchievement | null>(null)
  const tooltipId = useId()
  const hero = loading ? null : homeHeroOf(feed[0])
  const { items, art: wide, loading: reading, ra } = useGameInsights(hero?.source ?? null, hero?.id ?? null)
  const tint = useImageTint(hero?.icon) ?? NEUTRAL_TINT
  if (!hero) return loading ? <MainPagePortadaSkeleton /> : null

  const art = [wide, ...hero.art].find((src): src is string => Boolean(src) && !failed.includes(src as string)) ?? null
  const when = hero.lastPlayed ? relativeTime(hero.lastPlayed, lang) : null
  const upcoming = [...nextTargets(items, 5), ...items.filter((a) => !a.earned && a.rarity === null)].slice(0, 5)
  const next = upcoming[0]
  const left = hero.total - hero.earned
  const remaining = Math.max(0, left - upcoming.length)
  const selectedRa = selected && hero.source === 'ra' ? ra?.items.find((a) => String(a.ID) === selected.id) : undefined

  return (
    <section
      aria-labelledby="home-cover-title"
      className="home-cover relative mx-3 mt-3 rounded-card overflow-hidden ring-1 ring-ink/[0.08] bg-bg-card min-h-64 sm:min-h-[23.75rem] flex"
      style={art ? undefined : { backgroundImage: `radial-gradient(ellipse at 80% 40%, rgb(${tint} / 0.4), transparent 62%)` }}
    >
      {art ? (
        <Image
          key={art}
          src={art}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          priority
          onError={() => setFailed((f) => [...f, art])}
          className="object-cover object-[70%_30%]"
        />
      ) : (
        hero.icon && (
          <Image
            src={hero.icon}
            alt=""
            width={256}
            height={256}
            unoptimized
            className="hidden md:block absolute right-[8%] top-1/2 -translate-y-1/2 w-52 h-52 lg:w-64 lg:h-64 rounded-[1.75rem] object-cover shadow-[0_24px_60px_rgb(0_0_0/0.55)] ring-1 ring-ink/10"
          />
        )
      )}
      <div aria-hidden="true" className={`absolute inset-0 bg-linear-to-r from-bg-main via-bg-main/85 ${art ? 'to-bg-main/10' : 'to-transparent'}`} />
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
          <GameHeroChip tone="custom" className="self-start bg-black/50 text-text-main">
            {hero.console}
          </GameHeroChip>
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
        </div>
      </div>
      {upcoming.length > 0 && (
        <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 hidden xl:block">
          <ul aria-label={T.homeLayout.nextEasiest} className="flex gap-2">
            {upcoming.map((achievement, i) => {
              const descriptionId = `${tooltipId}-${i}`
              return (
                <li key={achievement.id} className="group relative w-12 h-12">
                  <button
                    type="button"
                    aria-label={achievement.title}
                    aria-describedby={descriptionId}
                    onClick={() => setSelected(achievement)}
                    className="w-full h-full rounded-tile overflow-hidden ring-1 ring-ink/20 bg-bg-main/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {achievement.iconUrl && (
                      <Image src={achievement.iconUrl} alt="" width={48} height={48} unoptimized className="w-full h-full object-cover grayscale" />
                    )}
                  </button>
                  <span
                    role="tooltip"
                    id={descriptionId}
                    className={`pointer-events-none absolute bottom-full right-0 mb-2 z-20 w-64 max-w-[70vw] ${TOOLTIP_SURFACE} p-3 flex flex-col gap-1 opacity-0 invisible transition-opacity group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible`}
                  >
                    <strong className="text-sm">{achievement.title}</strong>
                    {achievement.description && <span className="text-xs text-text-secondary">{achievement.description}</span>}
                    {achievement.rarity !== null && <span className="text-xs text-text-secondary">{T.homeLayout.ownedBy.replace('{pct}', `${decimal(achievement.rarity, lang)} %`)}</span>}
                  </span>
                </li>
              )
            })}
            {remaining > 0 && (
              <li className="w-12 h-12">
                <Link
                  href={gameHref(hero.source, hero.id)}
                  aria-label={T.homeLayout.unearnedRemaining.replace('{n}', String(remaining))}
                  title={T.homeLayout.openGame}
                  className="w-full h-full rounded-tile overflow-hidden ring-1 ring-ink/20 bg-bg-main/70 flex items-center justify-center text-sm font-bold hover:ring-accent/40 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  +{remaining}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
      <AnimatePresence>
        {selectedRa ? (
          <AchievementModal
            achievement={selectedRa}
            numDistinctPlayers={ra!.players}
            gameId={hero.id}
            gameTitle={hero.title}
            onClose={() => setSelected(null)}
          />
        ) : selected && hero.source !== 'ra' ? (
          <AchievementDetailModal
            title={selected.title}
            description={selected.description}
            iconUrl={selected.iconUrl}
            earned={selected.earned}
            earnedAt={selected.earnedAt}
            rarity={selected.rarity}
            guides={guideLinks(hero.source, { gameTitle: hero.title, title: selected.title, appId: hero.id })}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  )
}
