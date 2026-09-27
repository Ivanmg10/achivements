import Image from 'next/image'

const RATIO = 500 / 275

/**
 * RetroAchievements' logo, where Steam's brand icon sits for Steam. `height`
 * in px; decorative by default, since a text label always sits next to it.
 */
export default function RaLogo({ height = 14, className = '' }: { height?: number; className?: string }) {
  return (
    <Image
      src="/media/ra-logo.webp"
      alt=""
      aria-hidden="true"
      width={Math.round(height * RATIO)}
      height={height}
      className={`shrink-0 object-contain ${className}`}
    />
  )
}
