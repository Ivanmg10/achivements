'use client'

/**
 * The blurred artwork behind an RA game page, as the Steam page does with its
 * library banner. Takes the game's title/in-game screenshot path already
 * resolved by the caller, and simply drops out if there is none — it is
 * decoration. It fades in once loaded, so the page never flashes a half-drawn
 * picture behind its header.
 */
export default function GameInfoHeroBackground({ imagePath }: { imagePath: string | null }) {
  if (!imagePath) return null

  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none overflow-hidden"
      style={{ top: '-64px', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '684px' }}
    >
      <img
        src={`https://retroachievements.org${imagePath}`}
        alt=""
        decoding="async"
        fetchPriority="low"
        onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-45')}
        className="w-full h-full object-cover object-top opacity-0 scale-120 transition-opacity duration-700"
        style={{ filter: 'blur(48px) saturate(1.3)' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(var(--bg-main)/0.2),rgb(var(--bg-main)/0.75)_55%,rgb(var(--bg-main)))]" />
    </div>
  )
}
