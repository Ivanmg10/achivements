import type { Icon } from '@tabler/icons-react'

/**
 * The big, faint icon behind a hero card's title (the people on Following, the
 * cup on the rankings' card and guide). One size, one opacity, whole inside its
 * card at the title's line, never cut by its edge. The card is `relative` and
 * `overflow-hidden`. Hidden on a phone, where the title takes the width.
 */
export default function GhostIcon({ icon: Glyph }: { icon: Icon }) {
  return <Glyph aria-hidden="true" size={112} stroke={1} className="hidden sm:block absolute right-6 top-6 text-accent/10 pointer-events-none" />
}
