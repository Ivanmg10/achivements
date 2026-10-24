'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { IconChevronDown } from '@tabler/icons-react'
import { useClickAway } from '@/hooks/useClickAway'
import { MENU_SURFACE, menuItemClass } from '@/components/ui/menu'

export default function StatusNavDropdown({
  items,
  active,
  glass,
  label,
}: {
  items: { href: string; label: string }[]
  active: boolean
  glass?: boolean
  label: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickAway(ref, isOpen, () => setIsOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((o) => !o)}
        className={`relative inline-flex items-center gap-1 h-10 px-3 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:rounded-chip after:content-[''] after:absolute after:left-2.5 after:right-2.5 after:bottom-0.5 after:h-[3px] after:bg-accent after:skew-x-(--slant-line) after:origin-left after:transition-transform after:duration-(--motion-open) ${active ? 'text-text-main after:scale-x-100' : 'text-text-secondary hover:text-text-main after:scale-x-0'}`}
      >
        {label}
        <IconChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div
          role="menu"
          className={`absolute top-full left-0 mt-1 z-20 min-w-40 ${MENU_SURFACE}`}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={menuItemClass()}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
