import type { ReactNode } from 'react'
import { IconAdjustmentsHorizontal, IconCheck, IconUser } from '@tabler/icons-react'
import { WELCOME_STEPS, type WelcomeStep, type WelcomeTransition } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { STEP_SKY } from '@/components/welcome-page/welcomeArt'
import styles from '@/components/welcome-page/WelcomePage.module.css'

const MARK: Record<WelcomeStep, ReactNode> = {
  intro: <span className="font-display italic font-extrabold text-xl">CV</span>,
  ra: <RaLogo height={18} />,
  steam: <SteamLogo size={26} aria-hidden="true" />,
  psn: <PlaystationLogo size={26} aria-hidden="true" />,
  profile: <IconUser size={24} aria-hidden="true" />,
  prefs: <IconAdjustmentsHorizontal size={24} aria-hidden="true" />,
  done: <IconCheck size={26} aria-hidden="true" />,
}

function Node({ step, at, reached }: { step: WelcomeStep; at: string; reached: boolean }) {
  const { T } = useLanguage()
  return (
    <span className="absolute top-[calc(52%-30px)] flex flex-col items-center gap-3 -translate-x-1/2" style={{ left: at }}>
      <span className={`w-15 h-15 rounded-full bg-white text-[#1d1640] flex items-center justify-center ${reached ? 'ring-[6px] ring-white/25' : ''}`}>
        {MARK[step]}
      </span>
      <span className="font-display italic font-extrabold text-2xl text-white whitespace-nowrap">{T.welcome.steps[step]}</span>
    </span>
  )
}

/**
 * What covers the screen while the step changes, after the change of day in
 * Inazuma Eleven: Victory Road: a chevron-edged panel sweeps across, a band
 * inside it travels from the step left to the one reached while its sky turns
 * into the new one's, and the panel leaves with the new step underneath.
 * Going back, all of it runs the other way. Decorative: the bar and the new
 * title say where the person is.
 */
export default function WelcomePageCurtain({ transition }: { transition: WelcomeTransition }) {
  const { T } = useLanguage()
  const from = WELCOME_STEPS[transition.from]
  const to = WELCOME_STEPS[transition.to]
  const forward = transition.direction === 'forward'
  const word = T.welcome.words[to]

  return (
    <div aria-hidden="true" className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
      <div className={`${styles.panel} ${forward ? '' : styles.panelBack} absolute inset-y-0 -left-[70px] w-[calc(100%+140px)] overflow-hidden`}>
        <div className={`${styles.curtainWord} absolute left-0 top-10 whitespace-nowrap font-display italic font-extrabold text-[clamp(140px,22vw,280px)] leading-none`}>
          {word} · {word} · {word}
        </div>
        <div className={`${styles.curtainWord} absolute -left-48 -bottom-14 whitespace-nowrap font-display italic font-extrabold text-[clamp(140px,22vw,280px)] leading-none`}>
          {word} · {word} · {word}
        </div>
        <div className={`${styles.band} ${styles.echo2} absolute inset-y-0`} />
        <div className={`${styles.band} ${styles.echo1} absolute inset-y-0`} />
        <div className={`${styles.band} absolute inset-y-0 overflow-hidden`}>
          <div className="absolute inset-0" style={{ background: STEP_SKY[from] }} />
          <div className={`${styles.toSky} absolute inset-0`} style={{ background: STEP_SKY[to] }} />
        </div>
        <div className="absolute left-[70px] right-[70px] top-[52%] h-0.5 bg-white/60" />
        <Node step={from} at={forward ? '32%' : '66%'} reached={false} />
        <Node step={to} at={forward ? '66%' : '32%'} reached />
      </div>
    </div>
  )
}
