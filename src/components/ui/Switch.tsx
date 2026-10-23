type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  /** Names it when no visible label is tied with aria-labelledby. */
  'aria-label'?: string
  'aria-labelledby'?: string
  disabled?: boolean
  className?: string
}

/**
 * The library's on/off switch, slanted like the button and the segmented
 * control: the track and the knob lean on the design's slant, the knob springs
 * across. Say the state in words beside it (on/off by colour alone is not enough).
 */
export default function Switch({ checked, onChange, disabled, className = '', ...aria }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative isolate shrink-0 w-[3.375rem] h-7 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:rounded-chip ${className}`}
      {...aria}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 inset-x-[3px] -z-10 rounded-[7px] skew-x-(--slant-pill) shadow-[inset_0_2px_4px_rgb(0_0_0/0.25)] transition-colors duration-(--motion-open) ${
          checked ? 'bg-accent' : 'bg-ink/16'
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute top-1 left-[7px] w-[1.375rem] h-5 rounded-[4px] bg-white shadow skew-x-(--slant-pill) transition-transform duration-(--motion-open) ease-(--ease-spring) motion-reduce:transition-none ${
          checked ? 'translate-x-[1.125rem]' : ''
        }`}
      />
    </button>
  )
}
