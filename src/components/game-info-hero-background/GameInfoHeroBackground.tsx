'use client'

/**
 * The blurred artwork behind an RA game page, as the Steam page does with its
 * library banner. Takes the game's title/in-game screenshot path already
 * resolved by the caller, and simply drops out if there is none — it is
 * decoration.
 */
export default function GameInfoHeroBackground({ imagePath }: { imagePath: string | null }) {
  if (!imagePath) return null

  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none overflow-hidden"
      style={{ top: '-64px', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '900px' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a blurred backdrop, as on the Steam page */}
      <img
        src={`https://retroachievements.org${imagePath}`}
        alt=""
        className="w-full h-full object-cover object-top opacity-60 scale-110"
        style={{ filter: 'blur(16px)' }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-main/60 to-bg-main" />
      <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-black/40 via-black/15 to-transparent" />
    </div>
  )
}
