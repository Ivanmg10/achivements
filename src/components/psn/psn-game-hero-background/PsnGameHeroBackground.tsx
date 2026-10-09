'use client'

/**
 * The blurred artwork behind a PSN game page, as the Steam and RA pages have:
 * the store's wide art when Sony has it, else the box art or trophy icon
 * (see psnBackdrop). It fades in on load and drops out if it fails — it is
 * decoration.
 */
export default function PsnGameHeroBackground({ src }: { src: string }) {
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
