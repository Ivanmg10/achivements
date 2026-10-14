import { IconCrown } from '@tabler/icons-react'

/**
 * One measure, them against you: both numbers, a bar split by their share of
 * the total, and a crown on the side that leads — said in words too, for
 * whoever cannot see it.
 */
export default function PublicUserDuelRow({
  label,
  theirs,
  mine,
  format = (n) => n.toLocaleString(),
  leadText,
}: {
  label: string
  theirs: number
  mine: number
  format?: (n: number) => string
  /** "{who} leads", with {who} filled in for the side ahead. */
  leadText: (side: 'them' | 'me') => string
}) {
  const total = theirs + mine
  const theirShare = total > 0 ? (theirs / total) * 100 : 50
  const lead = theirs === mine ? null : theirs > mine ? 'them' : 'me'

  return (
    <li className="grid grid-cols-[4.5rem_1fr_4.5rem] sm:grid-cols-[6rem_1fr_6rem] items-center gap-3">
      <span className={`flex items-center gap-1 text-base sm:text-lg font-bold tabular-nums ${lead === 'them' ? 'text-text-main' : 'text-text-secondary'}`}>
        {lead === 'them' && <IconCrown size={14} className="text-warning shrink-0" aria-hidden="true" />}
        {format(theirs)}
      </span>
      <span className="flex flex-col gap-1.5 min-w-0">
        <span className="text-xs text-center text-text-secondary truncate">
          {label}
          {lead && <span className="sr-only">: {leadText(lead)}</span>}
        </span>
        <span aria-hidden="true" className="flex h-1.5 rounded-full overflow-hidden bg-ink/10">
          <span className="bg-accent transition-[width] duration-500" style={{ width: `${theirShare}%` }} />
          <span className="flex-1 bg-info/70" />
        </span>
      </span>
      <span className={`flex items-center justify-end gap-1 text-base sm:text-lg font-bold tabular-nums ${lead === 'me' ? 'text-text-main' : 'text-text-secondary'}`}>
        {format(mine)}
        {lead === 'me' && <IconCrown size={14} className="text-warning shrink-0" aria-hidden="true" />}
      </span>
    </li>
  )
}
