/** The most the daily chart gives up, in px (it never goes under its 160px either, see globals.css). */
export const MAX_TRIM = 100

/**
 * Ref for the home's `.home-fit` box: on the screens where Overview fits one
 * screen, the profile column never shrinks, so a profile a little taller than
 * its share pushed the end of the stats off the bottom. Whatever the box runs
 * past the screen comes off the daily chart instead (`--home-fit-trim`; the
 * heatmap follows the chart's box), and the page ends where the screen does.
 * Measured again when the box or the window changes size.
 */
export function homeFit(el: HTMLElement | null) {
  if (!el) return
  let frame = 0
  const fit = () => {
    frame = 0
    // From scratch each time: with the old trim on, a box that now has room would never get it back.
    el.style.setProperty('--home-fit-trim', '0px')
    const room = window.innerHeight - (el.getBoundingClientRect().top + window.scrollY)
    const over = Math.ceil(el.offsetHeight - room)
    el.style.setProperty('--home-fit-trim', `${Math.min(MAX_TRIM, Math.max(0, over))}px`)
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(fit)
  }
  // ponytail: a profile that shrinks while trimmed keeps the trim until the next resize (the box does not change size then).
  const observer = new ResizeObserver(schedule)
  observer.observe(el)
  window.addEventListener('resize', schedule)
  schedule()
  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    window.removeEventListener('resize', schedule)
  }
}
