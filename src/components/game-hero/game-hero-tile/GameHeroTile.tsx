export type GameHeroTileData = {
  label: string
  /** The figure; with `of`, the part reached. */
  value: string | number
  /** The whole, shown small after the figure ("/ 39"). */
  of?: string | number
  /** Reached the whole: the figure turns to the success colour. */
  done?: boolean
}

/** One figure of a game's hero (achievements, points, play time) on a glass tile. */
export default function GameHeroTile({ label, value, of, done }: GameHeroTileData) {
  return (
    <div className="rounded-tile px-3.5 py-3 bg-bg-card/85 ring-1 ring-inset ring-ink/[0.07] backdrop-blur-md min-w-0">
      <dt className="text-xs text-text-secondary truncate">{label}</dt>
      <dd className={`mt-0.5 text-[1.625rem] leading-tight font-extrabold tabular-nums tracking-[-0.01em] truncate ${done ? 'text-success' : 'text-text-main'}`}>
        {value}
        {of !== undefined && <small className="text-[0.9375rem] font-semibold text-text-secondary"> / {of}</small>}
      </dd>
    </div>
  )
}
