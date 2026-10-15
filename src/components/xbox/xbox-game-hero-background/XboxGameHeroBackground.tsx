'use client'

/**
 * The blurred artwork behind an Xbox game page, as the PSN, Steam and RA pages
 * have: the game's box art (see xboxBackdrop; Xbox sends no wide art). It fades
 * in on load and drops out if it fails — it is decoration.
 */
export default function XboxGameHeroBackground({ src }: { src: string }) {
  if (!src) return null
  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none overflow-hidden"
      style={{ top: '-64px', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '900px' }}
    >
      <img
        src={src}
        alt=""
        onError={(e) => e.currentTarget.remove()}
        onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-50')}
        className="w-full h-full object-cover object-center opacity-0 scale-125 transition-opacity duration-700"
        style={{ filter: 'blur(28px)' }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-main/60 to-bg-main" />
      <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-bg-main/40 via-bg-main/15 to-transparent" />
    </div>
  )
}
