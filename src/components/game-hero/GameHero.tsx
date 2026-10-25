import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import GameHeroTile, { type GameHeroTileData } from './game-hero-tile/GameHeroTile'

export type GameHeroFact = { label: string; value: string | null | undefined }

/**
 * The top of every game page (RA, Steam, PlayStation, Xbox), as agreed on the
 * canvas: the cover; chips, the title in the display face, the progress, the
 * facts and the actions; and on the right the figures as tiles over the
 * pictures. Each platform fills it with its own data, so the four pages look
 * the same.
 */
export default function GameHero({
  cover,
  chips,
  title,
  description,
  progress,
  children,
  facts,
  actions,
  toggles,
  tiles,
  media,
}: {
  cover: ReactNode
  chips?: ReactNode
  title: string
  description?: string | null
  progress?: ReactNode
  /** Under the progress: what only one platform has (RA's subsets, PSN's trophy counts). */
  children?: ReactNode
  facts: GameHeroFact[]
  /** The buttons: the AI export first (primary), then the links (secondary). */
  actions?: ReactNode
  /** Icon buttons after a rule: pin, hide. */
  toggles?: ReactNode
  tiles: GameHeroTileData[]
  /** The pictures under the tiles. */
  media?: ReactNode
}) {
  const { T } = useLanguage()

  return (
    <section className="relative w-full px-4 sm:px-8 lg:px-14 pt-6 lg:pt-10 flex flex-col lg:flex-row gap-6 lg:gap-9 items-start">
      <div className="w-32 sm:w-40 lg:w-[13.5rem] shrink-0 rounded-xl overflow-hidden shadow-[0_24px_60px_rgb(0_0_0/0.55)] ring-1 ring-inset ring-ink/10">
        {cover}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-3.5 lg:pt-1.5">
        {chips && <div className="flex flex-wrap items-center gap-2">{chips}</div>}
        <h1 className="font-display italic font-extrabold text-5xl lg:text-[4.75rem] leading-[0.9] pr-2 text-text-main break-words">{title}</h1>
        {description && <p className="text-sm text-text-secondary max-w-2xl line-clamp-3">{description}</p>}
        {progress}
        {children}
        <dl className="mt-1 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1 min-w-0">
              <dt className="text-[0.8125rem] text-text-secondary">{f.label}</dt>
              <dd className={f.value && f.value !== '—' ? 'font-semibold' : 'text-text-secondary'}>{f.value && f.value !== '—' ? f.value : T.gameInfoPage.noData}</dd>
            </div>
          ))}
        </dl>
        {(actions || toggles) && (
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            {actions}
            {toggles && (
              <>
                <span aria-hidden="true" className="w-px h-6 bg-ink/12 mx-1" />
                {toggles}
              </>
            )}
          </div>
        )}
      </div>

      {(tiles.length > 0 || media) && (
        <div className="w-full lg:w-[26.25rem] shrink-0 flex flex-col gap-3">
          {tiles.length > 0 && (
            <dl className="grid grid-cols-2 gap-2">
              {tiles.map((t) => (
                <GameHeroTile key={t.label} {...t} />
              ))}
            </dl>
          )}
          {media}
        </div>
      )}
    </section>
  )
}

/** The hero's icon buttons (pin, hide): 38 px, tinted in the accent while on. */
export const HERO_TOGGLE =
  'inline-flex items-center justify-center w-[2.375rem] h-[2.375rem] rounded-[0.5625rem] hover:bg-ink/[0.08] aria-pressed:bg-accent/[0.16]'
