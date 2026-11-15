import { Fragment, type ReactNode } from 'react'
import { MARK } from './shape'

/**
 * Facts on one line, joined by the site's mark ("PS4 / 33 of 51 trophies /
 * 11 h ago"): "/" in the slanted design, "•" in the round one, in the accent.
 * The mark is hidden from a screen reader, which hears a comma instead. Empty
 * facts (`null`, `false`, `''`) are left out, with their mark. Returns the
 * pieces themselves, so it sits in the caller's line or flex row.
 */
export default function Facts({ items }: { items: ReactNode[] }) {
  const shown = items.filter((item) => item !== null && item !== undefined && item !== false && item !== '')
  return (
    <>
      {shown.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              <span aria-hidden="true" className={`${MARK} px-[0.45em] font-bold text-accent`} />
              <span className="sr-only">, </span>
            </>
          )}
          {item}
        </Fragment>
      ))}
    </>
  )
}
