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
        className={`flex items-center gap-1 px-3.5 py-1.5 text-sm rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 whitespace-nowrap cursor-pointer ${
          active
            ? `text-accent font-medium ${glass ? 'bg-ink/10 backdrop-blur-sm' : 'bg-bg-main'} ring-1 ring-ink/10`
            : `text-text-secondary hover:text-text-main ${glass ? 'hover:bg-ink/10' : 'hover:bg-bg-main/60'}`
        }`}
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
