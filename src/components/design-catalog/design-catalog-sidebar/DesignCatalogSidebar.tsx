'use client'

import Select from '@/components/ui/Select'
import { useActiveSection } from '../useActiveSection'
import { ALL_PIECES, GROUPS } from '../catalogue'

const IDS = ALL_PIECES.map((p) => p.id)

/**
 * The catalogue's menu: every piece under its group, the one being read marked
 * with the accent's lean mark (and `aria-current`, so it is not colour alone).
 * Sticky beside the content on a wide screen; on a narrow one a select that jumps.
 */
export default function DesignCatalogSidebar() {
  const active = useActiveSection(IDS)

  return (
    <>
      <div className="lg:hidden sticky top-16 z-10 -mx-3 sm:-mx-8 px-3 sm:px-8 py-2 bg-bg-main/90 backdrop-blur">
        <Select<string>
          aria-label="Jump to a piece"
          size="sm"
          value={active}
          onChange={(id) => {
            window.location.hash = id
          }}
          options={ALL_PIECES.map((p) => ({ value: p.id, label: p.title }))}
        />
      </div>

      <nav aria-label="Design system" className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-3 -mr-3">
        <ul className="flex flex-col gap-5">
          {GROUPS.map((group) => (
            <li key={group.id}>
              <p className="px-3 pb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-text-secondary">{group.title}</p>
              <ul className="flex flex-col">
                {group.pieces.map((piece) => {
                  const on = piece.id === active
                  return (
                    <li key={piece.id}>
                      <a
                        href={`#${piece.id}`}
                        aria-current={on ? 'location' : undefined}
                        className={`relative block rounded-control px-3 py-1.5 text-sm transition-colors duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-accent before:skew-y-(--slant-mark) before:transition-opacity ${
                          on ? 'font-bold text-text-main bg-ink/[0.06] before:opacity-100' : 'font-medium text-text-secondary hover:text-text-main hover:bg-ink/[0.04] before:opacity-0'
                        }`}
                      >
                        {piece.title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
