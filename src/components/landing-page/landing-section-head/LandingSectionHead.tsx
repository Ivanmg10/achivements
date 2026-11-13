import type { ReactNode } from 'react'

/**
 * A section of "what CheevoVault is": its title in the display italic, big, and one paragraph.
 * `row` puts the paragraph beside the title on a wide screen (the groups); `children` follows
 * the paragraph (a link, the streak's figure).
 */
export default function LandingSectionHead({ id, title, text, row = false, children }: { id?: string; title: string; text: string; row?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex flex-col gap-4 lg:gap-5 ${row ? 'lg:flex-row lg:items-end lg:justify-between lg:gap-12' : ''}`}>
      <h2 id={id} className="font-display italic font-extrabold text-[2.625rem] lg:text-[4.25rem] leading-[0.92] text-balance">
        {title}
      </h2>
      <p className={`text-[0.9375rem] lg:text-lg leading-relaxed text-text-secondary ${row ? 'lg:max-w-[32.5rem]' : ''}`}>{text}</p>
      {children}
    </div>
  )
}
