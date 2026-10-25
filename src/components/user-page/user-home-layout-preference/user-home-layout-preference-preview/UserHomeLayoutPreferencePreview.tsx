import type { HomeLayout } from '@/hooks/useHomeLayout'

const BAR = 'block h-2 w-1/2 rounded-sm bg-ink/10'
const ROW = 'block h-4 rounded-[0.3125rem]'
const SIDE = 'block rounded-[0.3125rem] bg-ink/[0.08]'

/**
 * A small drawing of a home layout for its card in the picker: classic, the
 * recent games beside the profile; cover, the last game in big across the top.
 * Decorative (the card's words say what it is).
 */
export default function UserHomeLayoutPreferencePreview({ layout }: { layout: HomeLayout }) {
  const recent = (
    <span className="flex flex-col gap-1.5">
      <span className={`${ROW} bg-linear-to-r from-accent/35 to-ink/[0.06]`} />
      <span className={`${ROW} bg-linear-to-r from-info/35 to-ink/[0.06]`} />
      {layout === 'classic' && <span className={`${ROW} bg-linear-to-r from-warning/30 to-ink/[0.06]`} />}
      <span className={`${ROW} bg-ink/[0.08]`} />
    </span>
  )
  return (
    <span className="flex flex-col gap-1.5 rounded-[0.625rem] bg-bg-main/80 p-2 h-28">
      {layout === 'cover' && <span className="block h-10 shrink-0 rounded-[0.3125rem] bg-linear-to-r from-transparent to-accent/80" />}
      <span className="grid grid-cols-[1.7fr_1fr] gap-1.5 flex-1">
        <span className="flex flex-col gap-1.5">
          {layout === 'classic' && <span className={BAR} />}
          {recent}
        </span>
        <span className="flex flex-col gap-1.5">
          {layout === 'classic' && <span className={BAR} />}
          <span className={`${SIDE} flex-1`} />
          <span className={`${SIDE} h-4`} />
        </span>
      </span>
    </span>
  )
}
