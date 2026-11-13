import type { SampleGroup } from '@/components/landing-page/landingSamples'
import LandingGroup from '@/components/landing-page/landing-group/LandingGroup'

/** How many times the groups repeat in each half: a half must be wider than a 2560 px screen. */
const REPEAT = 2

/**
 * The example groups going by sideways forever, as the closing band's covers do (`.cover-reel-row`): two identical halves,
 * so moving by half lands on the same frame (the trailing gap is padding, so the halves are exactly equal). It stops
 * under the pointer and with the landing's stop button; under reduced motion it stands still and scrolls by hand, the
 * copies gone. A screen reader gets each group once. The edges fade into the page.
 */
export default function LandingGroupReel({ groups }: { groups: SampleGroup[] }) {
  const half = Array.from({ length: REPEAT }, () => groups).flat()

  return (
    <div className="overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <ul className="cover-reel-row hover:[animation-play-state:paused] [animation-duration:110s] flex w-max gap-4 pr-4 lg:gap-6 lg:pr-6 py-1">
        {[...half, ...half].map((g, i) => {
          const copy = i >= groups.length
          return (
            <li key={i} aria-hidden={copy || undefined} className={`w-[17rem] sm:w-[22rem] shrink-0 ${copy ? 'motion-reduce:hidden' : ''}`}>
              <LandingGroup group={g} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
