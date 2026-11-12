import { LOGO_PATHS, LOGO_VIEWBOX } from '@/utils/themeIcon'

type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { logo: string; name: string; gap: string }> = {
  sm: { logo: 'h-6', name: 'text-2xl', gap: 'gap-2' },
  md: { logo: 'h-9', name: 'text-4xl', gap: 'gap-2.5' },
  lg: { logo: 'h-14', name: 'text-5xl sm:text-6xl', gap: 'gap-3' },
}

// The facets step towards the ground as the logo's light falls, as in the favicon.
const OPACITIES = [1, 1, 0.65, 0.4]

/**
 * The logo and the name in the display italic: the one way the site signs
 * itself (the visitors' bar, the sign-in screens). The logo is the friend-drawn
 * one, recoloured in the theme's accent, never redrawn. A link around it is the caller's;
 * the name is the text, so the logo is decoration.
 */
export default function BrandMark({ name, size = 'md', className = '' }: { name: string; size?: Size; className?: string }) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg aria-hidden="true" viewBox={LOGO_VIEWBOX} className={`${s.logo} w-auto shrink-0 text-accent`}>
        {LOGO_PATHS.map((d, i) => (
          <path key={i} d={d} fill="currentColor" fillOpacity={OPACITIES[i]} />
        ))}
      </svg>
      <span className={`font-display italic font-extrabold leading-none pr-1 text-text-main ${s.name}`}>{name}</span>
    </span>
  )
}
