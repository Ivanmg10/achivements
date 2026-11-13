import CoverTile from '@/components/cover-tile/CoverTile'
import { ART_WALL_RA, WALL_TILTS } from '@/utils/artWall'

// Where each cover sits on a 1470 × 1440 wall of 76 px covers: ten columns, each row shifted half a step, with a
// fixed nudge per cover so it reads as the sign-in's scattered wall, not a grid. The same everywhere (no random).
const NUDGE = [[0, 0], [38, -22], [-26, 30], [14, 44], [-40, -10], [30, 18], [-12, -36]]
const SPOTS = Array.from({ length: 100 }, (_, i) => {
  const [col, row] = [i % 10, Math.floor(i / 10)]
  const [dx, dy] = NUDGE[(i * 3) % NUDGE.length]
  return [20 + col * 142 + (row % 2) * 71 + dx, 20 + row * 138 + dy]
})
const [WIDE, TALL, COVER] = [1470, 1440, 76]
// The pool's first covers, each used two or three times: a repeat costs nothing, the browser has it already.
const UNIQUE = 40
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(2)}%`

/**
 * The title screen's background (#136, "Fondo"): one picture of the art wall, blurred and tinted in the
 * accent, sliding slowly there and back so it never shows a seam, under scan lines and a fade that keeps
 * the title and the buttons readable, its foot melting into the page (a mask) so scrolling down shows no edge. The covers are RetroAchievements' small boxes (blurred, a big one
 * would only weigh more), forty of them laid a hundred times. It is CSS: the server's HTML draws it, and the title never waits for it.
 * Still under reduced motion or the landing's stop button. Decoration, hidden from assistive tech.
 */
export default function LandingBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none [mask-image:linear-gradient(to_bottom,black_72%,transparent)]">
      <div className="absolute -inset-8 sm:-inset-10">
        <div className="title-drift absolute top-0 left-0 w-[280%] sm:w-[146%] aspect-[1470/1440] blur-sm brightness-80">
          {SPOTS.map(([x, y], i) => (
            <CoverTile
              key={i}
              src={ART_WALL_RA[(i * 7) % UNIQUE]}
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
