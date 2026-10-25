import type { ComponentType, CSSProperties } from 'react'

type IconType = ComponentType<{ style?: CSSProperties; 'aria-hidden'?: boolean | 'true' }>

/**
 * A button that is on or off (a pinned star, a bookmark): it reports its state
 * (`aria-pressed`), and its icon changes shape when on (the filled one), so
 * "on" is never colour alone. Quiet until it is on or hovered.
 */
export default function ToggleButton({
  pressed,
  onToggle,
  label,
  icon: Icon,
  pressedIcon: PressedIcon = Icon,
  size = 16,
  className = '',
}: {
  pressed: boolean
  onToggle: () => void
  /** What it does, read aloud and shown as its tooltip. */
  label: string
  icon: IconType
  /** The icon while on (the filled one); the same icon by default. */
  pressedIcon?: IconType
  size?: number
  /** Layout only. */
  className?: string
}) {
  const Current = pressed ? PressedIcon : Icon
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={`transition-colors duration-(--motion-hover) rounded-chip cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        pressed ? 'text-hardcore' : 'text-text-secondary hover:text-hardcore'
      } ${className}`}
    >
      <Current style={{ width: size, height: size }} aria-hidden="true" />
    </button>
  )
}
