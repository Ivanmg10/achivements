const TONES = {
  accent: {
    glow: 'bg-[radial-gradient(circle,rgb(var(--accent)/0.35),transparent_65%)]',
    tile: 'bg-ink/10 text-text-secondary ring-ink/10 shadow-[0_0_0_6px_rgb(var(--accent)/0.08)]',
    corner: 'text-accent',
  },
  danger: {
    glow: 'bg-[radial-gradient(circle,rgb(var(--danger)/0.28),transparent_65%)]',
    tile: 'bg-danger/10 text-danger ring-danger/25 shadow-[0_0_0_6px_rgb(var(--danger)/0.06)]',
    corner: 'text-danger',
  },
}

/**
 * The picture of the 404 and error screens: an achievement tile with a small
 * badge on its corner and a slow glow behind it, like a secret achievement
 * still locked (the 404) or an unlock cut short (an error). Decorative: the
 * heading beside it says what happened.
 */
export default function StatusBadge({
  icon,
  corner,
  tone = 'accent',
}: {
  icon: React.ReactNode
  corner: React.ReactNode
  tone?: keyof typeof TONES
}) {
  const t = TONES[tone]

  return (
    <div aria-hidden="true" className="relative w-28 h-28 grid place-items-center">
      <div className={`absolute -inset-7 rounded-full motion-safe:animate-pulse ${t.glow}`} />
      <div className={`relative w-24 h-24 rounded-[22px] grid place-items-center ring-1 ${t.tile}`}>
        {icon}
        <span className={`absolute -right-2 -bottom-2 w-8 h-8 rounded-tile grid place-items-center bg-bg-card ring-1 ring-ink/10 ${t.corner}`}>
          {corner}
        </span>
      </div>
    </div>
  )
}
