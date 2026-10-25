import { useEffect, useId, useRef, useState } from 'react'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { fieldClass } from './Input'
import { buttonClass } from './Button'
import { MENU_SURFACE } from './menu'

export type SelectOption<V extends string> = {
  value: V
  label: string
  /** A line under the label. */
  description?: string
  icon?: React.ReactNode
}

type Props<V extends string> = {
  value: V
  onChange: (value: V) => void
  options: SelectOption<V>[]
  /** Pairs with a `<label htmlFor>`; one is made when missing. */
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  /** `button`: drawn as a secondary button (a sort order beside a toolbar's tabs) instead of a field. */
  look?: 'field' | 'button'
  /** A quiet label inside, before the value ("Period  All time"); the accessible name stays `aria-label`. */
  prefix?: string
  /** Layout only, on the wrapper. */
  className?: string
}

/**
 * The library's select: a field-looking button that opens a list with the
 * menu's look (icons, a line of description), never the native one. Keyboard
 * as a select-only combobox: arrows, Home / End, type-ahead, Enter or Space to
 * pick, Escape to close.
 */
export default function Select<V extends string>({
  value,
  onChange,
  options,
  id,
  size = 'md',
  disabled,
  look = 'field',
  prefix,
  className = '',
  ...aria
}: Props<V>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const autoId = useId()
  const buttonId = id ?? `${autoId}-select`
  const listId = `${autoId}-list`

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  function openList() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function pick(index: number) {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function typeAhead(key: string) {
    const now = Date.now()
    typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + key.toLowerCase(), at: now }
    const from = open ? active : selectedIndex
    const order = [...options.slice(from + 1), ...options.slice(0, from + 1)]
    const hit = order.find((o) => o.label.toLowerCase().startsWith(typed.current.text))
    if (!hit) return
    const index = options.indexOf(hit)
    if (open) setActive(index)
    else onChange(hit.value)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      } else if (e.key.length === 1) typeAhead(e.key)
      return
    }
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(active)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    } else if (e.key.length === 1) {
      typeAhead(e.key)
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={look === 'button' ? buttonClass('secondary', size, 'pr-10') : fieldClass({ size }, 'flex items-center gap-2 text-left cursor-pointer pr-10')}
        {...aria}
      >
        {selected?.icon && <span aria-hidden="true" className="shrink-0">{selected.icon}</span>}
        {prefix && <span aria-hidden="true" className="shrink-0 font-medium text-text-secondary">{prefix}</span>}
        <span className={`truncate ${prefix ? 'font-bold' : ''}`}>{selected?.label}</span>
        <IconChevronDown
          size={16}
          aria-hidden="true"
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${look === 'button' ? 'text-text-main' : 'text-text-secondary'} transition-transform duration-(--motion-hover) ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className={`absolute z-50 left-0 top-full mt-1.5 min-w-full max-h-72 overflow-y-auto ${MENU_SURFACE} animate-[select-in_var(--motion-hover)_ease-out] motion-reduce:animate-none`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className={`flex items-start gap-2.5 px-3 py-2 rounded-chip cursor-pointer text-sm ${i === active ? 'bg-accent/12 text-text-main' : 'text-text-main'}`}
            >
              {o.icon && <span aria-hidden="true" className="shrink-0 mt-0.5">{o.icon}</span>}
              <span className="flex-1 min-w-0">
                <span className="block">{o.label}</span>
                {o.description && <span className="block text-xs text-text-secondary">{o.description}</span>}
              </span>
              {o.value === value && <IconCheck size={15} aria-hidden="true" className="shrink-0 mt-0.5 text-accent" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
