import Image from 'next/image'
import { FadeImage } from '@/components/ui/FadeImage'

/** `alt` names the picture for a screen reader; `caption` is shown under it, only when it says more than a number. */
export type GameHeroShot = { src: string; alt: string; caption?: string; full?: string }

/** The pictures' grid: from lg it takes the column's room left under the tiles. `GameInfoSkeleton` draws the same. */
export const MEDIA_GRID = 'grid grid-cols-2 gap-2 lg:flex-1 lg:min-h-0'

/**
 * Its rows from lg, by how many pictures there are: one fills the room, two share it, a third pair sits under the
 * first. A row that grows is 8.75rem at least, so the column never folds to nothing beside a short hero.
 */
export const MEDIA_ROWS = [
  'lg:grid-rows-[minmax(8.75rem,1fr)]',
  'lg:grid-rows-[repeat(2,minmax(8.75rem,1fr))]',
  'lg:grid-rows-[minmax(8.75rem,1fr)_auto]',
]

/** A picture's box: 320:224 on a phone; from lg, one that grows fills its row across the column. */
export const MEDIA_BOX = 'aspect-[320/224] lg:aspect-auto lg:h-full'

/**
 * The pictures under a game's figures (RA's title screen and in-game shot, with
 * their captions; a store's screenshots, with none); a picture with a larger
 * version opens it.
 *
 * On a phone, two side by side. From lg the column is as tall as the hero (#167:
 * it left a hole beside a long title), so the pictures grow to fill it: two are
 * stacked, each as wide as the column; with a third, the first fills the room
 * and the other two sit under it. A picture that grows is shown whole over a
 * blurred copy of itself, never cropped, as the cover is.
 */
export default function GameHeroMedia({ shots }: { shots: (GameHeroShot | null)[] }) {
  const shown = shots.filter((s): s is GameHeroShot => s !== null).slice(0, 3)
  if (shown.length === 0) return null
  const three = shown.length === 3

  return (
    <div className={`${MEDIA_GRID} ${MEDIA_ROWS[shown.length - 1]}`}>
      {shown.map((s, i) => {
        const grows = !three || i === 0
        const img = (
          <span
            className={`relative block w-full rounded-tile overflow-hidden ring-1 ring-inset ring-ink/10 ${grows ? MEDIA_BOX : 'aspect-[320/224]'}`}
          >
            {grows && (
              <Image src={s.src} alt="" aria-hidden="true" fill sizes="420px" unoptimized className="max-lg:hidden object-cover scale-125 blur-xl brightness-[0.45]" />
            )}
            <FadeImage
              src={s.src}
              alt={s.alt}
              fill
              sizes="(min-width: 1024px) 420px, 50vw"
              unoptimized
              className="absolute! inset-0"
              imgClassName={`w-full h-full object-cover ${grows ? 'lg:object-contain' : ''}`}
            />
          </span>
        )
        return (
          <figure
            key={s.src}
            className={`flex flex-col gap-1.5 m-0 min-w-0 lg:min-h-0 ${grows && shown.length > 1 ? 'lg:col-span-2' : ''} ${i === 2 ? 'max-lg:hidden' : ''}`}
          >
            {s.full ? (
              <a href={s.full} target="_blank" rel="noopener noreferrer" className="block flex-1 min-h-0 rounded-tile hover:ring-2 hover:ring-accent/60 focus-ring transition-shadow">
                {img}
              </a>
            ) : (
              <div className="flex-1 min-h-0">{img}</div>
            )}
            {s.caption && <figcaption className="text-[0.8125rem] text-text-secondary truncate">{s.caption}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}
