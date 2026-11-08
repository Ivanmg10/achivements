import type { CSSProperties } from 'react'
import { IconUser } from '@tabler/icons-react'
import { FadeImage } from './FadeImage'
import PresenceDot from '@/components/presence-dot/PresenceDot'

const SURFACE_RING = { card: 'ring-bg-card', main: 'ring-bg-main' }

/**
 * Someone's round picture. Without one, or when it fails, their initial on the
 * accent (`fallback="initial"`) or a quiet person icon (`"icon"`). Another
 * user's picture carries their presence (`online`): the green dot, read aloud
 * with `announce` when nothing beside it says so. Never on your own picture.
 */
export default function Avatar({
  src,
  name,
  size = 40,
  sizeSm,
  fallback = 'initial',
  online,
  announce = false,
  surface = 'card',
  ring = '',
  className = '',
}: {
  src?: string | null
  /** Whose picture: the initial comes from it. The picture is decorative (the name is beside it). */
  name: string
  /** Width and height in px. */
  size?: number
  /** Another size from `sm` up (the profile's picture is bigger on a wide screen). */
  sizeSm?: number
  fallback?: 'initial' | 'icon'
  online?: boolean
  announce?: boolean
  /** What it sits on, so the dot is cut out of it. */
  surface?: keyof typeof SURFACE_RING
  /** A ring round the picture (the podium's gold, a cut-out from a banner). */
  ring?: string
  /** Layout only. */
  className?: string
}) {
  const box = { width: size, height: size }
  const biggest = Math.max(size, sizeSm ?? 0)
  const placeholder =
    fallback === 'icon' ? (
      <span aria-hidden="true" className="w-full h-full rounded-full bg-bg-main flex items-center justify-center">
        <IconUser size={Math.round(size * 0.4)} className="text-text-secondary" />
      </span>
    ) : (
      <span
        aria-hidden="true"
        style={{ fontSize: Math.round(size * 0.36) }}
        className="w-full h-full rounded-full bg-accent/15 text-accent font-bold ring-1 ring-accent/25 flex items-center justify-center select-none"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )

  return (
    <span
      style={sizeSm ? ({ '--a': `${size}px`, '--as': `${sizeSm}px` } as CSSProperties) : box}
      className={`relative inline-flex shrink-0 rounded-full ${sizeSm ? 'w-(--a) h-(--a) sm:w-(--as) sm:h-(--as)' : ''} ${ring} ${className}`}
    >
      {src ? <FadeImage src={src} alt="" width={size} height={size} className="w-full h-full rounded-full" fallback={placeholder} unoptimized /> : placeholder}
      <PresenceDot online={online} size={biggest <= 32 ? 'xs' : biggest <= 40 ? 'sm' : biggest <= 64 ? 'md' : 'lg'} announce={announce} ring={SURFACE_RING[surface]} />
    </span>
  )
}
