import type { ReactNode } from 'react'
import Image from 'next/image'
import { SURFACE } from '@/components/ui/surface'

/**
 * The top card of the home's profile column, the same for every platform (the
 * agreed design): the account's picture with its ring and a blurred glow of
 * it behind, the name in the display face, a line or two under it, the
 * platform's actions in the corner, then the figures.
 */
export default function MainPageProfileCard({
  avatarSrc,
  avatarFallback,
  ring,
  name,
  children,
  actions,
  stats,
}: {
  avatarSrc?: string | null
  /** Drawn in place of the picture when there is none (the platform's mark). */
  avatarFallback: ReactNode
  /** The ring's colour, as a CSS colour (the hardcore gold, a platform's blue). */
  ring: string
  name: string
  /** The lines under the name (member since, level, status). */
  children?: ReactNode
  actions?: ReactNode
  stats: ReactNode
}) {
  return (
    <div className={`${SURFACE} relative overflow-hidden p-5 flex flex-col gap-3.5`}>
      {avatarSrc && (
        <Image
          src={avatarSrc}
          alt=""
          aria-hidden="true"
          width={300}
          height={200}
          unoptimized
          className="absolute -left-5 -top-10 w-[18.75rem] h-[12.5rem] object-cover blur-[40px] saturate-[1.4] opacity-40 pointer-events-none"
        />
      )}
      {actions && <div className="absolute top-3 right-3 z-10 flex items-center gap-1">{actions}</div>}
      <div className="relative flex gap-4 items-center pr-20">
        <span
          className="w-16 h-16 lg:w-[5.25rem] lg:h-[5.25rem] shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ boxShadow: `0 0 0 2px rgb(var(--bg-card)), 0 0 0 4px ${ring}` }}
        >
          {avatarSrc ? <Image src={avatarSrc} alt="" width={84} height={84} unoptimized className="w-full h-full object-cover" /> : avatarFallback}
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-display italic font-extrabold text-3xl lg:text-[2.5rem] leading-[0.95] truncate pr-1.5">{name}</p>
          {children}
        </div>
      </div>
      <div className="relative">{stats}</div>
    </div>
  )
}
