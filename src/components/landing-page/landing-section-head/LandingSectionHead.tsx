import type { ReactNode } from 'react'
import { MARK } from '@/components/ui/shape'

/**
 * A section of "what CheevoVault is": its title in the display italic, big, a paragraph where the points do not already say it, and what the
 * feature does in a few short `points`, each led by the site's mark; `children` follows them (a link, the streak's figure).
 * `end` puts it after its example on a wide screen, so the sections zigzag down the page (the owner, 2026-11-13); on a
 * phone the head always comes first.
 */
export default function LandingSectionHead({
  id,
  title,
  text,
  points = [],
  end = false,
  children,
}: {
  id?: string
  title: string
  text?: string
  points?: string[]
  end?: boolean
  children?: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-4 lg:gap-5 ${end ? 'lg:order-last' : ''}`}>
      <h2 id={id} className="font-display italic font-extrabold text-[2.625rem] lg:text-[4.25rem] leading-[0.92] text-balance">
        {title}
      </h2>
      <div className="flex flex-col gap-3 lg:gap-4">
        {text && <p className="text-[0.9375rem] lg:text-lg leading-relaxed text-text-secondary">{text}</p>}
        {points.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm lg:text-base leading-snug text-text-main/90">
            {points.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden="true" className={`${MARK} shrink-0 font-extrabold text-accent`} />
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
    </div>
  )
}
