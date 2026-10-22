import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { IconChevronLeft } from '@tabler/icons-react'
import { CURTAIN_MS, CURTAIN_SWAP_MS, type WelcomeDirection } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import { QUIET_BUTTON } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

const ENTER: Record<WelcomeDirection, string | undefined> = { forward: undefined, back: styles.back, none: styles.calm }

/**
 * A step reached under the curtain mounts halfway through it (all covered) and
 * comes in as the curtain starts to leave, at 74 % of it: seen arriving.
 */
const AFTER_CURTAIN = `${Math.round(CURTAIN_MS * 0.74 - CURTAIN_SWAP_MS)}ms`

/**
 * One step of the welcome: "Back" by its label, the big italic title, what it
 * is about, its fields, its buttons, and on the right (below, on a phone)
 * what it will look like. The title takes the focus when the step was reached
 * by moving, so a screen reader starts reading the new step.
 */
export default function WelcomePageStep({
  kicker,
  title,
  body,
  children,
  actions,
  aside,
  asideLabel,
  wideAside = false,
  onBack,
  direction,
  focusTitle,
}: {
  kicker: string
  title: string
  body: string
  children?: ReactNode
  actions: ReactNode
  aside?: ReactNode
  asideLabel?: string
  /** For the RA guide, which needs room for its sketch. */
  wideAside?: boolean
  onBack?: () => void
  direction: WelcomeDirection
  focusTitle: boolean
}) {
  const { T } = useLanguage()
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus()
  }, [focusTitle])

  return (
    <div
      style={direction === 'none' ? undefined : ({ '--enter-delay': AFTER_CURTAIN } as CSSProperties)}
      className={`${ENTER[direction] ?? ''} grid gap-10 lg:gap-12 items-center ${wideAside ? 'lg:grid-cols-[minmax(0,1fr)_480px]' : 'lg:grid-cols-[minmax(0,1fr)_380px]'}`}
    >
      <div className="flex flex-col gap-4 min-w-0">
        <div className={`${styles.in} flex items-center gap-3 min-h-10`}>
          {onBack && (
            <>
              <button type="button" onClick={onBack} className={`${QUIET_BUTTON} -ml-2`}>
                <IconChevronLeft size={16} aria-hidden="true" />
                {T.welcome.back}
              </button>
              <span aria-hidden="true" className="w-px h-4 bg-ink/15" />
            </>
          )}
          <span className="text-xs sm:text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-accent">{kicker}</span>
        </div>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className={`${styles.in} font-display italic font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.92] max-w-2xl outline-none break-words`}
        >
          {title}
        </h1>
        <p className={`${styles.in2} text-base sm:text-lg leading-relaxed text-text-secondary max-w-xl`}>{body}</p>
        {children && <div className={`${styles.in3} mt-1`}>{children}</div>}
        <div className={`${styles.in3} flex flex-wrap gap-2.5 mt-2`}>{actions}</div>
      </div>
      {aside && (
        <aside aria-label={asideLabel} className="flex flex-col gap-2.5 min-w-0">
          {aside}
        </aside>
      )}
    </div>
  )
}
