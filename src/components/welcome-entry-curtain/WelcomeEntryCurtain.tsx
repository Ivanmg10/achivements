'use client'

import { useLanguage } from '@/context/LanguageContext'
import { CURTAIN_SWAP_MS } from '@/hooks/useWelcomeSteps'
import WelcomeCurtain from '@/components/welcome-curtain/WelcomeCurtain'
import { accountNode, stepNode } from '@/components/welcome-page/welcomeNodes'

/**
 * The curtain from "account created" to the welcome, in two halves on two
 * pages: the sign-up page plays it until the screen is covered and holds
 * there (`leaving`) while the welcome loads; the welcome picks it up at that
 * point (`arriving`) and lets it go.
 */
export default function WelcomeEntryCurtain({ phase }: { phase: 'leaving' | 'arriving' }) {
  const { T } = useLanguage()
  return (
    <WelcomeCurtain
      from={accountNode(T)}
      to={stepNode('intro', T)}
      word={T.welcome.words.intro}
      offsetMs={phase === 'arriving' ? CURTAIN_SWAP_MS : 0}
      holdAtMs={phase === 'leaving' ? CURTAIN_SWAP_MS : undefined}
    />
  )
}
