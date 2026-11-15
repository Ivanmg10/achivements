import CoverTile from '@/components/cover-tile/CoverTile'
import { WALL_TILTS } from '@/utils/artWall'

/** How many times the covers repeat in each half: a half must be wider than a 2560 px screen. */
const REPEAT = 2

/**
 * A row of the art wall's covers sliding sideways forever (CSS, `.cover-reel-row`): to the left, or the
 * other way with `back`. The covers repeat in two identical halves, so moving by half lands on the same
 * frame and the loop has no seam. Still under reduced motion and the landing's stop button. Decoration.
 */
export default function CoverReel({ covers, back = false }: { covers: string[]; back?: boolean }) {
  const half = Array.from({ length: REPEAT }, () => covers).flat()
  return (
    <div aria-hidden="true" className={`cover-reel-row flex w-max gap-5 sm:gap-7 ${back ? 'cover-reel-back -ml-16' : ''}`}>
      {[...half, ...half].map((src, i) => (
        <CoverTile
          key={i}
          src={src}
          size="w-[5.5rem] h-[5.5rem] sm:w-[8.25rem] sm:h-[8.25rem]"
          style={{ transform: `rotate(${(i % 2 ? 1 : -1) * WALL_TILTS[i % WALL_TILTS.length]}deg)` }}
        />
      ))}
    </div>
  )
}
