import { Fragment } from 'react'
import { LOGO_PATHS, LOGO_VIEWBOX } from '@/utils/themeIcon'

type Size = 'sm' | 'md' | 'lg' | 'title'

const SIZES: Record<Size, { box: string; logo: string; name: string }> = {
  sm: { box: 'items-center gap-2', logo: 'h-6', name: 'leading-none text-2xl' },
  md: { box: 'items-center gap-2.5', logo: 'h-9', name: 'leading-none text-4xl' },
  lg: { box: 'items-center gap-3', logo: 'h-14', name: 'leading-none text-5xl sm:text-6xl' },
  // A game's title screen (the landing, #136): the name as big as the screen allows, the logo after it at
  // two thirds of its height, under it on a phone, where the name breaks into its two words.
  title: {
    box: 'flex-col items-center gap-[0.12em] text-[4.6rem] sm:flex-row sm:items-start sm:gap-[0.07em] sm:text-[clamp(4.5rem,min(13vw,24svh),16rem)]',
    logo: 'h-[0.7em] sm:mt-[0.03em]',
    name: 'leading-[0.84] text-center',
  },
}

// The facets step towards the ground as the logo's light falls, as in the favicon.
const OPACITIES = [1, 1, 0.65, 0.4]

/**
 * The logo and the name in the display italic: the one way the site signs
 * itself (the visitors' bar, the sign-in screens, the landing's title). The logo is the friend-drawn
 * one, recoloured in the theme's accent, never redrawn. A link or a heading around it is the caller's;
 * the name is the text, so the logo is decoration. `logoAfter` puts the logo after the name, as a title screen does.
 */
export default function BrandMark({ name, size = 'md', logoAfter = false, className = '' }: { name: string; size?: Size; logoAfter?: boolean; className?: string }) {
  const s = SIZES[size]
  const logo = (
    <svg aria-hidden="true" viewBox={LOGO_VIEWBOX} className={`${s.logo} w-auto shrink-0 text-accent`}>
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" fillOpacity={OPACITIES[i]} />
      ))}
    </svg>
  )
  // A title may break between the name's words ("Cheevo" / "Vault"); the text stays one word.
  const words = size === 'title' ? name.split(/(?=[A-Z])/) : [name]
  return (
    <span className={`inline-flex ${s.box} ${className}`}>
      {!logoAfter && logo}
      <span className={`font-display italic font-extrabold pr-1 text-text-main ${s.name}`}>
        {words.map((w, i) => (
          <Fragment key={i}>
            {i > 0 && <wbr />}
            {w}
          </Fragment>
        ))}
      </span>
      {logoAfter && logo}
    </span>
  )
}
