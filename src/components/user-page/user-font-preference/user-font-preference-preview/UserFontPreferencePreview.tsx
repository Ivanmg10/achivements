import type { FontStyle } from '@/hooks/useFontStyle'

/** A sample of a font pair in its own `data-font` scope, for its choice card. Decorative. */
export default function UserFontPreferencePreview({ font }: { font: FontStyle }) {
  return (
    <span data-font={font} className="flex items-end justify-between rounded-tile bg-bg-main/80 px-3 py-2.5">
      <span className="font-display italic font-extrabold text-3xl leading-none pr-2">Ag</span>
      <span className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold leading-none">Aa</span>
        <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-text-secondary leading-none">Vault</span>
      </span>
    </span>
  )
}
