import GroupCoverImage from '@/components/groups/group-cover-image/GroupCoverImage'

/**
 * A group's banner: the band split between its games' covers, one slice each (up to four), as the group's
 * album card and the landing's example groups draw it. A cover is a URL or a list of them tried in turn
 * (`coverSources`). Decorative; the card names the group. Fills its parent.
 */
export default function GroupCoverStrip({ covers }: { covers: readonly (string | readonly string[])[] }) {
  const shown = covers.slice(0, 4)
  return (
    <div aria-hidden="true" className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
      {shown.map((src, i) => {
        const sources = typeof src === 'string' ? [src] : src
        return <GroupCoverImage key={`${i}-${sources.join()}`} sources={sources} />
      })}
    </div>
  )
}
