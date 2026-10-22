import type { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { IconAdjustmentsHorizontal, IconArrowRight, IconUser } from '@tabler/icons-react'
import { WELCOME_STEPS, isPlatformStep, type PlatformStep, type WelcomeDirection, type WelcomeStep } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { LANGUAGES } from '@/utils/languages'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import WelcomePageStep from '@/components/welcome-page/welcome-page-step/WelcomePageStep'
import { PRIMARY_BUTTON, QUIET_BUTTON, STEP_SKY } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

type Row = { step: WelcomeStep; mark: ReactNode; text: string; done: boolean; action: string; reading?: boolean }

/**
 * The end: what got linked (its games are being read), what was left for
 * later, each with a way back to its step, and the way into the app.
 */
export default function WelcomePageDone({
  linked,
  onGoTo,
  onFinish,
  onBack,
  direction,
  focusTitle,
}: {
  linked: Record<PlatformStep, boolean>
  onGoTo: (index: number) => void
  onFinish: () => void
  onBack: () => void
  direction: WelcomeDirection
  focusTitle: boolean
}) {
  const { data: session } = useSession()
  const { T, lang } = useLanguage()
  const { theme } = useTheme()
  const t = T.welcome.done
  const user = session?.user
  const anyLinked = Object.values(linked).some(Boolean)
  const profileFilled = Boolean(user?.avatar || user?.location || user?.description || user?.gender)
  const language = LANGUAGES.find((l) => l.id === lang)?.label ?? lang

  const platform = (step: PlatformStep, mark: ReactNode): Row => ({
    step,
    mark,
    text: linked[step] ? t.linked : t.later,
    done: linked[step],
    action: t.connect,
    reading: linked[step],
  })
  const rows: Row[] = [
    platform('ra', <RaLogo height={14} />),
    platform('steam', <SteamLogo size={20} aria-hidden="true" />),
    platform('psn', <PlaystationLogo size={20} aria-hidden="true" />),
    { step: 'profile', mark: <IconUser size={20} aria-hidden="true" />, text: profileFilled ? t.profileDone : t.profileEmpty, done: true, action: t.edit },
    { step: 'prefs', mark: <IconAdjustmentsHorizontal size={20} aria-hidden="true" />, text: `${language} · ${T.userTheme[`name_${theme}`]}`, done: true, action: t.edit },
  ]

  return (
    <WelcomePageStep
      kicker={t.kicker}
      title={anyLinked ? t.title : t.titleNone}
      body={anyLinked ? t.body : t.bodyNone}
      onBack={onBack}
      direction={direction}
      focusTitle={focusTitle}
      asideLabel={T.welcome.steps.done}
      aside={
        <ul className="flex flex-col gap-2">
          {rows.map((row, i) => {
            const isPlatform = isPlatformStep(row.step)
            return (
              <li
                key={row.step}
                className={`${styles.card} flex items-center gap-3 p-3 rounded-2xl bg-bg-card ring-1 ring-ink/[0.06]`}
                style={{ animationDelay: `calc(var(--enter-delay, 0s) + ${220 + i * 70}ms)` }}
              >
                <span
                  aria-hidden="true"
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white ${isPlatform && !row.done ? 'opacity-40' : ''}`}
                  style={{ background: isPlatform ? STEP_SKY[row.step] : 'color-mix(in oklab, rgb(var(--accent)) 45%, rgb(var(--bg-card)))' }}
                >
                  {row.mark}
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="text-sm font-semibold">{T.welcome.steps[row.step]}</span>
                  <span className="text-xs text-text-secondary truncate">{row.text}</span>
                  {row.reading && <span aria-hidden="true" className={`${styles.shimmer} block h-0.5 rounded-full`} />}
                </span>
                {(!isPlatform || !row.done) && (
                  <button
                    type="button"
                    onClick={() => onGoTo(WELCOME_STEPS.indexOf(row.step))}
                    aria-label={`${row.action}: ${T.welcome.steps[row.step]}`}
                    className={`${QUIET_BUTTON} text-accent! font-semibold`}
                  >
                    {row.action}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      }
      actions={
        <button type="button" onClick={onFinish} className={PRIMARY_BUTTON}>
          {T.welcome.goToVault}
          <IconArrowRight size={16} aria-hidden="true" />
        </button>
      }
    />
  )
}
