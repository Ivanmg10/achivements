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
 * The library's on/off switch, upright in both designs (a small control never
 * leans, #127; a pill with a round knob in the round design): the track and the knob
 * read the design's tokens, the knob springs across. Say the state in words beside it (on/off by colour alone is not enough).
 */
export default function Switch({ checked, onChange, disabled, className = '', ...aria }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative isolate shrink-0 w-[3.375rem] h-7 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring focus-visible:rounded-chip ${className}`}
      {...aria}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 inset-x-[3px] -z-10 rounded-(--r-track) shadow-sunken transition-colors duration-(--motion-open) ${
          checked ? 'bg-accent' : 'bg-ink/16'
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute top-1 left-[7px] w-(--knob-w) h-(--knob-h) rounded-(--r-knob) shadow transition-[transform,background-color] duration-(--motion-open) ease-(--ease-spring) motion-reduce:transition-none ${
          checked ? 'bg-bg-main translate-x-(--knob-shift)' : 'bg-white'
        }`}
      />
    </button>
  )
}
