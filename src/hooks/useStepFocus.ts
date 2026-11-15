import { useEffect, useRef } from 'react'

const lost = () => {
  const active = document.activeElement
  return !active || active === document.body || active.getClientRects().length === 0
}

/**
 * Below `lg` a two-pane dialog shows one pane at a time, so opening an item hides the button that was tapped and the
 * focus falls to `<body>`, outside the dialog (#165, H7). `openKey` is the open item (null on the list): when it opens,
 * the focus goes to the heading with `detail` (its heading, `tabIndex={-1}`); when it closes, back to the list's button
 * marked `data-step-key={key}`, inside the div with `list`. Only when the focus was lost, so from `lg`, where both
 * panes show and the list keeps it (arrows keep working), nothing moves.
 */
export function useStepFocus(openKey: string | null) {
  const detail = useRef<HTMLHeadingElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const was = useRef<string | null>(openKey)
  const last = useRef<string | null>(openKey)

  useEffect(() => {
    const before = was.current
    was.current = openKey
    if (openKey !== null) last.current = openKey
    if ((before === null) === (openKey === null) || !lost()) return
    if (openKey !== null) detail.current?.focus()
    else [...(list.current?.querySelectorAll<HTMLElement>('[data-step-key]') ?? [])].find((el) => el.dataset.stepKey === last.current)?.focus()
  }, [openKey])

  return { detail, list }
}
