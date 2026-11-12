import { useCallback, useRef, type ReactNode } from 'react'
import { useScrollFade } from '@/hooks/useScrollFade'
import { MARK } from './shape'

export type Tab<V extends string> = {
  value: V
  label: ReactNode
  /** A count beside the label, formatted by the caller. */
  count?: ReactNode
  /** Drawn before the label, in the accent while its tab is on. */
  icon?: ReactNode
}

type Size = 'sm' | 'md' | 'lg'
type Orientation = 'horizontal' | 'rail'

const SIZES: Record<Size | 'rail', string> = {
  sm: 'h-10 px-3 gap-1.5 text-sm',
  md: 'h-11 px-3.5 gap-1.5 text-[0.9375rem]',
  // A card's title that is also its switch (the home's "Recently played" / "Pinned games").
  lg: 'pb-1.5 gap-1.5 text-xl tracking-tight',
  rail: 'snap-start px-3.5 py-2 lg:py-2.5 gap-2.5 rounded-tile text-sm',
}

const LISTS: Record<Size | Orientation, string> = {
  horizontal: 'flex items-end gap-1 overflow-x-auto shadow-hairline-b',
  // Beside the sections on a wide screen, a strip that scrolls on a narrow one.
  rail: 'flex lg:flex-col gap-1 overflow-x-auto snap-x lg:overflow-visible [scrollbar-width:none]',
  sm: '',
  md: '',
  lg: 'flex flex-wrap items-end gap-x-6 gap-y-1',
}

/**
 * The mark in front of the tab you are on: the site's signature, "/" in the
 * slanted design and "•" in the round one (`--mark`), so the choice never
 * rests on colour alone. `keepRoom` holds its place on the other tabs, for a
 * column whose labels must line up.
 */
export function TabMark({ on, keepRoom = false }: { on: boolean; keepRoom?: boolean }) {
  if (!on && !keepRoom) return null
  return <span aria-hidden="true" className={`${MARK} font-extrabold text-accent ${on ? '' : 'invisible'}`} />
}

/**
 * The look of one tab, for a row of pressed buttons that filter a list in place
 * (no panel to point at) but read as tabs: put a `TabMark` first inside it.
 */
export function tabClass(on: boolean, className = '', size: Size | 'rail' = 'sm') {
  return (
    `relative shrink-0 inline-flex items-center whitespace-nowrap font-semibold transition-colors duration-(--motion-hover) cursor-pointer focus-ring focus-visible:rounded-chip ${SIZES[size]} ` +
    `${on ? 'text-text-main' : 'text-text-secondary hover:text-text-main'} ${className}`
  )
}

/** The bottom hairline under a row of tabs. */
export const TAB_ROW = LISTS.horizontal

/** The ids a tab and its panel share, so the panel can say which tab it belongs to. */
export function tabIds(base: string, value: string) {
  return { tab: `${base}-tab-${value}`, panel: `${base}-panel-${value}` }
}

const NEXT = ['ArrowRight', 'ArrowDown']
const PREV = ['ArrowLeft', 'ArrowUp']

/**
 * Every row of tabs on the site, one drawing (identity B, #127): the mark in
 * front of the tab you are on, no underline. `lg` is a card's title that is its
 * own switch; `orientation="rail"` a column of sections beside the content (a
 * strip on a phone). Arrow keys, Home and End move between them (roving
 * tabindex). The panel is the caller's: give it `role="tabpanel"`,
 * `id={tabIds(id, value).panel}` and `aria-labelledby={tabIds(id, value).tab}`;
 * with `panels={false}` (a switch whose content has no single panel) the tabs
 * point at none.
 */
export default function Tabs<V extends string>({
  id,
  'aria-label': label,
  value,
  onChange,
  tabs,
  size = 'md',
  orientation = 'horizontal',
  panels = true,
  className = '',
}: {
  /** Base for the tab and panel ids. */
  id: string
  'aria-label': string
  value: V
  onChange: (value: V) => void
  tabs: Tab<V>[]
  size?: Size
  orientation?: Orientation
  panels?: boolean
  /** Layout only. */
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  // A row wider than its room scrolls, and its cut edge fades so it says there is more (#134).
  const { ref: fadeRef, fade } = useScrollFade()
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      listRef.current = el
      return fadeRef(el)
    },
    [fadeRef],
  )
  const rail = orientation === 'rail'

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1
    const step = NEXT.includes(e.key) ? 1 : PREV.includes(e.key) ? -1 : 0
    const next = step ? (index + step + tabs.length) % tabs.length : { Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(tabs[next].value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  const list = rail ? LISTS.rail : size === 'lg' ? LISTS.lg : LISTS.horizontal

  return (
    <div ref={ref} role="tablist" aria-label={label} aria-orientation={rail ? 'vertical' : undefined} className={`${list} ${fade} ${className}`}>
      {tabs.map((t, i) => {
        const on = t.value === value
        const ids = tabIds(id, t.value)
        return (
          <button
            key={t.value}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panels ? ids.panel : undefined}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={tabClass(on, rail && !on ? 'hover:bg-ink/5' : '', rail ? 'rail' : size)}
          >
            <TabMark on={on} keepRoom={rail} />
            {t.icon && <span aria-hidden="true" className={`flex ${on ? 'text-accent' : ''}`}>{t.icon}</span>}
            {t.label}
            {t.count !== undefined && <span className="text-xs font-bold tabular-nums text-text-secondary">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
