import { IconCheck } from '@tabler/icons-react'
import type { Theme } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { themeCovers } from '@/utils/themeGames'
import { LOGO_PATHS, LOGO_VIEWBOX } from '@/utils/themeIcon'

const ROWS = [
  { progress: 'w-3/4', title: 'w-3/5', count: '76 / 102' },
  { progress: 'w-1/3', title: 'w-2/5', count: '18 / 54' },
]
// The facets step towards the ground, as in BrandMark and the favicon.
const OPACITIES = [1, 1, 0.65, 0.4]

/**
 * A small screen of the app in one theme (the canvas's MiniTema): the top bar with the logo
 * and the level, a page title, two game rows with their bars (a tribute's own games, `themeGames`), the filters and the primary button.
 * It carries `data-theme`, so every colour is that theme's own token, never a copy of it,
 * and it scales with its width (sizes in em over a font in `cqw`). `on` says, with a tick and
 * a word, that it is the theme in use. Decorative: whoever offers it names it.
 */
export default function ThemeScreen({ theme, on = false, className = '' }: { theme: Theme; on?: boolean; className?: string }) {
  const { T } = useLanguage()
  const covers = themeCovers(theme)

  return (
    <div data-theme={theme} aria-hidden="true" className={`@container overflow-hidden rounded-tile ring-1 ring-ink/10 ${className}`}>
      <div className="aspect-[16/10] flex flex-col gap-[0.8em] px-[1.2em] py-[1em] bg-bg-main text-text-main font-sans leading-none text-[3.125cqw]">
        <div className="flex items-center gap-[1em] h-[2.6em] shrink-0 px-[0.8em] rounded-cell bg-bg-card">
          <svg viewBox={LOGO_VIEWBOX} className="h-[1.5em] w-auto shrink-0 text-accent">
            {LOGO_PATHS.map((d, i) => (
              <path key={i} d={d} fill="currentColor" fillOpacity={OPACITIES[i]} />
            ))}
          </svg>
          <span className="text-[0.9em] font-bold">{T.header.status}</span>
          <span className="text-[0.9em] text-text-secondary truncate">{T.groups.title}</span>
          <span className="flex-1" />
          <span className="relative px-[0.6em] py-[0.3em] text-[0.8em] font-extrabold tabular-nums">
            <span className="absolute inset-0 rounded-chip skew-x-(--slant) bg-accent/15" />
            <span className="relative">31</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-[0.5em]">
          <span className="font-display italic font-extrabold text-[2.2em] truncate">{T.header.status}</span>
          {on && (
            <span className="inline-flex items-center gap-[0.3em] shrink-0 text-[0.9em] font-bold text-accent">
              <IconCheck className="size-[1.2em]" stroke={3} />
              {T.userTheme.on}
            </span>
          )}
        </div>
        {ROWS.map(({ progress, title, count }, i) => (
          <div key={count} className="flex items-center gap-[0.8em] px-[0.8em] py-[0.6em] rounded-cell bg-bg-card">
            <img src={covers[i]} alt="" loading="lazy" className="size-[2.6em] shrink-0 rounded-box-sm object-cover bg-ink/10" />
            <div className="flex flex-1 flex-col gap-[0.45em] min-w-0">
              <span className={`h-[0.6em] rounded-full bg-text-main/80 ${title}`} />
              <span className="h-[0.3em] bg-bg-tertiary">
                <span className={`block h-full bg-progress ${progress}`} />
              </span>
              <span className="text-[0.9em] text-text-secondary tabular-nums">{count}</span>
            </div>
          </div>
        ))}
        <div className="mt-auto flex items-center gap-[0.8em]">
          <span className="px-[0.8em] py-[0.35em] rounded-chip bg-bg-tertiary ring-1 ring-text-main/50 text-[0.9em] font-bold">{T.libraryFilters.all}</span>
          <span className="px-[0.8em] py-[0.35em] rounded-chip bg-bg-tertiary text-[0.9em] font-bold text-text-secondary truncate">{T.libraryFilters.stalled}</span>
          <span className="flex-1" />
          <span className="relative px-[1.2em] py-[0.5em] text-[0.9em] font-extrabold text-bg-main">
            <span className="absolute inset-0 rounded-button skew-x-(--slant) bg-accent" />
            <span className="relative">{T.editProfileModal.save}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
