import { FadeImage } from '@/components/ui/FadeImage'

export type GameHeroShot = { src: string; caption: string; full?: string }

/**
 * Two pictures under a game's figures (RA's title screen and in-game shot, a
 * store's screenshots), each with its caption; a picture with a larger
 * version opens it.
 */
export default function GameHeroMedia({ shots }: { shots: (GameHeroShot | null)[] }) {
  const shown = shots.filter((s): s is GameHeroShot => s !== null).slice(0, 2)
  if (shown.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {shown.map((s) => {
        const img = (
          <FadeImage
            src={s.src}
            alt={s.caption}
            width={320}
            height={224}
            unoptimized
            className="block w-full aspect-[320/224] rounded-[0.625rem] overflow-hidden ring-1 ring-inset ring-ink/10"
          />
        )
        return (
          <figure key={s.src} className="flex flex-col gap-1.5 m-0 min-w-0">
            {s.full ? (
              <a href={s.full} target="_blank" rel="noopener noreferrer" className="block rounded-[0.625rem] hover:ring-2 hover:ring-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 transition-shadow">
                {img}
              </a>
            ) : (
              img
            )}
            <figcaption className="text-[0.8125rem] text-text-secondary truncate">{s.caption}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}
