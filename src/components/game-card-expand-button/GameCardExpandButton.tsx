import { IconChevronDown } from '@tabler/icons-react'

/**
 * The expand control of a game card: a real button whose hit area is stretched over the whole header
 * (the header is `relative`), with a chevron that turns when open. `label` already ends with the game.
 */
export default function GameCardExpandButton({
  open,
  panelId,
  label,
  onToggle,
}: {
  open: boolean
  panelId: string
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={label}
      className="p-1.5 rounded-chip text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-ring"
    >
      <IconChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}
