import type { CSSProperties, ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import GameHeroTile, { type GameHeroTileData } from './game-hero-tile/GameHeroTile'
import GameHeroCover, { type GameHeroCoverProps } from './game-hero-cover/GameHeroCover'

export type GameHeroFact = { label: string; value: string | null | undefined }

/**
 * The title's size follows its column's width over its length (#167: a long
 * title took four lines at 1280): about two lines' worth, never under 2rem,
 * never over today's size (3rem on a phone, 4.75rem from lg), so a short title
 * stays as big as it was.
 */
const TITLE_SIZE =
  '[--title-max:3rem] lg:[--title-max:4.75rem] text-[length:clamp(2rem,calc(400cqi/var(--title-chars)),var(--title-max))]'

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
  /** The cover's pictures (`GameHeroCover`): one piece on every page, a 2:3 frame or RA's box at its own ratio. */
  cover: GameHeroCoverProps
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
      <GameHeroCover {...cover} />

      <div className="@container w-full flex-1 min-w-0 flex flex-col gap-3.5 lg:pt-1.5 enter-rows">
        {chips && <div className="flex flex-wrap items-center gap-2">{chips}</div>}
        <h1
          className={`font-display italic font-extrabold ${TITLE_SIZE} leading-[0.9] pr-2 text-text-main break-words`}
          style={{ '--title-chars': Math.max(title.length, 1) } as CSSProperties}
        >
          {title}
        </h1>
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
        <div className="w-full lg:w-[26.25rem] shrink-0 lg:self-stretch flex flex-col gap-3 enter-rise [--i:5]">
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
  'inline-flex items-center justify-center w-[2.375rem] h-[2.375rem] rounded-icon hover:bg-ink/[0.08] aria-pressed:bg-accent/[0.16]'
