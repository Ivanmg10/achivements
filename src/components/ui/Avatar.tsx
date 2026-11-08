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
  const placeholder =
    fallback === 'icon' ? (
      <span aria-hidden="true" style={box} className="rounded-full bg-bg-main flex items-center justify-center">
        <IconUser size={Math.round(size * 0.4)} className="text-text-secondary" />
      </span>
    ) : (
      <span
        aria-hidden="true"
        style={{ ...box, fontSize: Math.round(size * 0.36) }}
        className="rounded-full bg-accent/15 text-accent font-bold ring-1 ring-accent/25 flex items-center justify-center select-none"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )

  return (
    <span style={box} className={`relative inline-flex shrink-0 rounded-full ${ring} ${className}`}>
      {src ? <FadeImage src={src} alt="" width={size} height={size} className="w-full h-full rounded-full" fallback={placeholder} unoptimized /> : placeholder}
      <PresenceDot online={online} size={size <= 32 ? 'xs' : size <= 40 ? 'sm' : 'md'} announce={announce} ring={SURFACE_RING[surface]} />
    </span>
  )
}
