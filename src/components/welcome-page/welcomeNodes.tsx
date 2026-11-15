import type { ReactNode } from 'react'
import { IconAdjustmentsHorizontal, IconCheck, IconEye, IconUser, IconUserPlus } from '@tabler/icons-react'
import type { WelcomeStep } from '@/hooks/useWelcomeSteps'
import type { Translations } from '@/translations/en'
import type { CurtainNode } from '@/components/welcome-curtain/WelcomeCurtain'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { STEP_SKY } from '@/components/welcome-page/welcomeArt'

const MARK: Record<WelcomeStep, ReactNode> = {
  intro: <span className="font-display italic font-extrabold text-2xl">CV</span>,
  ra: <RaLogo height={22} />,
  steam: <SteamLogo size={30} aria-hidden="true" />,
  psn: <PlaystationLogo size={30} aria-hidden="true" />,
  profile: <IconUser size={28} aria-hidden="true" />,
  prefs: <IconAdjustmentsHorizontal size={28} aria-hidden="true" />,
  privacy: <IconEye size={28} aria-hidden="true" />,
  done: <IconCheck size={30} aria-hidden="true" />,
}

/** A welcome step as one end of the curtain. */
export function stepNode(step: WelcomeStep, T: Translations): CurtainNode {
  return { label: T.welcome.steps[step], mark: MARK[step], sky: STEP_SKY[step] }
}

/** The account just created, where the way in from sign-up starts. */
export function accountNode(T: Translations): CurtainNode {
  return {
    label: T.welcome.account,
    mark: <IconUserPlus size={28} aria-hidden="true" />,
    sky: 'linear-gradient(135deg, rgb(var(--bg-card)), color-mix(in oklab, rgb(var(--accent)) 55%, rgb(var(--bg-card))))',
  }
}
