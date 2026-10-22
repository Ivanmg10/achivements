import { WELCOME_STEPS, type WelcomeTransition } from '@/hooks/useWelcomeSteps'
import { useLanguage } from '@/context/LanguageContext'
import WelcomeCurtain from '@/components/welcome-curtain/WelcomeCurtain'
import { stepNode } from '@/components/welcome-page/welcomeNodes'

/** The curtain between two of the welcome's steps; going back it runs the other way. */
export default function WelcomePageCurtain({ transition }: { transition: WelcomeTransition }) {
  const { T } = useLanguage()
  const to = WELCOME_STEPS[transition.to]
  return (
    <WelcomeCurtain
      from={stepNode(WELCOME_STEPS[transition.from], T)}
      to={stepNode(to, T)}
      word={T.welcome.words[to]}
      direction={transition.direction}
    />
  )
}
