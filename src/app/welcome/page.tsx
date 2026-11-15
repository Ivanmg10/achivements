import type { Metadata } from 'next'
import WelcomePage from '@/components/welcome-page/WelcomePage'
import { VaultFillProvider } from '@/context/VaultFillContext'

export const metadata: Metadata = {
  title: 'Welcome',
  robots: { index: false },
}

/**
 * Where a new account lands after signing up (signed-in only, by the proxy).
 * Outside the (main) group on purpose: the app's header comes after the welcome.
 * The Vault Points fill runs here already (the app's providers are not mounted),
 * so an account that came linked (Steam, RetroAchievements) is being read while
 * the person goes through the steps, and each linked step says how it goes.
 */
export default function Welcome() {
  return (
    <VaultFillProvider>
      <WelcomePage />
    </VaultFillProvider>
  )
}
