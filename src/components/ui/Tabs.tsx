import { useRef } from 'react'

export type Tab<V extends string> = {
  value: V
  label: React.ReactNode
  /** A count beside the label, formatted by the caller. */
  count?: number | string
}

/**
 * The look of one tab with its slanted line, for a row of pressed buttons that
 * filter a list in place (no panel to point at) but should read as tabs.
 */
export function tabClass(on: boolean, className = '') {
  return (
    'relative shrink-0 inline-flex items-center gap-2 h-10 px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-(--motion-hover) cursor-pointer ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:rounded-chip ' +
    "after:content-[''] after:absolute after:left-2 after:right-2 after:bottom-0 after:h-1 after:bg-accent after:skew-x-(--slant-line) after:origin-left after:transition-transform after:duration-(--motion-open) " +
    (on ? 'text-text-main after:scale-x-100 ' : 'text-text-secondary hover:text-text-main after:scale-x-0 ') +
    className
  )
}

/** The bottom hairline under a row of tabs. */
export const TAB_ROW = 'flex items-end gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]'

/** The ids a tab and its panel share, so the panel can say which tab it belongs to. */
export function tabIds(base: string, value: string) {
  return { tab: `${base}-tab-${value}`, panel: `${base}-panel-${value}` }
}

/**
 * A row of tabs with the slanted accent line under the current one. Arrow keys,
 * Home and End move between them (roving tabindex). The panel is the caller's:
 * give it `role="tabpanel"`, `id={tabIds(id, value).panel}` and
 * `aria-labelledby={tabIds(id, value).tab}`.
 */
export default function Tabs<V extends string>({
  id,
  'aria-label': label,
  value,
  onChange,
  tabs,
  size = 'md',
  className = '',
}: {
  /** Base for the tab and panel ids. */
  id: string
  'aria-label': string
  value: V
  onChange: (value: V) => void
  tabs: Tab<V>[]
  size?: 'sm' | 'md'
  /** Layout only. */
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(tabs[next].value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  const text = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-3.5 text-[0.9375rem]'

  return (
    <div ref={listRef} role="tablist" aria-label={label} className={`flex items-end gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)] ${className}`}>
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
            aria-controls={ids.panel}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative shrink-0 inline-flex items-center gap-2 whitespace-nowrap font-semibold transition-colors duration-(--motion-hover) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:rounded-chip ${text} ${
              on ? 'text-text-main' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="text-xs font-bold tabular-nums text-text-secondary">{t.count}</span>}
            <span
              aria-hidden="true"
              className={`absolute left-2 right-2 bottom-0 h-1 bg-accent skew-x-(--slant-line) origin-left transition-transform duration-(--motion-open) ease-out motion-reduce:transition-none ${on ? 'scale-x-100' : 'scale-x-0'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
