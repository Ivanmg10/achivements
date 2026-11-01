'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { THEME_GROUPS, type Theme } from '@/types/types'
import { lookTransition, spreadFrom } from '@/utils/lookTransition'
import IconButton from '@/components/ui/IconButton'
import Pill from '@/components/ui/Pill'
import ThemeModalOption from '@/components/theme-modal/theme-modal-option/ThemeModalOption'

const familyOf = (theme: Theme) => THEME_GROUPS.find((group) => group.themes.includes(theme))?.id ?? THEME_GROUPS[0].id

/** Where the strip must stand for an element to sit in its middle. */
const centred = (strip: HTMLElement, el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2 - strip.clientWidth / 2

/**
 * Every theme, drawn with its own tokens, by family: a strip that runs under the
 * sample on a wide screen, where the pills jump to a family, and a grid in the
 * dialog's own scroll on a phone. Picked, a theme spreads over the whole page
 * from its tile.
 */
export default function LayoutModalThemes() {
  const { T } = useLanguage()
  const { theme, choose, saveError } = useThemeChoice()
  const stripRef = useRef<HTMLDivElement>(null)
  const [family, setFamily] = useState(() => familyOf(theme))

  useEffect(() => {
    const strip = stripRef.current
    const current = strip?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (strip && current) strip.scrollTo({ left: centred(strip, current), behavior: 'instant' })
  }, [])

  function pick(id: Theme, e: MouseEvent<HTMLButtonElement>) {
    const tile = e.currentTarget
    const strip = stripRef.current
    if (strip) strip.scrollTo({ left: centred(strip, tile) })
    if (id === theme) return
    const box = tile.getBoundingClientRect()
    lookTransition(() => void choose(id), spreadFrom(box.left + box.width / 2, box.top + box.height / 2))
  }

  function jumpTo(id: string) {
    const strip = stripRef.current
    const section = strip?.querySelector<HTMLElement>(`[data-family="${id}"]`)
    if (strip && section) strip.scrollTo({ left: section.offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft) })
  }

  function followScroll() {
    const strip = stripRef.current
    if (!strip) return
    const middle = strip.scrollLeft + strip.clientWidth / 2
    const here = [...strip.querySelectorAll<HTMLElement>('[data-family]')].filter((section) => section.offsetLeft <= middle).pop()
    if (here?.dataset.family) setFamily(here.dataset.family as typeof family)
  }

  const page = (direction: 1 | -1) => {
    const strip = stripRef.current
    strip?.scrollBy({ left: direction * strip.clientWidth * 0.75 })
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-9 items-center gap-2.5">
        <span className="text-xs font-semibold text-text-secondary">{T.userTheme.theme}</span>
        <span className="truncate text-sm font-bold text-text-main">{T.userTheme[`name_${theme}`]}</span>
        <div className="ml-auto hidden items-center gap-1.5 lg:flex">
          {THEME_GROUPS.map((group) => (
            <Pill key={group.id} pressed={family === group.id} count={group.themes.length} onClick={() => jumpTo(group.id)}>
              {T.userTheme[`group_${group.id}`]}
            </Pill>
          ))}
          <IconButton size="sm" aria-label={T.homeLayout.themesBack} onClick={() => page(-1)} className="ml-1.5">
            <IconChevronLeft size={18} aria-hidden="true" />
          </IconButton>
          <IconButton size="sm" aria-label={T.homeLayout.themesOn} onClick={() => page(1)}>
            <IconChevronRight size={18} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div
        ref={stripRef}
        role="radiogroup"
        aria-label={T.userTheme.theme}
        onScroll={followScroll}
        className="relative flex flex-col gap-4 motion-safe:scroll-smooth lg:-mx-6 lg:flex-row lg:gap-6 lg:overflow-x-auto lg:px-6 lg:py-1 [scrollbar-width:none]"
      >
        {THEME_GROUPS.map((group) => (
          <section key={group.id} data-family={group.id} aria-labelledby={`layout-themes-${group.id}`} className="flex shrink-0 flex-col gap-1.5">
            <h3 id={`layout-themes-${group.id}`} className="text-[0.6875rem] font-semibold text-text-secondary">
              {T.userTheme[`group_${group.id}`]}
            </h3>
            <div className="grid grid-cols-3 gap-2 lg:flex">
              {group.themes.map((id) => (
                <div key={id} className="min-w-0 lg:w-32 lg:shrink-0 [&>button]:w-full">
                  <ThemeModalOption theme={id} checked={theme === id} onSelect={pick} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-danger">
          {T.userTheme.saveError}
        </p>
      )}
    </div>
  )
}
