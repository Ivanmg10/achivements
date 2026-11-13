import CoverTile from '@/components/cover-tile/CoverTile'
import { ART_WALL_RA, WALL_TILTS } from '@/utils/artWall'

/**
 * Where each cover sits on the wall, as on the sign-in's own wall (x, y of a 122 px cover in a
 * 1470 × 1440 picture of it, the one drawn on the canvas as "Fondo").
 */
const SPOTS = [
  [165, 5], [902, 68], [1167, 30], [52, 248], [546, 198], [790, 320], [1280, 288], [172, 505], [438, 450], [906, 573], [1172, 537],
  [58, 755], [550, 706], [793, 825], [1283, 790], [165, 1010], [432, 957], [902, 1082], [1167, 1043], [52, 1262], [542, 1212], [1280, 1300],
]
const [WIDE, TALL, COVER] = [1470, 1440, 122]
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(2)}%`

/**
 * The title screen's background (#136, "Fondo"): one picture of the art wall, blurred and tinted in the
 * accent, sliding slowly there and back so it never shows a seam, under scan lines and a fade that keeps
 * the title and the buttons readable. The covers are RetroAchievements' small boxes: blurred, a big one
 * would only weigh more. It is CSS: the server's HTML draws it, and the title never waits for it.
 * Still under reduced motion or the landing's stop button. Decoration, hidden from assistive tech.
 */
export default function LandingBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <div className="absolute -inset-8 sm:-inset-10">
        <div className="title-drift absolute top-0 left-0 w-[280%] sm:w-[146%] aspect-[1470/1440] blur-sm brightness-80">
          {SPOTS.map(([x, y], i) => (
            <CoverTile
              key={i}
              src={ART_WALL_RA[i]}
              size="w-full aspect-square"
              style={{
                position: 'absolute',
                left: pct(x, WIDE),
                top: pct(y, TALL),
                width: pct(COVER, WIDE),
                transform: `rotate(${(i % 2 ? 1 : -1) * WALL_TILTS[i % WALL_TILTS.length]}deg)`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-accent mix-blend-color opacity-30" />
      </div>
      <div className="scanlines absolute inset-0" />
      <div className="absolute inset-0 bg-linear-to-b from-bg-main/90 via-bg-main/35 via-45% to-bg-main/95" />
    </div>
  )
}
