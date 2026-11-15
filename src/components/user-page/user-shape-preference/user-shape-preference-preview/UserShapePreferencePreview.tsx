import type { ShapeStyle } from '@/hooks/useShapeStyle'
import { MARK } from '@/components/ui/shape'

/**
 * A small drawing of a shape for its choice card: the primary button (the one
 * thing that leans), a tag, a switch, the mark and a bar, each drawn from the
 * design's tokens inside a scope of that design, so the two cards show what the
 * choice does whichever one is on now. Decorative.
 */
export default function UserShapePreferencePreview({ shape }: { shape: ShapeStyle }) {
  return (
    <span data-shape={shape} className="flex flex-col gap-2.5 rounded-tile bg-bg-main/80 p-3">
      <span className="flex items-center gap-2">
        <span className="relative isolate h-7 w-16 grid place-items-center">
          <span className="absolute inset-y-0 inset-x-[3px] bg-accent skew-x-(--slant) rounded-button" />
        </span>
        <span className="h-5 w-12 bg-ink/15 rounded-chip" />
        <span className="relative h-5 w-9 ml-auto">
          <span className="absolute inset-0 bg-accent rounded-(--r-track)" />
          <span className="absolute top-[3px] right-[3px] h-3.5 w-(--knob-w) max-w-3.5 bg-white rounded-(--r-knob)" />
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className={`text-sm font-extrabold leading-none text-accent ${MARK}`} />
        <span className="block h-2.5 flex-1 bg-ink/10 rounded-(--bar-radius) overflow-hidden">
          <span className="block h-full w-2/3 bg-accent" />
        </span>
      </span>
    </span>
  )
}
