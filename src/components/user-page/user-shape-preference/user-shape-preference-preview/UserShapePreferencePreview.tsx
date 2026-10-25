import type { ShapeStyle } from '@/hooks/useShapeStyle'
import { slantStyle } from '@/components/ui/shape'

/**
 * A small drawing of a shape for its choice card: a button, a tag, a switch and
 * a bar, each drawn from the design's tokens inside a scope of that design, so
 * the two cards show what the choice does whichever one is on now. Decorative.
 */
export default function UserShapePreferencePreview({ shape }: { shape: ShapeStyle }) {
  return (
    <span data-shape={shape} className="flex flex-col gap-2.5 rounded-tile bg-bg-main/80 p-3">
      <span className="flex items-center gap-2">
        <span className="relative isolate h-7 w-16 grid place-items-center">
          <span className="absolute inset-y-0 inset-x-[3px] bg-accent skew-x-(--slant-button) rounded-button" />
        </span>
        <span className="h-5 w-12 bg-ink/15 rounded-chip" />
        <span className="relative h-5 w-9 ml-auto">
          <span className="absolute inset-0 bg-accent skew-x-(--slant-pill) rounded-(--r-track)" />
          <span className="absolute top-[3px] right-[3px] h-3.5 w-(--knob-w) max-w-3.5 bg-white skew-x-(--slant-pill) rounded-(--r-knob)" />
        </span>
      </span>
      <span className="block h-2.5 bg-ink/10">
        <span className="block h-full w-2/3 bg-accent" style={slantStyle(8)} />
      </span>
    </span>
  )
}
