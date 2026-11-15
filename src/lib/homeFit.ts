/** Where the height the profile ended up with is kept (`width:height`, as `RememberedHeight`), for its skeleton. */
export const HOME_PROFILE_KEY = 'block-height:home-profile'

/** The most the daily chart gives up, in px (it never goes under its 160px either, see globals.css). */
export const MAX_TRIM = 100

/**
 * Ref for the home's `.home-fit` box: on the screens where Overview fits one
 * screen, the profile column never shrinks, so a profile a little taller than
 * its share pushed the end of the stats off the bottom. Whatever the box runs
 * past the screen comes off the daily chart instead (`--home-fit-trim`; the
 * heatmap follows the chart's box), and the page ends where the screen does.
 * Measured again when the box or the window changes size, and when the profile
 * changes: a trimmed box does not resize when a shorter profile leaves it room.
 * It also remembers how tall the loaded profile is, as what sets the height of
 * the top of the home: its skeleton keeps that room, not a guess.
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
    const profile = el.querySelector<HTMLElement>('[data-home-profile]')
    if (profile?.offsetHeight && !profile.querySelector('[aria-busy="true"]')) {
      try {
        window.localStorage.setItem(HOME_PROFILE_KEY, `${window.innerWidth}:${profile.offsetHeight}`)
      } catch {
        // Storage blocked: the next load's skeleton just takes its own height.
      }
    }
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(fit)
  }
  const observer = new ResizeObserver(schedule)
  observer.observe(el)
  const remembered = el.querySelector('[data-home-profile]')
  if (remembered) observer.observe(remembered)
  const profile = new MutationObserver(schedule)
  const side = el.querySelector('.home-fit-side')
  if (side) profile.observe(side, { childList: true, subtree: true })
  window.addEventListener('resize', schedule)
  schedule()
  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    profile.disconnect()
    window.removeEventListener('resize', schedule)
  }
}
